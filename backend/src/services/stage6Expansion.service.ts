import { db } from '../db/index';
import { selectionEnvelopeItems, sasProposals } from '../db/schema';
import { eq, inArray } from 'drizzle-orm';

export type TicketProvenance = 'canonical_anchor' | 'diagnostic_expansion' | 'risk_amplification';

export interface ExpandedTicketCandidate {
    inventoryId: string;
    sourceFindingIds: string[];
    provenanceType: TicketProvenance;
    candidateText: string;
    contextData?: any;
}

export class Stage6ExpansionService {
    /**
     * Expand canonical findings into candidate execution actions
     */
    static async expandFindings(
        selectionEnvelopeId: string,
        diagnosticContext?: any,
        roiBaseline?: any
    ): Promise<ExpandedTicketCandidate[]> {
        // 1. Load items from the Selection Envelope
        const items = await db.select()
            .from(selectionEnvelopeItems)
            .where(eq(selectionEnvelopeItems.selectionEnvelopeId, selectionEnvelopeId));

        if (items.length === 0) {
            return [];
        }

        // 2. Load proposal details (to get capabilityId and original text)
        const proposalIds = items.map(i => i.proposalId);
        const proposals = await db.select()
            .from(sasProposals)
            .where(inArray(sasProposals.id, proposalIds));

        const candidates: ExpandedTicketCandidate[] = [];

        // PASS 1: Direct finding -> inventory mapping
        // META-TICKET SAS-CAPABILITY-ROLLBACK-01: Extract capabilityId from sourceAnchors JSONB
        for (const proposal of proposals) {
            const anchors = (proposal.sourceAnchors as any[]) || [];
            const inferenceAnchor = anchors.find((a: any) => a.sourceType === 'sas_inference');
            const capabilityId = inferenceAnchor?.capabilityId;
            if (capabilityId) {
                candidates.push({
                    inventoryId: capabilityId,
                    sourceFindingIds: [proposal.id], // The proposal linked to finding
                    provenanceType: 'canonical_anchor',
                    candidateText: proposal.content,
                    contextData: { proposalType: proposal.proposalType }
                });
            }
        }

        // PASS 2: Structural amplification (Placeholder for pre-defined expansion rules)
        // Example: If we have a FrictionPoint, we might add a 'Root Cause Analysis' expansion
        // For now, this stays minimal as Stage-6 must be deterministic.

        // PASS 3: Risk monitoring (Placeholder for pre-defined risk rules)

        return candidates;
    }
}
