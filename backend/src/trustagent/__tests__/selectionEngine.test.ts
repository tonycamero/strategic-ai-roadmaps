/**
 * SelectionEngine Test Suite
 * EXEC-TICKET-SELECTION-ENGINE-IMPLEMENTATION-001
 *
 * Full determinism harness for buildSelectionEnvelope.
 * Pure tests — no DB, no mocks, no LLM.
 */
import { describe, it, expect } from 'vitest';
import { buildSelectionEnvelope, BuildSelectionEnvelopeParams } from '../selection/selectionEngine';
import type { InventoryTicket } from '../types/inventory';
import type { ExecutionEnvelope } from '../types/selectionEnvelope';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const REGISTRY_VERSION = '1.0.0';
const ENVELOPE_VERSION = '1.0.0';
const TENANT_ID = 'tenant-abc';
const FINDINGS_HASH = 'aabbccdd1122334455667788aabbccdd1122334455667788aabbccdd11223344';

const BASE_ENVELOPE: ExecutionEnvelope = {
    namespaces: ['Pipeline', 'Ops'],
    adapters: ['ghl', 'sidecar'],
    maxComplexityTier: 'high',
    customDevAllowed: false,
    vertical: 'generic',
};

const FINDING_IDS = ['FND-003', 'FND-001', 'FND-002'];

const mockRegistry: InventoryTicket[] = [
    {
        inventoryId: 'INV-001',
        titleTemplate: 'GHL Pipeline SOP',
        category: 'Pipeline',
        valueCategory: 'Lead Intake',
        adapter: 'ghl',
        requiresCustomDev: false,
        ghlComponents: ['Workflows'],
        implementationStatus: 'production-ready',
        description: 'Pipeline SOP',
        implementationPattern: 'Pipeline SOP',
        complexity: 'low',
        dependencies: [],
        verticalTags: [],
        isSidecar: false,
    },
    {
        inventoryId: 'INV-002',
        titleTemplate: 'Sidecar Monitor',
        category: 'Ops',
        valueCategory: 'Process Standardization',
        adapter: 'sidecar',
        requiresCustomDev: true,
        ghlComponents: [],
        implementationStatus: 'pilot-available',
        description: 'Sidecar monitoring SOP',
        implementationPattern: 'Sidecar monitoring',
        complexity: 'medium',
        dependencies: [],
        verticalTags: [],
        isSidecar: true,
    },
    {
        inventoryId: 'INV-003',
        titleTemplate: 'High Complexity Ops',
        category: 'Ops',
        valueCategory: 'Process Standardization',
        adapter: 'ghl',
        requiresCustomDev: false,
        ghlComponents: ['Workflows'],
        implementationStatus: 'production-ready',
        description: 'High complexity SOP',
        implementationPattern: 'High complexity',
        complexity: 'high',
        dependencies: [],
        verticalTags: [],
        isSidecar: false,
    },
    {
        inventoryId: 'INV-004',
        titleTemplate: 'Agency-Specific SOP',
        category: 'Pipeline',
        valueCategory: 'Lead Intake',
        adapter: 'ghl',
        requiresCustomDev: false,
        ghlComponents: ['Workflows'],
        implementationStatus: 'production-ready',
        description: 'Agency-only SOP',
        implementationPattern: 'Agency-only',
        complexity: 'low',
        dependencies: [],
        verticalTags: ['agency'],
        isSidecar: false,
    },
    {
        inventoryId: 'INV-005',
        titleTemplate: 'Custom Dev Required',
        category: 'Pipeline',
        valueCategory: 'Lead Intake',
        adapter: 'ghl',
        requiresCustomDev: true,
        ghlComponents: [],
        implementationStatus: 'pilot-available',
        description: 'Custom dev SOP',
        implementationPattern: 'Custom dev',
        complexity: 'low',
        dependencies: [],
        verticalTags: [],
        isSidecar: false,
    },
];

function makeParams(overrides: Partial<BuildSelectionEnvelopeParams> = {}): BuildSelectionEnvelopeParams {
    return {
        tenantId: TENANT_ID,
        canonicalFindingsHash: FINDINGS_HASH,
        canonicalFindingIds: [...FINDING_IDS],
        executionEnvelope: { ...BASE_ENVELOPE },
        inventoryRegistry: mockRegistry,
        registryVersion: REGISTRY_VERSION,
        envelopeVersion: ENVELOPE_VERSION,
        ...overrides,
    };
}

// ─── Determinism Tests ────────────────────────────────────────────────────────

