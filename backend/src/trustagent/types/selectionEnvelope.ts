/**
 * SelectionEnvelope TypeScript interfaces
 * EXEC-TICKET-SELECTION-ENGINE-IMPLEMENTATION-001
 *
 * These types define the deterministic compiler artifact that binds
 * canonical findings to an inventory selection under a fixed registry/engine version.
 */
import type { Complexity, InventoryAdapter } from './inventory';

/**
 * ExecutionEnvelope — constraint surface passed to SelectionEngine.
 * Derived from projection + tenant config at call time.
 * Engine has zero projection dependency — receives this as a plain struct.
 */
export interface ExecutionEnvelope {
    namespaces: string[];           // Allowed InventoryCategory values
    adapters: InventoryAdapter[];   // Allowed adapter types (explicit enum)
    maxComplexityTier: Complexity;  // Ceiling: 'low' | 'medium' | 'high'
    customDevAllowed: boolean;      // Whether items with requiresCustomDev are permitted
    vertical: string;               // Canonical vertical (e.g. 'generic' | 'agency' | ...)
}

/**
 * SelectionEnvelope — persisted, immutable compiler artifact.
 * Produced once by SelectionEngine. Never mutated.
 */
export interface SelectionEnvelope {
    // Identity
    id: string;
    tenantId: string;

    // Binding anchors (form the unique key in DB)
    canonicalFindingsHash: string;  // From computeCanonicalFindingsHash()
    registryVersion: string;        // Semver of inventory registry (INVENTORY_REGISTRY_VERSION)
    envelopeVersion: string;        // Semver of SelectionEngine rules (SELECTION_ENGINE_VERSION)

    // Constraint snapshot — persisted for forensic auditability and replay
    executionEnvelope: ExecutionEnvelope;

    // Selection results — all arrays sorted before hash computation
    inventoryIds: string[];   // Sorted selected InventoryTicket.inventoryId[]
    adapterIds: string[];     // Sorted distinct adapter values from selected items
    findingIds: string[];     // Sorted IDs from FULL canonical input set (not filtered)

    // Determinism anchor
    selectionHash: string;    // SHA-256 of normalized payload (createdAt excluded)

    // Audit only — excluded from hash
    createdAt: string;
}
