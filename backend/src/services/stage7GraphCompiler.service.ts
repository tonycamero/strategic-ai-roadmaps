import { db } from '../db/index';
import {
    sopTickets,
    roadmapGraphs,
    roadmapGraphNodes,
    roadmapGraphEdges,
    selectionEnvelopes
} from '../db/schema';

import { eq } from 'drizzle-orm';
import { loadInventory } from '../trustagent/services/inventory.service';
import { DagAuthorityService } from './dagAuthority.service';

export interface RoadmapNode {
    ticketId: string;
    inventoryId: string;
    capabilityId: string;
    namespace: string;
    complexityTier: string;
    stage: number;
    originProposalId?: string;
}

export interface DependencyEdge {
    fromTicketId: string;
    toTicketId: string;
    dependencyType: 'hard' | 'soft' | 'sequence' | 'prerequisite';
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

    static async compileGraph(selectionEnvelopeId: string): Promise<ExecutionGraph> {

        const ticketsRaw = await db.select()
            .from(sopTickets)
            .where(eq(sopTickets.selectionEnvelopeId, selectionEnvelopeId));

        if (!ticketsRaw.length) {
            return { nodes: [], edges: [], phases: [] };
        }

        /**
         * ------------------------------------------------------------------
         * DETERMINISTIC ORDERING FIX
         * ------------------------------------------------------------------
         * Sort tickets before graph construction so runs are stable.
         */

        const executionOrder: Record<string, number> = {
            INVESTIGATE: 1,
            VERIFY_CONSTRAINT: 2,
            BUILD_CAPABILITY: 3
        };

        const tickets = [...ticketsRaw].sort((a, b) => {

            const aOrder = executionOrder[a.ticketType || ''] ?? 99;
            const bOrder = executionOrder[b.ticketType || ''] ?? 99;

            if (aOrder !== bOrder) return aOrder - bOrder;

            const aKey = a.ticketKey || a.title || '';
            const bKey = b.ticketKey || b.title || '';

            return aKey.localeCompare(bKey);
        });

        /**
         * ------------------------------------------------------------------
         * LOAD INVENTORY
         * ------------------------------------------------------------------
         */

        const inventory = loadInventory();
        const inventoryMap = new Map(inventory.map(i => [i.inventoryId, i]));

        const nodes: RoadmapNode[] = [];
        const edges: DependencyEdge[] = [];

        const complexityMap: Record<string, string> = {
            low: 'T1',
            medium: 'T2',
            high: 'T3'
        };

        /**
         * ------------------------------------------------------------------
         * BUILD NODES
         * ------------------------------------------------------------------
         */

        for (const ticket of tickets) {

            if (!ticket.inventoryId) continue;

            const inventoryItem = inventoryMap.get(ticket.inventoryId);

            nodes.push({
                ticketId: ticket.id,
                inventoryId: ticket.inventoryId,
                capabilityId: ticket.inventoryId,
                namespace: ticket.category || 'GEN',
                complexityTier:
                    ticket.tier ||
                    (inventoryItem
                        ? complexityMap[inventoryItem.complexity] || 'T1'
                        : 'T1'),
                stage: 0,
                originProposalId: (ticket as any).originProposalId || undefined
            });
        }

        /**
         * Ensure deterministic node order
         */

        nodes.sort((a, b) => a.ticketId.localeCompare(b.ticketId));

        /**
         * ------------------------------------------------------------------
         * BUILD EDGES
         * ------------------------------------------------------------------
         */

        for (const ticket of tickets) {

            let deps: string[] = [];

            if (Array.isArray(ticket.dependencies)) {
                deps = ticket.dependencies;
            } else if (typeof ticket.dependencies === 'string') {
                try {
                    deps = JSON.parse(ticket.dependencies);
                } catch {
                    deps = [];
                }
            }

            deps.sort();

            for (const depTicketId of deps) {

                edges.push({
                    fromTicketId: depTicketId,
                    toTicketId: ticket.id,
                    dependencyType: 'sequence'
                });
            }
        }

        /**
         * Deterministic edge ordering
         */

        edges.sort((a, b) => {

            if (a.fromTicketId !== b.fromTicketId)
                return a.fromTicketId.localeCompare(b.fromTicketId);

            return a.toTicketId.localeCompare(b.toTicketId);
        });

        /**
         * ------------------------------------------------------------------
         * TOPOLOGICAL SORT (PHASE BUILDING)
         * ------------------------------------------------------------------
         */

        const phases: ExecutionPhase[] = [];

        const nodeIds = new Set(nodes.map(n => n.ticketId));

        const incomingEdgesCount = new Map<string, number>();
        const outgoingEdges = new Map<string, string[]>();

        for (const nodeId of nodeIds) {
            incomingEdgesCount.set(nodeId, 0);
            outgoingEdges.set(nodeId, []);
        }

        for (const edge of edges) {

            const count = incomingEdgesCount.get(edge.toTicketId) || 0;
            incomingEdgesCount.set(edge.toTicketId, count + 1);

            const out = outgoingEdges.get(edge.fromTicketId) || [];
            out.push(edge.toTicketId);

            out.sort();

            outgoingEdges.set(edge.fromTicketId, out);
        }

        let currentPhaseNumber = 1;
        let remainingNodes = new Set(nodeIds);

        while (remainingNodes.size > 0) {
    const currentPhaseNodes: string[] = [];

    const sortedRemaining = Array.from(remainingNodes).sort();

    for (const nodeId of sortedRemaining) {
        if (incomingEdgesCount.get(nodeId) === 0) {
            currentPhaseNodes.push(nodeId);
        }
    }

            /**
             * Cycle protection fallback
             */

            if (currentPhaseNodes.length === 0) {

                phases.push({
                    phaseNumber: currentPhaseNumber,
                    ticketIds: [...remainingNodes].sort()
                });

                break;
            }

            phases.push({
                phaseNumber: currentPhaseNumber,
                ticketIds: currentPhaseNodes
            });

            for (const nodeId of currentPhaseNodes) {

                const node = nodes.find(n => n.ticketId === nodeId);

                if (node) node.stage = currentPhaseNumber;

                remainingNodes.delete(nodeId);

                const outNodes = outgoingEdges.get(nodeId) || [];

                for (const outNode of outNodes) {

                    const currentCount = incomingEdgesCount.get(outNode) || 0;

                    incomingEdgesCount.set(outNode, currentCount - 1);
                }
            }

            currentPhaseNumber++;
        }

        return { nodes, edges, phases };
    }

