import { db } from '../db/index';
import { sopTickets, roadmapGraphs, roadmapGraphNodes, roadmapGraphEdges, selectionEnvelopes } from '../db/schema';
import { eq } from 'drizzle-orm';
import { loadInventory } from '../trustagent/services/inventory.service';

export interface RoadmapNode {
    ticketId: string;
    inventoryId: string;
    capabilityId: string;     // Added for Stage 7 persistence
    namespace: string;
    complexityTier: string;
    stage: number;            // Added for Stage 7 persistence (phaseNumber)
}

export interface DependencyEdge {
    fromTicketId: string;     // The prerequisite ticket
    toTicketId: string;       // The ticket that depends on it
    dependencyType: 'hard' | 'soft' | 'sequence' | 'prerequisite'; // Updated to match request
}

export interface ExecutionPhase {
    phaseNumber: number;
    ticketIds: string[];
}

export interface ExecutionGraph {
    nodes: RoadmapNode[];
    edges: DependencyEdge[];
    phases: ExecutionPhase[];
}

export class Stage7GraphCompilerService {
    /**
     * Compile a deterministic execution graph from a selection envelope's ticket set.
     */
    static async compileGraph(selectionEnvelopeId: string): Promise<ExecutionGraph> {
        // 1. Load Tickets
        const tickets = await db.select()
            .from(sopTickets)
            .where(eq(sopTickets.selectionEnvelopeId, selectionEnvelopeId));

        if (!tickets.length) {
            return { nodes: [], edges: [], phases: [] };
        }

        // 2. Load Inventory for Dependency Resolution
        const inventory = loadInventory();
        const inventoryMap = new Map(inventory.map(i => [i.inventoryId, i]));

        const nodes: RoadmapNode[] = [];
        const edges: DependencyEdge[] = [];
        const ticketIdByInventoryId = new Map<string, string>();

        // 3. Compile Nodes & Map Tickets
        for (const ticket of tickets) {
            if (!ticket.inventoryId) continue;

            const inventoryItem = inventoryMap.get(ticket.inventoryId);
            const complexityMap: Record<string, string> = { 'low': 'T1', 'medium': 'T2', 'high': 'T3' };

            nodes.push({
                ticketId: ticket.id, // Use UUID for stable graph mapping
                inventoryId: ticket.inventoryId,
                capabilityId: ticket.inventoryId, // In Stage 6, capabilityId = inventoryId
                namespace: ticket.category || 'GEN',
                complexityTier: ticket.tier || (inventoryItem ? (complexityMap[inventoryItem.complexity] || 'T1') : 'T1'),
                stage: 0 // Will be populated by topological sort
            });

            ticketIdByInventoryId.set(ticket.inventoryId, ticket.id);
        }

// 4. Compile Edges
for (const ticket of tickets) {
    // Read dependencies directly from sop_tickets JSON column
    const deps = Array.isArray(ticket.dependencies)
        ? ticket.dependencies
        : JSON.parse(ticket.dependencies || '[]');

    for (const depTicketId of deps) {
        edges.push({
            fromTicketId: depTicketId,
            toTicketId: ticket.id,
            dependencyType: 'sequence'
        });
    }
}

        // 5. Compile Phases (Topological Sort)
        const phases: ExecutionPhase[] = [];
        const nodeIds = new Set(nodes.map(n => n.ticketId));
        const incomingEdgesCount = new Map<string, number>();
        const outgoingEdges = new Map<string, string[]>();

        // Initialize structures
        for (const nodeId of nodeIds) {
            incomingEdgesCount.set(nodeId, 0);
            outgoingEdges.set(nodeId, []);
        }

        // Populate graph structure
        for (const edge of edges) {
            const count = incomingEdgesCount.get(edge.toTicketId) || 0;
            incomingEdgesCount.set(edge.toTicketId, count + 1);

            const out = outgoingEdges.get(edge.fromTicketId) || [];
            out.push(edge.toTicketId);
            outgoingEdges.set(edge.fromTicketId, out);
        }

        let currentPhaseNumber = 1;
        let remainingNodes = new Set(nodeIds);

        while (remainingNodes.size > 0) {
            const currentPhaseNodes: string[] = [];

            // Find all nodes with 0 incoming edges
            for (const nodeId of remainingNodes) {
                if (incomingEdgesCount.get(nodeId) === 0) {
                    currentPhaseNodes.push(nodeId);
                }
            }

            // Cycle detection (if no nodes have 0 incoming edges but there are remaining nodes)
            if (currentPhaseNodes.length === 0 && remainingNodes.size > 0) {
                // Fallback: put remaining nodes in the final phase to avoid infinite loop
                phases.push({
                    phaseNumber: currentPhaseNumber,
                    ticketIds: Array.from(remainingNodes)
                });
                break;
            }

            // Add phase
            phases.push({
                phaseNumber: currentPhaseNumber,
                ticketIds: currentPhaseNodes
            });

            // Update nodes with their stage
            for (const nodeId of currentPhaseNodes) {
                const node = nodes.find(n => n.ticketId === nodeId);
                if (node) {
                    node.stage = currentPhaseNumber;
                }

                remainingNodes.delete(nodeId);
                const outNodes = outgoingEdges.get(nodeId) || [];
                for (const outNode of outNodes) {
                    const currentCount = incomingEdgesCount.get(outNode) || 0;
                    incomingEdgesCount.set(outNode, currentCount - 1);
                }
            }

            currentPhaseNumber++;
        }

        return {
            nodes,
            edges,
            phases
        };
    }

