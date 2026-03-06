/**
 * Stage 6 Compilation Service
 * EXEC-TICKET-STAGE6-COMPILE-ENDPOINT-001
 *
 * Deterministic, idempotent SelectionEnvelope compilation.
 * Consumes projection → invokes SelectionEngine → persists SelectionEnvelope.
 * Never triggers moderation, never mutates projection.
 *
 * ExecutionEnvelope is derived strictly from projection.stage6
 * (which reads from tenant_stage6_config). No inference. No defaults.
 */
import { db } from '../db/index';
import { selectionEnvelopes } from '../db/schema';
import { and, eq, desc } from 'drizzle-orm';
import { getTenantLifecycleView } from './tenantStateAggregation.service';
import { buildSelectionEnvelope } from '../trustagent/selection/selectionEngine';
import { loadInventory } from '../trustagent/services/inventory.service';
import {
    INVENTORY_REGISTRY_VERSION,
    SELECTION_ENGINE_VERSION,
} from '../trustagent/constants/selectionEngine.constants';
import type { ExecutionEnvelope } from '../trustagent/types/selectionEnvelope';

// ─── Result Shape ─────────────────────────────────────────────────────────────

export interface CompileEnvelopeResult {
    envelopeId: string;
    selectionHash: string;
    registryVersion: string;
    envelopeVersion: string;
    idempotent: boolean;
}

// ─── Unique Violation Check ───────────────────────────────────────────────────

function isUniqueViolation(error: unknown): boolean {
    const msg = error instanceof Error ? error.message : String(error);
    return msg.includes('unique') || msg.includes('duplicate') || msg.includes('23505');
}

// ─── Service: Compile Envelope ────────────────────────────────────────────────

/**
 * Compile a deterministic SelectionEnvelope for the tenant.
 *
 * ExecutionEnvelope is derived strictly from projection.stage6.
 * If constraint config is missing, compilation fails closed.
 *
 * Idempotent: if an envelope already exists for the same
 * (tenant_id, canonical_findings_hash, registry_version, envelope_version)
 * combination, returns the existing record.
 *
 * @throws Error('CANONICAL_FINDINGS_REQUIRED') if projection has no findings
 * @throws Error('STAGE6_CONSTRAINT_CONFIG_MISSING') if tenant_stage6_config row absent
 */
export async function compileSelectionEnvelope(
    tenantId: string,
): Promise<CompileEnvelopeResult> {
    // 1. Read projection (single source of truth)
    const projection = await getTenantLifecycleView(tenantId);

    // 2. Require constraint config — fail closed
    if (!projection.stage6.constraintConfigExists) {
        throw new Error('STAGE6_CONSTRAINT_CONFIG_MISSING');
    }

    // 3. Require canonical findings
    if (!projection.artifacts.canonicalFindings) {
        throw new Error('CANONICAL_FINDINGS_REQUIRED');
    }

    const { hash: canonicalFindingsHash, ids: canonicalFindingIds } =
        projection.artifacts.canonicalFindings;

    // 4. Derive ExecutionEnvelope strictly from projection.stage6
    //    No inference. No defaults. No derivation from firmSizeTier.
    const executionEnvelope: ExecutionEnvelope = {
        namespaces: projection.stage6.allowedNamespaces,
        adapters: projection.stage6.allowedAdapters as ('ghl' | 'sidecar')[],
        maxComplexityTier: projection.stage6.maxComplexityTier!,
        customDevAllowed: projection.stage6.customDevAllowed!,
        vertical: projection.stage6.vertical!,
    };

    // 5. Load registry (static)
    const inventoryRegistry = loadInventory();

    // 6. Build deterministic envelope payload
    const payload = buildSelectionEnvelope({
        tenantId,
        canonicalFindingsHash,
        canonicalFindingIds,
        executionEnvelope,
        inventoryRegistry,
        registryVersion: INVENTORY_REGISTRY_VERSION,
        envelopeVersion: SELECTION_ENGINE_VERSION,
    });

    // 7. Idempotent insert
    try {
        const [inserted] = await db
            .insert(selectionEnvelopes)
            .values({
                tenantId: payload.tenantId,
                canonicalFindingsHash: payload.canonicalFindingsHash,
                registryVersion: payload.registryVersion,
                envelopeVersion: payload.envelopeVersion,
                executionEnvelope: payload.executionEnvelope as any,
                inventoryIds: payload.inventoryIds as any,
                adapterIds: payload.adapterIds as any,
                findingIds: payload.findingIds as any,
                selectionHash: payload.selectionHash,
            })
            .returning();

        return {
            envelopeId: inserted.id,
            selectionHash: inserted.selectionHash,
            registryVersion: inserted.registryVersion,
            envelopeVersion: inserted.envelopeVersion,
            idempotent: false,
        };
    } catch (err) {
        if (!isUniqueViolation(err)) {
            throw err;
        }

        // UNIQUE constraint hit — return existing envelope
        const [existing] = await db
            .select()
            .from(selectionEnvelopes)
            .where(
                and(
                    eq(selectionEnvelopes.tenantId, tenantId),
                    eq(selectionEnvelopes.canonicalFindingsHash, canonicalFindingsHash),
                    eq(selectionEnvelopes.registryVersion, INVENTORY_REGISTRY_VERSION),
                    eq(selectionEnvelopes.envelopeVersion, SELECTION_ENGINE_VERSION),
                )
            )
            .orderBy(desc(selectionEnvelopes.createdAt))
            .limit(1);

        return {
            envelopeId: existing.id,
            selectionHash: existing.selectionHash,
            registryVersion: existing.registryVersion,
            envelopeVersion: existing.envelopeVersion,
            idempotent: true,
        };
    }
}
