import { db } from '../db/index';
import { selectionEnvelopes, selectionEnvelopeItems, sasElections, sasProposals } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';
import { Stage7GraphCompilerService } from './stage7GraphCompiler.service';

export class SelectionEnvelopeService {
    /**
     * Creates a deterministic Selection Envelope from accepted SAS proposals.
     * This is the SSOT bridge between Stage-5 Moderation and Stage-6 Execution.
     */
    static async createSelectionEnvelope(
        tenantId: string,
        sasRunId: string,
        userId: string
    ): Promise<{ envelopeId: string; envelopeHash: string }> {
        // 1. Fetch Accepted Proposals (decision = 'keep')
        const elections = await db
            .select({
                proposalId: sasElections.proposalId,
                sourceAnchors: sasProposals.sourceAnchors,
            })
            .from(sasElections)
            .innerJoin(sasProposals, eq(sasElections.proposalId, sasProposals.id))
            .where(
                and(
                    eq(sasElections.tenantId, tenantId),
                    eq(sasProposals.sasRunId, sasRunId),
                    eq(sasElections.decision, 'keep')
                )
            );

        if (!elections.length) {
            throw new Error('NO_ACCEPTED_PROPOSALS');
        }

        // 2. Sort deterministically by proposalId
        // META-TICKET Stage-6 Part 7: Extract from JSONB
        const acceptedItems = elections.map(e => {
            const anchors = (e.sourceAnchors as any) || {};
            return {
                proposalId: e.proposalId,
                capabilityId: anchors.capabilityId || null,
            };
        });
        acceptedItems.sort((a, b) => a.proposalId.localeCompare(b.proposalId));

        // 3. Compute Hash using sorted proposal IDs
        const payload = tenantId + sasRunId + acceptedItems.map(i => i.proposalId).join(',');
        const envelopeHash = crypto
            .createHash('sha256')
            .update(payload)
            .update('v2') // Version anchor for schema v2
            .digest('hex');

        // 4. Insert Envelope (deterministic per tenant/run via UNIQUE index)
        return await db.transaction(async (tx) => {
            const [existing] = await tx
                .select()
                .from(selectionEnvelopes)
                .where(
                    and(
                        eq(selectionEnvelopes.tenantId, tenantId),
                        eq(selectionEnvelopes.sasRunId, sasRunId)
                    )
                )
                .limit(1);

            if (existing) {
                return {
                    envelopeId: existing.id,
                    envelopeHash: existing.envelopeHash
                };
            }

            // Insert new envelope
            const [envelope] = await tx
                .insert(selectionEnvelopes)
                .values({
                    tenantId,
                    sasRunId,
                    envelopeHash,
                    createdBy: userId,
                })
                .returning();

            // 5. Insert Envelope Items
            const itemValues = acceptedItems.map(item => ({
                envelopeId: envelope.id,
                proposalId: item.proposalId,
                capabilityId: item.capabilityId,
                decision: 'keep'
            }));

            await tx.insert(selectionEnvelopeItems).values(itemValues);

            return {
                envelopeId: envelope.id,
                envelopeHash: envelope.envelopeHash
            };
        });
    }
}
