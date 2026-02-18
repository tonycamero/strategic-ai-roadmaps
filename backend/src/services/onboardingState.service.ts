import { db } from '../db/index';
import { onboardingStates } from '../db/schema';
import { inArray, eq } from 'drizzle-orm';

/**
 * Fetch onboarding states for multiple tenants.
 * Used by Command Center for batch operations.
 */
export async function getManyOnboardingStates(tenantIds: string[]) {
    if (tenantIds.length === 0) return {};

    const states = await db.select()
        .from(onboardingStates)
        .where(inArray(onboardingStates.tenantId, tenantIds));

    const record: Record<string, any> = {};
    states.forEach(state => {
        record[state.tenantId] = state;
    });
    return record;
}

/**
 * Invalidate or recompute onboarding state for a tenant.
 * Currently just ensures the record is updated to signal changes.
 */
export async function invalidateOnboardingStateCache(tenantId: string) {
    // In a real system this might clear Redis or trigger a background job.
    // For now, we update the timestamp to ensure the UI knows data changed.
    await db.update(onboardingStates)
        .set({ updatedAt: new Date() })
        .where(eq(onboardingStates.tenantId, tenantId));
}