describe('buildSelectionEnvelope — Determinism', () => {

    it('Same inputs → identical selectionHash on repeated calls', () => {
        const h1 = buildSelectionEnvelope(makeParams()).selectionHash;
        const h2 = buildSelectionEnvelope(makeParams()).selectionHash;
        expect(h1).toBe(h2);
        expect(h1).toMatch(/^[a-f0-9]{64}$/);
    });

    it('Reordered canonicalFindingIds → same hash', () => {
        const a = buildSelectionEnvelope(makeParams({ canonicalFindingIds: ['FND-001', 'FND-002', 'FND-003'] })).selectionHash;
        const b = buildSelectionEnvelope(makeParams({ canonicalFindingIds: ['FND-003', 'FND-001', 'FND-002'] })).selectionHash;
        expect(a).toBe(b);
    });

    it('Reordered inventoryRegistry array → same hash', () => {
        const reversed = [...mockRegistry].reverse();
        const a = buildSelectionEnvelope(makeParams()).selectionHash;
        const b = buildSelectionEnvelope(makeParams({ inventoryRegistry: reversed })).selectionHash;
        expect(a).toBe(b);
    });

    it('Reordered executionEnvelope arrays → same hash', () => {
        const envA = { ...BASE_ENVELOPE, namespaces: ['Pipeline', 'Ops'], adapters: ['ghl', 'sidecar'] };
        const envB = { ...BASE_ENVELOPE, namespaces: ['Ops', 'Pipeline'], adapters: ['sidecar', 'ghl'] };
        const a = buildSelectionEnvelope(makeParams({ executionEnvelope: envA })).selectionHash;
        const b = buildSelectionEnvelope(makeParams({ executionEnvelope: envB })).selectionHash;
        expect(a).toBe(b);
    });

    it('findingIds in result are sorted regardless of input order', () => {
        const result = buildSelectionEnvelope(makeParams({ canonicalFindingIds: ['FND-003', 'FND-001', 'FND-002'] }));
        expect(result.findingIds).toEqual(['FND-001', 'FND-002', 'FND-003']);
    });

    it('inventoryIds in result are sorted', () => {
        const result = buildSelectionEnvelope(makeParams());
        const sorted = [...result.inventoryIds];
        expect(result.inventoryIds).toEqual(sorted.sort());
    });

});

// ─── Constraint Enforcement ───────────────────────────────────────────────────

describe('buildSelectionEnvelope — Constraint Enforcement', () => {

    it('Removing sidecar adapter → sidecar items excluded', () => {
        const env = { ...BASE_ENVELOPE, adapters: ['ghl'] as any };
        const result = buildSelectionEnvelope(makeParams({ executionEnvelope: env }));
        expect(result.inventoryIds).not.toContain('INV-002');
        // customDevAllowed false also gates INV-005 — but INV-001, INV-003 should still be present
        expect(result.inventoryIds).toContain('INV-001');
    });

    it('Lower complexity ceiling → high items excluded', () => {
        const env = { ...BASE_ENVELOPE, customDevAllowed: true, maxComplexityTier: 'low' as const };
        const result = buildSelectionEnvelope(makeParams({ executionEnvelope: env }));
        expect(result.inventoryIds).not.toContain('INV-003'); // high complexity
        expect(result.inventoryIds).not.toContain('INV-002'); // sidecar, medium
        expect(result.inventoryIds).toContain('INV-001');
    });

    it('customDevAllowed false → requiresCustomDev items excluded', () => {
        const env = { ...BASE_ENVELOPE, customDevAllowed: false };
        const result = buildSelectionEnvelope(makeParams({ executionEnvelope: env }));
        expect(result.inventoryIds).not.toContain('INV-002'); // requiresCustomDev: true
        expect(result.inventoryIds).not.toContain('INV-005'); // requiresCustomDev: true
    });

    it('customDevAllowed true → requiresCustomDev items included (if other gates pass)', () => {
        const env = { ...BASE_ENVELOPE, customDevAllowed: true };
        const result = buildSelectionEnvelope(makeParams({ executionEnvelope: env }));
        expect(result.inventoryIds).toContain('INV-002'); // sidecar + requiresCustomDev — now passes
        expect(result.inventoryIds).toContain('INV-005');
    });

    it('Vertical mismatch → specific-vertical items excluded', () => {
        // INV-004 has verticalTags: ['agency'] — should be excluded for 'generic' tenant
        const env = { ...BASE_ENVELOPE, vertical: 'generic' };
        const result = buildSelectionEnvelope(makeParams({ executionEnvelope: env }));
        expect(result.inventoryIds).not.toContain('INV-004');
    });

    it('Vertical match → specific-vertical items included', () => {
        const env = { ...BASE_ENVELOPE, vertical: 'agency' };
        const result = buildSelectionEnvelope(makeParams({ executionEnvelope: env }));
        expect(result.inventoryIds).toContain('INV-004');
    });

    it('Vertical neutral item (verticalTags: []) → always eligible regardless of tenant vertical', () => {
        const envGeneric = { ...BASE_ENVELOPE, vertical: 'generic' };
        const envAgency = { ...BASE_ENVELOPE, vertical: 'agency' };
        const r1 = buildSelectionEnvelope(makeParams({ executionEnvelope: envGeneric }));
        const r2 = buildSelectionEnvelope(makeParams({ executionEnvelope: envAgency }));
        expect(r1.inventoryIds).toContain('INV-001'); // neutralTag, ghl, low — passes both
        expect(r2.inventoryIds).toContain('INV-001');
    });

    it('Namespace not in allowed list → item excluded', () => {
        // Remove 'Ops' from namespaces — INV-002 and INV-003 should be excluded
        const env = { ...BASE_ENVELOPE, namespaces: ['Pipeline'] };
        const result = buildSelectionEnvelope(makeParams({ executionEnvelope: env }));
        expect(result.inventoryIds).not.toContain('INV-002');
        expect(result.inventoryIds).not.toContain('INV-003');
        expect(result.inventoryIds).toContain('INV-001');
    });

});