    /**
     * Compile and persist the roadmap graph for a given selection envelope.
     * Implements Part 1-6 of Stage-7 Roadmap Graph Persistence.
     */
    static async compileAndPersistGraph(selectionEnvelopeId: string): Promise<{ graphId: string; nodeCount: number; edgeCount: number }> {
        return await db.transaction(async (tx) => {
            // 1. Compile ExecutionGraph
            const graph = await this.compileGraph(selectionEnvelopeId);

            // Fetch envelope metadata (for tenantId and projectionHash)
            const [envelope] = await tx.select({
                tenantId: selectionEnvelopes.tenantId,
                envelopeHash: selectionEnvelopes.envelopeHash
            })
                .from(selectionEnvelopes)
                .where(eq(selectionEnvelopes.id, selectionEnvelopeId))
                .limit(1);

            if (!envelope) {
                throw new Error(`ENVELOPE_NOT_FOUND: ${selectionEnvelopeId}`);
            }

            // 2. Idempotency Guard (Part 5)
            const [existingGraph] = await tx.select({ id: roadmapGraphs.id })
                .from(roadmapGraphs)
                .where(eq(roadmapGraphs.selectionEnvelopeId, selectionEnvelopeId))
                .limit(1);

            if (existingGraph) {
                await tx.delete(roadmapGraphNodes).where(eq(roadmapGraphNodes.graphId, existingGraph.id));
                await tx.delete(roadmapGraphEdges).where(eq(roadmapGraphEdges.graphId, existingGraph.id));
                await tx.delete(roadmapGraphs).where(eq(roadmapGraphs.id, existingGraph.id));
            }

            // 3. Persist Graph Metadata (Part 2)
            const [newGraph] = await tx.insert(roadmapGraphs)
                .values({
                    tenantId: envelope.tenantId,
                    selectionEnvelopeId,
                    projectionHash: envelope.envelopeHash,
                    nodeCount: graph.nodes.length,
                    edgeCount: graph.edges.length
                })
                .returning();

            // 4. Persist Nodes (Part 3)
            if (graph.nodes.length > 0) {
                const nodeValues = graph.nodes.map(node => ({
                    graphId: newGraph.id,
                    sopTicketId: node.ticketId,
                    capabilityId: node.capabilityId,
                    namespace: node.namespace,
                    stage: node.stage
                }));
                await tx.insert(roadmapGraphNodes).values(nodeValues);
            }

            // 5. Persist Edges (Part 4)
            if (graph.edges.length > 0) {
                const edgeValues = graph.edges.map(edge => ({
                    graphId: newGraph.id,
                    fromTicketId: edge.fromTicketId,
                    toTicketId: edge.toTicketId,
                    dependencyType: edge.dependencyType as any // 'hard' | 'soft' | 'sequence'
                }));
                await tx.insert(roadmapGraphEdges).values(edgeValues);
            }

            // 6. Return Result (Part 6)
            return {
                graphId: newGraph.id,
                nodeCount: graph.nodes.length,
                edgeCount: graph.edges.length
            };
        });
    }
}
