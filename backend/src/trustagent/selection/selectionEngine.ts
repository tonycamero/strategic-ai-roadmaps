/**
 * SelectionEngine
 * EXEC-TICKET-SELECTION-ENGINE-IMPLEMENTATION-001
 *
 * Pure deterministic function — no DB reads, no projection calls, no LLM, no side effects.
 * All inputs injected. registryVersion and envelopeVersion injected via params (not globals).
 * Given identical inputs → identical output every time.
 */
import type { InventoryTicket, Complexity } from '../types/inventory';
import type { ExecutionEnvelope, SelectionEnvelope } from '../types/selectionEnvelope';
import { computeSelectionHash } from '../utils/selectionEnvelopeHash.util';

// ─── Complexity Rank ──────────────────────────────────────────────────────────
// MUST bump SELECTION_ENGINE_VERSION if this mapping changes.

const COMPLEXITY_RANK: Record<Complexity, number> = {
    low: 1,
    medium: 2,
    high: 3,
};

// ─── Gate Predicate ───────────────────────────────────────────────────────────

/**
 * Apply all 5 selection gates (conjunction — all must pass).
 * Does not mutate item or envelope.
 */
function passesAllGates(
    item: InventoryTicket,
    envelope: ExecutionEnvelope,
    sortedNamespaces: string[],
    sortedAdapters: string[],
): boolean {
    // Gate 1: Namespace — category must appear in allowed namespaces
    if (!sortedNamespaces.includes(item.category)) return false;

    // Gate 2: Adapter — explicit field only, no isSidecar inference
    if (!sortedAdapters.includes(item.adapter)) return false;

    // Gate 3: Complexity ceiling
    if (COMPLEXITY_RANK[item.complexity] > COMPLEXITY_RANK[envelope.maxComplexityTier]) return false;

    // Gate 4: Custom dev — item requires it but tenant has not enabled it
    if (item.requiresCustomDev && !envelope.customDevAllowed) return false;

    // Gate 5: Vertical — two-sided filter per spec §3a
    //   item.verticalTags === [] → neutral, eligible for any tenant vertical
    //   envelope.vertical === 'generic' → only neutral items pass
    //   otherwise: item must include tenant's vertical
    if (item.verticalTags.length > 0 && !item.verticalTags.includes(envelope.vertical)) return false;

    return true;
}

// ─── Engine Params ────────────────────────────────────────────────────────────

export interface BuildSelectionEnvelopeParams {
    tenantId: string;
    canonicalFindingsHash: string;
    canonicalFindingIds: string[];       // Full canonical input set (not filtered)
    executionEnvelope: ExecutionEnvelope;
    inventoryRegistry: InventoryTicket[];
    registryVersion: string;             // Injected — not read from global
    envelopeVersion: string;             // Injected — not read from global
}

// ─── Engine ───────────────────────────────────────────────────────────────────

/**
 * Build a deterministic SelectionEnvelope from injected inputs.
 *
 * Returns envelope payload without persistence fields (id, createdAt).
 * Persistence layer assigns those before DB insert.
 *
 * If filtering yields zero inventoryIds, returns a valid empty envelope.
 * Engine is not policy — it does not throw on empty selection.
 */
export function buildSelectionEnvelope(
    params: BuildSelectionEnvelopeParams,
): Omit<SelectionEnvelope, 'id' | 'createdAt'> {
    const {
        tenantId,
        canonicalFindingsHash,
        canonicalFindingIds,
        executionEnvelope,
        inventoryRegistry,
        registryVersion,
        envelopeVersion,
    } = params;

    // A. Normalize inputs — clone and sort all arrays, never mutate originals
    const sortedFindingIds = [...canonicalFindingIds]
        .filter(id => typeof id === 'string')
        .sort();

    const sortedNamespaces = [...executionEnvelope.namespaces].sort();
    const sortedAdapters = [...executionEnvelope.adapters].sort();

    const normalizedEnvelope: ExecutionEnvelope = {
        ...executionEnvelope,
        namespaces: sortedNamespaces,
        adapters: sortedAdapters,
    };

    // B. Filter inventory — conjunction of all 5 gates
    const selected = inventoryRegistry.filter(item =>
        passesAllGates(item, normalizedEnvelope, sortedNamespaces, sortedAdapters)
    );

    // C. Deterministic result assembly — all sorted
    const inventoryIds = selected.map(i => i.inventoryId).sort();
    const adapterIds = [...new Set(selected.map(i => i.adapter))].sort();

    // D. Hash computation — timestamps structurally excluded
    const selectionHash = computeSelectionHash({
        canonicalFindingsHash,
        registryVersion,
        envelopeVersion,
        executionEnvelope: normalizedEnvelope,
        inventoryIds,
        adapterIds,
        findingIds: sortedFindingIds,
    });

    return {
        tenantId,
        canonicalFindingsHash,
        registryVersion,
        envelopeVersion,
        executionEnvelope: normalizedEnvelope,
        inventoryIds,
        adapterIds,
        findingIds: sortedFindingIds,
        selectionHash,
    };
}
