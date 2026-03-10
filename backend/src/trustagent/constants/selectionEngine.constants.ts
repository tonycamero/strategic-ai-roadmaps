/**
 * SelectionEngine Version Constants
 * EXEC-TICKET-STAGE6-COMPILE-ENDPOINT-001
 *
 * BUMP POLICY — SELECTION_ENGINE_VERSION must increment when:
 *   - Any gate predicate changes (namespace, adapter, complexity, customDev, vertical)
 *   - COMPLEXITY_RANK mapping changes
 *   - Vertical gate semantics change
 *   - Hash normalization logic changes (sort order, stringify behavior)
 *   - SelectionHashInput shape changes
 *
 * Failure to bump after a rule change is a canon violation.
 *
 * BUMP POLICY — INVENTORY_REGISTRY_VERSION must increment when:
 *   - Any inventory item is added, removed, or has fields mutated
 */
export const INVENTORY_REGISTRY_VERSION = '1.0.0';
export const SELECTION_ENGINE_VERSION = '1.0.0';
