/**
 * Stage 6 Constraint Service
 * EXEC-TICKET-STAGE6-CONSTRAINT-PLANE-001
 *
 * Reads explicit constraint authority for a tenant.
 * No fallback. No projection reads. No inference.
 * If row does not exist → STAGE6_CONFIG_MISSING.
 * If data is invalid → STAGE6_CONFIG_INVALID.
 *
 * With TEXT[] columns, array validation is handled by Postgres.
 * Service validates complexity tier only.
 */
import { db } from '../db/index';
import { tenantStage6Config } from '../db/schema';
import { eq } from 'drizzle-orm';

// ─── Contract ─────────────────────────────────────────────────────────────────

export interface Stage6ConstraintConfig {
    vertical: string;
    allowedNamespaces: string[];
    allowedAdapters: string[];
    maxComplexityTier: 'low' | 'medium' | 'high';
    customDevAllowed: boolean;
}

// ─── Validation ───────────────────────────────────────────────────────────────

const VALID_COMPLEXITY_TIERS = new Set(['low', 'medium', 'high']);

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Read the explicit Stage 6 constraint config for a tenant.
 *
 * @throws Error('STAGE6_CONFIG_MISSING') if no row exists
 * @throws Error('STAGE6_CONFIG_INVALID') if data is malformed
 */
export async function getStage6ConstraintConfig(
    tenantId: string,
): Promise<Stage6ConstraintConfig> {
    const [row] = await db
        .select()
        .from(tenantStage6Config)
        .where(eq(tenantStage6Config.tenantId, tenantId))
        .limit(1);

    if (!row) {
        throw new Error('STAGE6_CONFIG_MISSING');
    }

    // Validate complexity tier (CHECK constraint enforces at DB level,
    // but defense-in-depth at service level)
    if (!VALID_COMPLEXITY_TIERS.has(row.maxComplexityTier)) {
        throw new Error(
            `STAGE6_CONFIG_INVALID: maxComplexityTier must be low|medium|high, got '${row.maxComplexityTier}'`
        );
    }

    return {
        vertical: row.vertical,
        allowedNamespaces: row.allowedNamespaces ?? [],
        allowedAdapters: row.allowedAdapters ?? [],
        maxComplexityTier: row.maxComplexityTier as 'low' | 'medium' | 'high',
        customDevAllowed: row.customDevAllowed,
    };
}
