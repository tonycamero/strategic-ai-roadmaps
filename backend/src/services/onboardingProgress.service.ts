import { db } from '../db';
import { onboardingStates, tenants } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export const onboardingProgressService = {
  markStep: async (tenantId: string, stepId: string, status: 'not_started' | 'in_progress' | 'completed') => {
    const [existing] = await db
      .select()
      .from(onboardingStates)
      .where(
        and(
          eq(onboardingStates.tenantId, tenantId),
          eq(onboardingStates.step, stepId)
        )
      )
      .limit(1);

    if (existing) {
      await db
        .update(onboardingStates)
        .set({
          status,
          updatedAt: new Date(),
          completedAt: status === 'completed' ? new Date() : existing.completedAt,
        })
        .where(eq(onboardingStates.id, existing.id));
    } else {
      // Find the tenant owner to associate with the onboarding state
      const [tenantRow] = await db
        .select({ ownerUserId: tenants.ownerUserId })
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);

      if (!tenantRow?.ownerUserId) {
        throw new Error(`Cannot mark onboarding step: No owner user found for tenant ${tenantId}`);
      }

      await db.insert(onboardingStates).values({
        tenantId,
        userId: tenantRow.ownerUserId,
        step: stepId,
        status,
        completedAt: status === 'completed' ? new Date() : null,
      });
    }
  },

  getState: async (tenantId: string) => {
    const states = await db
      .select()
      .from(onboardingStates)
      .where(eq(onboardingStates.tenantId, tenantId));

    return states.reduce((acc, curr) => ({
      ...acc,
      [curr.step]: {
        status: curr.status,
        completedAt: curr.completedAt,
      }
    }), {} as Record<string, { status: string; completedAt: Date | null }>);
  }
};
