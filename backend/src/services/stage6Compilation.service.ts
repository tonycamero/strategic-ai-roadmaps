import { db } from '../db/index';
import { sopTickets, selectionEnvelopes, sasRuns, selectionEnvelopeItems, sasProposals } from '../db/schema';
import { eq, inArray, sql } from 'drizzle-orm';
import { ExecutionEnvelopeService } from './executionEnvelope.service';
import { CapabilityMatcherService } from './capabilityMatcher.service';
import { loadInventory } from '../trustagent/services/inventory.service';
import { randomUUID } from 'crypto';

export interface Stage6ActivationResult {
    envelopeId: string;
    totalEnvelopeItems: number;
    validatedItems: number;
    skippedItems: number;
    skippedCapabilityIds: string[];
    ticketsCreated: number;
    capabilitiesActivated: string[];
}

/**
 * Stage-6 Authority Spine Compiler
 * 
 * Orchestrates:
 * 1. Execution Envelope Enforcement
 * 2. Envelope Items Loading & Grouping
 * 3. Capability Validation (No LLM Inference)
 * 4. Ticket Provenance Extraction & Generation
 */
export class Stage6CompilationService {
    static async activateStage6(selectionEnvelopeId: string, requestId?: string): Promise<Stage6ActivationResult> {
        // 1. Load Execution Envelope (with firm constraints)
        const envelope = await ExecutionEnvelopeService.loadEnvelope(selectionEnvelopeId);

        // 2. Fetch envelope metadata (for provenance)
        // NOTE: selection_envelopes does NOT have sas_run_id. We resolve it via proposals.
        const [envelopeRecord] = await db.select({
            sasRunId: sasProposals.sasRunId
        })
            .from(selectionEnvelopeItems)
            .innerJoin(sasProposals, eq(selectionEnvelopeItems.proposalId, sasProposals.id))
            .where(eq(selectionEnvelopeItems.selectionEnvelopeId, selectionEnvelopeId))
            .limit(1);

        if (!envelopeRecord) {
            throw new Error(`ENVELOPE_METADATA_MISSING: No linked proposals found for envelope ${selectionEnvelopeId}`);
        }

        // Fetch Run state (for projection snapshot hash)
        const [runRecord] = await db.select({
            artifactState: sasRuns.artifactState
        })
            .from(sasRuns)
            .where(eq(sasRuns.id, envelopeRecord.sasRunId))
            .limit(1);

        const projectionHash = runRecord?.artifactState ? JSON.stringify(runRecord.artifactState) : 'UNKNOWN';
        const generationEventId = randomUUID();

        const items = await db.select()
            .from(selectionEnvelopeItems)
            .where(eq(selectionEnvelopeItems.selectionEnvelopeId, selectionEnvelopeId));

        const totalEnvelopeItems = items.length;

        if (!totalEnvelopeItems) {
            return {
                envelopeId: selectionEnvelopeId,
                totalEnvelopeItems: 0,
                validatedItems: 0,
                skippedItems: 0,
                skippedCapabilityIds: [],
                ticketsCreated: 0,
                capabilitiesActivated: []
            };
        }

        // Group finding IDs by capability
        const capabilityToFindings = new Map<string, string[]>();
        for (const item of items) {
            if (!item.capabilityId) continue; // Skip items without Stage-5 assigned capability

            if (!capabilityToFindings.has(item.capabilityId)) {
                capabilityToFindings.set(item.capabilityId, []);
            }
            capabilityToFindings.get(item.capabilityId)!.push(item.proposalId);
        }

        const ticketsToCreate: any[] = [];
        const activatedCapabilities: string[] = [];
        const inventory = loadInventory();
        const inventoryMap = new Map(inventory.map(i => [i.inventoryId, i]));

        let validatedItemsCount = 0;
        let skippedItemsCount = 0;
        const skippedCapabilityIds: string[] = [];

        // 3. Capability Validation & Resolution
        for (const [capabilityId, findingIds] of capabilityToFindings.entries()) {
            // For invariant check, we count capabilities as "items" since tickets are grouped by capability
            try {
                // S6-07: Strict validation, no LLM inference
                CapabilityMatcherService.validateCapabilityId(
                    capabilityId,
                    envelope.allowedNamespaces,
                    envelope.maxComplexity
                );

                validatedItemsCount++;

                const inventoryItem = inventoryMap.get(capabilityId);
                if (!inventoryItem) continue; // Should be caught by validation, but TS check

                // 4. Compile Tickets with Provenance (S6-07 & Part 10)
                const complexityMap: Record<string, string> = { 'low': 'T1', 'medium': 'T2', 'high': 'T3' };

                // Part 10: Deterministic ticketKey
                const hashContent = `${selectionEnvelopeId}:${capabilityId}:${inventoryItem.category}`;
                const ticketKey = require('crypto').createHash('sha256').update(hashContent).digest('hex');

                ticketsToCreate.push({
                    tenantId: envelope.tenantId,
                    ticketId: `${inventoryItem.category || 'GEN'}-${inventoryItem.inventoryId.substring(0, 4)}`,
                    inventoryId: inventoryItem.inventoryId,
                    title: inventoryItem.titleTemplate,
                    description: inventoryItem.description,
                    category: inventoryItem.category,
                    tier: complexityMap[inventoryItem.complexity] || 'T1',
                    status: 'generated',
                    moderationStatus: 'pending',
                    ticketType: 'sop',
                    selectionEnvelopeId: selectionEnvelopeId,
                    // PROVENANCE ENFORCEMENT
                    sourceFindingIds: findingIds,
                    envelopeVersion: envelope.rawEnvelope?.envelopeHash ? parseInt(envelope.rawEnvelope.envelopeHash as any) || 1 : 1,
                    generationEventId,
                    projectionHash,
                    ticketKey // Part 10
                });

                activatedCapabilities.push(inventoryItem.inventoryId);
            } catch (err) {
                console.warn(`[Stage6Compilation] Skipping capability ${capabilityId} due to validation error:`, err);
                skippedItemsCount++;
                skippedCapabilityIds.push(capabilityId);
                continue;
            }
        }

        const compiledTicketsCount = ticketsToCreate.length;
        if (compiledTicketsCount !== validatedItemsCount) {
            throw new Error(`STAGE6_CARDINALITY_INVARIANT_VIOLATION: compiled ${compiledTicketsCount} tickets, but validated ${validatedItemsCount} items`);
        }

        // 5. Persist Tickets (Idempotent UPSERT - Part 10)
        let ticketsPersistedCount = 0;
        if (compiledTicketsCount > 0) {
            const results = await db.insert(sopTickets)
                .values(ticketsToCreate)
                .onConflictDoUpdate({
                    target: sopTickets.ticketKey,
                    set: {
  selectionEnvelopeId: sql`excluded.selection_envelope_id`,
  inventoryId: sql`excluded.inventory_id`,
  title: sql`excluded.title`,
  description: sql`excluded.description`,
  category: sql`excluded.category`,
  tier: sql`excluded.tier`,
  sourceFindingIds: sql`excluded.source_finding_ids`,
  envelopeVersion: sql`excluded.envelope_version`,
  generationEventId: sql`excluded.generation_event_id`,
  projectionHash: sql`excluded.projection_hash`,
  updatedAt: sql`now()`
}
                })
                .returning();
            ticketsPersistedCount = results.length;
        }

        const stage6CompilationReport = {
            envelopeId: selectionEnvelopeId,
            totalEnvelopeItems,
            validatedItems: validatedItemsCount,
            skippedItems: skippedItemsCount,
            skippedCapabilityIds,
            ticketsCreated: compiledTicketsCount, // Report the compilation invariant length
            capabilitiesActivated: activatedCapabilities
        };

        console.log(`[Stage6Compilation] Report:`, stage6CompilationReport);

        return stage6CompilationReport;
    }
}
