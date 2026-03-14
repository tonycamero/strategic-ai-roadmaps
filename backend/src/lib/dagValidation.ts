/**
 * DAG AUTHORITY VALIDATOR (lib)
 * 
 * Provides mathematical validation for Roadmap Graphs.
 * Ensures structural integrity, acyclic nature, and proposal anchoring.
 */

export interface ValidationNode {
    id: string;
    originProposalId?: string;
}

export interface ValidationEdge {
    from: string;
    to: string;
}

export interface ValidationResult {
    valid: boolean;
    reason?: string;
}

export class DagValidator {

    /**
     * entry point for roadmap graph validation.
     */
    static validate(
        nodes: ValidationNode[], 
        edges: ValidationEdge[], 
        envelopeProposalIds?: string[]
    ): ValidationResult {
        
        // 1. Basic Structure
        if (!nodes.length) return { valid: true };

        const nodeIds = new Set(nodes.map(n => n.id));

        // 2. Reference Integrity (Edges must point to existing nodes)
        for (const edge of edges) {
            if (!nodeIds.has(edge.from)) {
                return { valid: false, reason: `Invalid Edge: source node ${edge.from} not found` };
            }
            if (!nodeIds.has(edge.to)) {
                return { valid: false, reason: `Invalid Edge: target node ${edge.to} not found` };
            }
        }

        // 3. Authority Anchoring (Every node must trace to a moderated proposal in the envelope)
        if (envelopeProposalIds) {
            const envelopeSet = new Set(envelopeProposalIds);
            for (const node of nodes) {
                if (!node.originProposalId) {
                    return { valid: false, reason: `Authority Violation: node ${node.id} missing originProposalId` };
                }
                if (!envelopeSet.has(node.originProposalId)) {
                    return { valid: false, reason: `Authority Violation: node ${node.id} references proposal not in envelope` };
                }
            }
        }

        // 4. Acyclic Validation (DFS cycle detection)
        if (this.hasCycles(nodes, edges)) {
            return { valid: false, reason: "Structural Violation: Graph contains cycles" };
        }

        return { valid: true };
    }

    /**
     * Standard DFS-based cycle detection.
     */
    private static hasCycles(nodes: ValidationNode[], edges: ValidationEdge[]): boolean {
        const adj = new Map<string, string[]>();
        nodes.forEach(n => adj.set(n.id, []));
        edges.forEach(e => adj.get(e.from)?.push(e.to));

        const visited = new Set<string>();
        const stack = new Set<string>();

        const visit = (nodeId: string): boolean => {
            if (stack.has(nodeId)) return true; // Cycle detected
            if (visited.has(nodeId)) return false;

            visited.add(nodeId);
            stack.add(nodeId);

            const neighbors = adj.get(nodeId) || [];
            for (const neighbor of neighbors) {
                if (visit(neighbor)) return true;
            }

            stack.delete(nodeId);
            return false;
        };

        for (const node of nodes) {
            if (visit(node.id)) return true;
        }

        return false;
    }
}
