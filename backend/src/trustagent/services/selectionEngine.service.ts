/**
 * SelectionEngine
 * EXEC-TICKET-SELECTION-ENGINE-IMPLEMENTATION-001
 *
 * Pure deterministic function — no DB reads, no LLM, no projection access.
 * Registry and ExecutionEnvelope injected at call time.
 *
 * envelopeVersion bump policy: MUST increment whenever any rule, rank mapping,
 * vertical semantics, adapter gate logic, or hash normalization changes.
 */
import type { InventoryTicket, Complexity } from '../types/inventory';
import type { ExecutionEnvelope, SelectionEnvelope } from '../types/selectionEnvelope';
import { computeSelectionHash } from '../utils/selectionEnvelopeHash.util';

// ─── Version Constants ────────────────────────────────────────────────────────

/**
 * INVENTORY_REGISTRY_VERSION: Semver of the loaded inventory data.
 * Bump when any inventory item is added, removed, or field-mutated.
 */
export const INVENTORY_REGISTRY_VERSION = '1.0.0';

/**
 * SELECTION_ENGINE_VERSION: Semver of SelectionEngine rule logic.
 * Bump when any gate predicate, complexity rank, vertical semantics,
 * or hash normalization changes — regardless of registry changes.
 */
export const SELECTION_ENGINE_VERSION = '1.0.0';

// ─── Complexity Rank ──────────────────────────────────────────────────────────

const COMPLEXITY_RANK: Record<Complexity, number> = {
    low: 1,
    medium: 2,
    high: 3,
};

// ─── Engine ───────────────────────────────────────────────────────────────────

/**
 * Apply all 5 selection gates to a single inventory item.
 * Returns true iff the item passes ALL gates (conjunction — no partial inclusion).
 */
function passesAllGates(item: InventoryTicket, envelope: ExecutionEnvelope): boolean {
    // Gate 1: Namespace — category must be explicitly allowed
    if (!envelope.namespaces.includes(item.category)) return false;

    // Gate 2: Adapter — explicit field, no inference
    if (!envelope.adapters.includes(item.adapter)) return false;

    // Gate 3: Complexity ceiling
    if (COMPLEXITY_RANK[item.complexity] > COMPLEXITY_RANK[envelope.maxComplexityTier]) return false;

    // Gate 4: Custom dev — item requires custom dev but tenant has not enabled it
    if (item.requiresCustomDev && !envelope.customDevAllowed) return false;

    // Gate 5: Vertical — two-sided filter (see spec §3a)
    //   item.verticalTags === [] → neutral, always eligible
    //   envelope.vertical === 'generic' → only neutral items pass
    //   otherwise: item must include tenant vertical
    const vertical = envelope.vertical;
    if (item.verticalTags.length > 0 && !item.verticalTags.includes(vertical)) return false;

    return true;
}

/**
 * Build a deterministic SelectionEnvelope from injected inputs.
 *
 * Pure function — no side effects, no DB access, no randomness.
 * Given identical inputs → identical output (inventoryIds, adapterIds, findingIds, selectionHash).
 *
 * @param canonicalFindings - Full canonical finding input set (not filtered)
 * @param canonicalFindingsHash - Pre-computed hash of canonical findings (from computeCanonicalFindingsHash)
 * @param executionEnvelope - Constraint surface derived from projection + tenant config
 * @param inventoryRegistry - Full inventory registry (injected — no internal load)
 * @param tenantId - Tenant identifier for the resulting envelope
 */
export function buildSelectionEnvelope(
    canonicalFindings: Array<{ id: string }>,
    canonicalFindingsHash: string,
    executionEnvelope: ExecutionEnvelope,
    inventoryRegistry: InventoryTicket[],
    tenantId: string,
): Omit<SelectionEnvelope, 'id' | 'createdAt'> {
    // Select items that pass all gates
    const selected = inventoryRegistry.filter(item => passesAllGates(item, executionEnvelope));

    // Build sorted result arrays
    const inventoryIds = selected.map(i => i.inventoryId).sort();
    const adapterIds = [...new Set(selected.map(i => i.adapter))].sort();
    const findingIds = canonicalFindings
        .map(f => f.id)
        .filter(id => typeof id === 'string')
        .sort();

    // Compute deterministic hash (timestamps structurally excluded from input)
    const selectionHash = computeSelectionHash({
        canonicalFindingsHash,
        registryVersion: INVENTORY_REGISTRY_VERSION,
        envelopeVersion: SELECTION_ENGINE_VERSION,
        executionEnvelope,
        inventoryIds,
        adapterIds,
        findingIds,
    });

    return {
        tenantId,
        canonicalFindingsHash,
        registryVersion: INVENTORY_REGISTRY_VERSION,
        envelopeVersion: SELECTION_ENGINE_VERSION,
        executionEnvelope,
        inventoryIds,
        adapterIds,
        findingIds,
        selectionHash,
    };
}
