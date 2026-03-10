/**
 * Stage 6 Constraint Service Tests
 * EXEC-TICKET-STAGE6-CONSTRAINT-PLANE-001
 *
 * Tests constraint read service in isolation.
 * With TEXT[] columns, array type validation is handled by Postgres.
 * Service tests focus on: existence gate, complexity validation, passthrough.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock DB Layer ────────────────────────────────────────────────────────────

const mockSelectResult: any[] = [];

vi.mock('../../db/index', () => ({
    db: {
        select: () => ({
            from: () => ({
                where: () => ({
                    limit: () => Promise.resolve(mockSelectResult),
                }),
            }),
        }),
    },
}));

vi.mock('../../db/schema', () => ({
    tenantStage6Config: {
        tenantId: 'tenant_id',
    },
}));

vi.mock('drizzle-orm', () => ({
    eq: (a: any, b: any) => ({ field: a, value: b }),
}));

// ─── Import After Mocks ──────────────────────────────────────────────────────

import { getStage6ConstraintConfig } from '../stage6Constraint.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setMockRow(row: any) {
    mockSelectResult.length = 0;
    if (row) mockSelectResult.push(row);
}

const VALID_ROW = {
    tenantId: 'tenant-1',
    vertical: 'financial_advisory',
    allowedNamespaces: ['Pipeline', 'CRM', 'Ops'],
    allowedAdapters: ['ghl', 'sidecar'],
    maxComplexityTier: 'medium',
    customDevAllowed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Stage6 Constraint Service — Fail-Closed Authority', () => {

    beforeEach(() => {
        mockSelectResult.length = 0;
    });

    it('CASE 1 — Config exists → returns correct structure', async () => {
        setMockRow({ ...VALID_ROW });

        const result = await getStage6ConstraintConfig('tenant-1');

        expect(result).toEqual({
            vertical: 'financial_advisory',
            allowedNamespaces: ['Pipeline', 'CRM', 'Ops'],
            allowedAdapters: ['ghl', 'sidecar'],
            maxComplexityTier: 'medium',
            customDevAllowed: false,
        });
    });

    it('CASE 2 — Config missing → throws STAGE6_CONFIG_MISSING', async () => {
        setMockRow(null);

        await expect(
            getStage6ConstraintConfig('tenant-missing'),
        ).rejects.toThrow('STAGE6_CONFIG_MISSING');
    });

    it('CASE 3 — Invalid complexity tier → throws STAGE6_CONFIG_INVALID', async () => {
        setMockRow({
            ...VALID_ROW,
            maxComplexityTier: 'ultra',
        });

        await expect(
            getStage6ConstraintConfig('tenant-1'),
        ).rejects.toThrow('STAGE6_CONFIG_INVALID');
        await expect(
            getStage6ConstraintConfig('tenant-1'),
        ).rejects.toThrow("maxComplexityTier must be low|medium|high, got 'ultra'");
    });

    it('CASE 4 — All tiers valid: low, medium, high', async () => {
        for (const tier of ['low', 'medium', 'high'] as const) {
            setMockRow({ ...VALID_ROW, maxComplexityTier: tier });
            const result = await getStage6ConstraintConfig('tenant-1');
            expect(result.maxComplexityTier).toBe(tier);
        }
    });

    it('CASE 5 — customDevAllowed = true propagates correctly', async () => {
        setMockRow({ ...VALID_ROW, customDevAllowed: true });

        const result = await getStage6ConstraintConfig('tenant-1');
        expect(result.customDevAllowed).toBe(true);
    });

    it('CASE 6 — Empty arrays are valid (maximally restrictive config)', async () => {
        setMockRow({
            ...VALID_ROW,
            allowedNamespaces: [],
            allowedAdapters: [],
        });

        const result = await getStage6ConstraintConfig('tenant-1');
        expect(result.allowedNamespaces).toEqual([]);
        expect(result.allowedAdapters).toEqual([]);
    });

    it('CASE 7 — null arrays default to empty (defensive)', async () => {
        setMockRow({
            ...VALID_ROW,
            allowedNamespaces: null,
            allowedAdapters: null,
        });

        const result = await getStage6ConstraintConfig('tenant-1');
        expect(result.allowedNamespaces).toEqual([]);
        expect(result.allowedAdapters).toEqual([]);
    });
});
