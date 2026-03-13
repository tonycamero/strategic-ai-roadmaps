import { db } from '../db/index';
import { selectionEnvelopes, selectionEnvelopeItems, sasElections, sasProposals } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';
import { Stage7GraphCompilerService } from './stage7GraphCompiler.service';
import { resolveLatestRunId } from './tenantStateAggregation.service';

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
        // 0. Run Guard: Block envelope creation if not the latest run
        const latestRunId = await resolveLatestRunId(tenantId);
        if (sasRunId !== latestRunId) {
            console.warn("RUN_GUARD_TRIGGERED [Envelope]", {
                tenantId,
                requestedRunId: sasRunId,
                latestRunId
            });
            throw new Error("Envelope creation blocked: stale SAS run");
        }

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

        // 3. Compute Selection Hash using sorted proposal IDs (for lookups & determinism)
        const hashInput = acceptedItems.map(i => i.proposalId).sort().join(',');
        const selectionHash = crypto.createHash('sha256').update(hashInput).digest('hex');

        // 4. Compute Envelope Hash (versioned)
        const payload = tenantId + sasRunId + hashInput;
        const envelopeHash = crypto
            .createHash('sha256')
            .update(payload)
            .update('v2') // Version anchor for schema v2
            .digest('hex');

        // 5. Insert Envelope (deterministic per tenant/selection via LOOKUP)
        return await db.transaction(async (tx) => {
            const [existing] = await tx
                .select()
                .from(selectionEnvelopes)
                .where(
                    and(
                        eq(selectionEnvelopes.tenantId, tenantId),
                        eq(selectionEnvelopes.selectionHash, selectionHash)
                    )
                )
                .limit(1);

            if (existing) {
                return {
                    envelopeId: existing.id,
                    envelopeHash: (existing as any).envelopeHash
                };
            }

            // Insert new envelope with legacy-compliant columns
            // SELECTION_ENGINE_VERSION = '1.0.0', Registry version = '1.0.0'
            const [envelope] = await tx
                .insert(selectionEnvelopes)
                .values({
                    tenantId,
                    canonicalFindingsHash: 'PENDING_RECALC', // Placeholder or from context
                    registryVersion: '1.0.0',
                    envelopeVersion: '1.0.0',
                    executionEnvelope: { items: acceptedItems },
                    inventoryIds: acceptedItems.filter(i => i.proposalId).map(i => i.proposalId),
                    adapterIds: [], // Placeholder
                    findingIds: acceptedItems.map(i => i.proposalId),
                    selectionHash,
                    envelopeHash,
                    sasRunId,
                } as any)
                .returning();

            const itemValues = acceptedItems.map(item => ({
                selectionEnvelopeId: envelope.id,
                proposalId: item.proposalId,
                capabilityId: item.capabilityId,
                decision: 'keep'
            }));

            await tx.insert(selectionEnvelopeItems).values(itemValues);

            return {
                envelopeId: envelope.id,
                envelopeHash: (envelope as any).envelopeHash
            };
        });
    }
}