    /**
     * ------------------------------------------------------------------
     * COMPILE + PERSIST GRAPH
     * ------------------------------------------------------------------
     */

    static async compileAndPersistGraph(selectionEnvelopeId: string) {

        return await db.transaction(async (tx) => {
            const graph = await this.compileGraph(selectionEnvelopeId);

            // [SAR_SHIELD_AUTHORITY_GATE]
            // Validate the graph results against the sealed envelope
            const validation = await DagAuthorityService.validateRoadmapDag(
                selectionEnvelopeId,
                graph.nodes.map(n => ({ id: n.ticketId, originProposalId: n.originProposalId })),
                graph.edges.map(e => ({ from: e.fromTicketId, to: e.toTicketId }))
            );

            if (!validation.valid) {
                console.error(`[Stage7GraphCompiler] AUTHORITY_VIOLATION: ${validation.reason}`);
                throw new Error(`ROADMAP_ACTIVATION_BLOCKED: ${validation.reason}`);
            }

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

            /**
             * Idempotent rebuild
             */

            const [existingGraph] = await tx.select({ id: roadmapGraphs.id })
                .from(roadmapGraphs)
                .where(eq(roadmapGraphs.selectionEnvelopeId, selectionEnvelopeId))
                .limit(1);

            if (existingGraph) {

                await tx.delete(roadmapGraphNodes)
                    .where(eq(roadmapGraphNodes.graphId, existingGraph.id));

                await tx.delete(roadmapGraphEdges)
                    .where(eq(roadmapGraphEdges.graphId, existingGraph.id));

                await tx.delete(roadmapGraphs)
                    .where(eq(roadmapGraphs.id, existingGraph.id));
            }

            const [newGraph] = await tx.insert(roadmapGraphs)
                .values({
                    tenantId: envelope.tenantId,
                    selectionEnvelopeId,
                    projectionHash: envelope.envelopeHash,
                    nodeCount: graph.nodes.length,
                    edgeCount: graph.edges.length
                })
                .returning();

            if (graph.nodes.length) {

                const nodeValues = graph.nodes.map(n => ({
                    graphId: newGraph.id,
                    sopTicketId: n.ticketId,
                    capabilityId: n.capabilityId,
                    namespace: n.namespace,
                    stage: n.stage
                }));

                await tx.insert(roadmapGraphNodes).values(nodeValues);
            }

            if (graph.edges.length) {

                const edgeValues = graph.edges.map(e => ({
                    graphId: newGraph.id,
                    fromTicketId: e.fromTicketId,
                    toTicketId: e.toTicketId,
                    dependencyType: e.dependencyType as any
                }));

                await tx.insert(roadmapGraphEdges).values(edgeValues);
            }

            return {
                graphId: newGraph.id,
                nodeCount: graph.nodes.length,
                edgeCount: graph.edges.length
            };
        });
    }
}