// ─── Binding Integrity ────────────────────────────────────────────────────────

describe('buildSelectionEnvelope — Binding Integrity', () => {

    it('Change canonicalFindingsHash → selectionHash changes', () => {
        const h1 = buildSelectionEnvelope(makeParams({ canonicalFindingsHash: FINDINGS_HASH })).selectionHash;
        const h2 = buildSelectionEnvelope(makeParams({ canonicalFindingsHash: 'deadbeef'.repeat(8) })).selectionHash;
        expect(h1).not.toBe(h2);
    });

    it('Change registryVersion → selectionHash changes', () => {
        const h1 = buildSelectionEnvelope(makeParams({ registryVersion: '1.0.0' })).selectionHash;
        const h2 = buildSelectionEnvelope(makeParams({ registryVersion: '1.0.1' })).selectionHash;
        expect(h1).not.toBe(h2);
    });

    it('Change envelopeVersion → selectionHash changes', () => {
        const h1 = buildSelectionEnvelope(makeParams({ envelopeVersion: '1.0.0' })).selectionHash;
        const h2 = buildSelectionEnvelope(makeParams({ envelopeVersion: '1.1.0' })).selectionHash;
        expect(h1).not.toBe(h2);
    });

    it('findingIds bind to full canonical input — not a filtered subset', () => {
        const result = buildSelectionEnvelope(makeParams({ canonicalFindingIds: ['FND-001', 'FND-002', 'FND-003'] }));
        expect(result.findingIds).toEqual(['FND-001', 'FND-002', 'FND-003']);
        expect(result.findingIds.length).toBe(3);
    });

});

// ─── Safety ───────────────────────────────────────────────────────────────────

describe('buildSelectionEnvelope — Safety', () => {

    it('Empty canonicalFindingIds → valid envelope, stable hash', () => {
        const r1 = buildSelectionEnvelope(makeParams({ canonicalFindingIds: [] }));
        const r2 = buildSelectionEnvelope(makeParams({ canonicalFindingIds: [] }));
        expect(r1.findingIds).toEqual([]);
        expect(r1.selectionHash).toBe(r2.selectionHash);
        expect(r1.selectionHash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('Empty registry → empty inventoryIds, valid envelope (no throw)', () => {
        const result = buildSelectionEnvelope(makeParams({ inventoryRegistry: [] }));
        expect(result.inventoryIds).toEqual([]);
        expect(result.adapterIds).toEqual([]);
        expect(result.selectionHash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('No adapters allowed → inventoryIds empty', () => {
        const env = { ...BASE_ENVELOPE, adapters: [] as any };
        const result = buildSelectionEnvelope(makeParams({ executionEnvelope: env }));
        expect(result.inventoryIds).toEqual([]);
        expect(result.adapterIds).toEqual([]);
    });

    it('Engine does not mutate input registry items', () => {
        const registry = mockRegistry.map(i => ({ ...i }));
        const originalAdapters = registry.map(i => i.adapter);
        buildSelectionEnvelope(makeParams({ inventoryRegistry: registry }));
        expect(registry.map(i => i.adapter)).toEqual(originalAdapters);
    });

    it('Engine does not mutate input canonicalFindingIds array', () => {
        const ids = ['FND-003', 'FND-001', 'FND-002'];
        const frozen = [...ids];
        buildSelectionEnvelope(makeParams({ canonicalFindingIds: ids }));
        expect(ids).toEqual(frozen);
    });

});
