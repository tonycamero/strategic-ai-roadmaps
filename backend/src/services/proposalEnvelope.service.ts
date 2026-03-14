import { db } from '../db/index';
import { selectionEnvelopes, selectionEnvelopeItems, sasElections, sasProposals } from '../db/schema';
import { eq, and, asc } from 'drizzle-orm';
import crypto from 'crypto';

export class ProposalEnvelopeService {
    /**
     * Creates a hardened, cryptographically sealed Proposal Envelope.
     * Rule: Only APPROVED proposals enter the envelope.
     */
    static async createProposalEnvelope(tenantId: string, parentEnvelopeId?: string) {
        return await db.transaction(async (tx) => {
            // 1. Fetch APPROVED proposals for the latest state
            // In our system, moderated proposals are linked to elections with 'keep' decision.
            const approvedProposals = await tx
                .select({
                    proposalId: sasProposals.id,
                    content: sasProposals.content,
                    type: sasProposals.proposalType
                })
                .from(sasElections)
                .innerJoin(sasProposals, eq(sasElections.proposalId, sasProposals.id))
                .where(
                    and(
                        eq(sasElections.tenantId, tenantId),
                        eq(sasElections.decision, 'keep')
                    )
                )
                .orderBy(asc(sasProposals.id)); // Deterministic sorting

            if (!approvedProposals.length) {
                throw new Error("CANNOT_SEAL_EMPTY_ENVELOPE: No approved proposals found.");
            }

            // 2. Generate Deterministic Hash Seal
            const serializedProposals = JSON.stringify(approvedProposals);
            const envelopeHash = crypto
                .createHash('sha256')
                .update(serializedProposals)
                .digest('hex');

            // 3. Version Resolution
            let nextVersion = 1;
            if (parentEnvelopeId) {
                const [parent] = await tx
                    .select({ envelopeVersion: selectionEnvelopes.envelopeVersion })
                    .from(selectionEnvelopes)
                    .where(eq(selectionEnvelopes.id, parentEnvelopeId))
                    .limit(1);
                
                if (parent) {
                    nextVersion = (parent.envelopeVersion || 0) + 1;
                }
            }

            // 4. Persist Envelope
            const [envelope] = await tx
                .insert(selectionEnvelopes)
                .values({
                    tenantId,
                    envelopeHash,
                    envelopeVersion: nextVersion,
                    parentEnvelopeId: parentEnvelopeId || null,
                    createdAt: new Date()
                })
                .returning();

            // 5. Persist Items
            const itemValues = approvedProposals.map(p => ({
                selectionEnvelopeId: envelope.id,
                proposalId: p.proposalId,
                decision: 'keep'
            }));

            await tx.insert(selectionEnvelopeItems).values(itemValues);

            console.log(`[ProposalEnvelope] Sealed envelope ${envelope.id} with hash ${envelopeHash.substring(0, 8)}...`);
            
            return {
                envelopeId: envelope.id,
                envelopeHash
            };
        });
    }
}
