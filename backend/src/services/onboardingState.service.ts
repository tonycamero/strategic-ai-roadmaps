<<<<<<< HEAD
import { db } from '../db';
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
=======
import { onboardingProgressService } from './onboardingProgress.service';

export async function getManyOnboardingStates(tenantIds: string[]): Promise<Record<string, any>> {
    const results: Record<string, any> = {};

    // For now, we'll do this sequentially as the service methods are already optimized per-tenant
    // but in a high-load scenario we'd want to batch the DB queries.
    for (const id of tenantIds) {
        try {
            results[id] = await onboardingProgressService.getState(id);
        } catch (e) {
            console.error(`Error fetching onboarding state for tenant ${id}:`, e);
            results[id] = null;
        }
    }

    return results;
}

export async function invalidateOnboardingStateCache(tenantId: string): Promise<void> {
    // Stub
>>>>>>> 02e8d03 (feat: executive brief approval, state sync, and pdf delivery pipeline)
}
