import { db } from '../db/index.ts';
import { onboardingStates, tenants, intakes, invites, diagnostics, roadmaps } from '../db/schema.ts';
import { eq, and, count } from 'drizzle-orm';

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
    // 1. Fetch all primary facts
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    const tenantIntakes = await db
      .select()
      .from(intakes)
      .where(eq(intakes.tenantId, tenantId));

    const [inviteCountResult] = await db
      .select({ count: count() })
      .from(invites)
      .where(eq(invites.tenantId, tenantId));

    const [diagnosticCountResult] = await db
      .select({ count: count() })
      .from(diagnostics)
      .where(eq(diagnostics.tenantId, tenantId));

    const [roadmapCountResult] = await db
      .select({ count: count() })
      .from(roadmaps)
      .where(eq(roadmaps.tenantId, tenantId));

    // 2. Fetch manual overrides/status cache from onboarding_states
    const manualStates = await db
      .select()
      .from(onboardingStates)
      .where(eq(onboardingStates.tenantId, tenantId));

    const manualMap = manualStates.reduce((acc, curr) => ({
      ...acc,
      [curr.step]: curr.status,
    }), {} as Record<string, string>);

    // 3. Define derivation logic for each step
    const checkStep = (stepId: string, fact: boolean) => {
      // Manual "COMPLETED" or "SKIPPED" always wins if present (handle both cases)
      const manualStatus = manualMap[stepId]?.toUpperCase();
      if (manualStatus === 'COMPLETED' || manualStatus === 'SKIPPED') {
        return manualStatus;
      }
      return fact ? 'COMPLETED' : 'NOT_STARTED';
    };

    const hasOwnerIntake = tenantIntakes.some(i => i.role === 'owner');
    const hasTeamIntakes = ['ops', 'sales', 'delivery'].every(role =>
      tenantIntakes.some(i => i.role === role)
    );

    const steps = [
      {
        stepId: 'ORGANIZATION_TYPE',
        label: 'Organization Type',
        status: checkStep('ORGANIZATION_TYPE', tenant.businessType !== 'default'),
        pointsEarned: tenant.businessType !== 'default' ? 10 : 0,
        pointsPossible: 10,
        orderIndex: 0,
        isRequired: true,
      },
      {
        stepId: 'BUSINESS_PROFILE',
        label: 'Business Profile',
        status: checkStep('BUSINESS_PROFILE', !!(tenant.name && tenant.teamHeadcount && tenant.baselineMonthlyLeads)),
        pointsEarned: (tenant.name && tenant.teamHeadcount && tenant.baselineMonthlyLeads) ? 10 : 0,
        pointsPossible: 10,
        orderIndex: 1,
        isRequired: true,
      },
      {
        stepId: 'OWNER_INTAKE',
        label: 'Owner Intake',
        status: checkStep('OWNER_INTAKE', hasOwnerIntake),
        pointsEarned: hasOwnerIntake ? 20 : 0,
        pointsPossible: 20,
        orderIndex: 2,
        isRequired: true,
      },
      {
        stepId: 'INVITE_TEAM',
        label: 'Invite Team',
        status: checkStep('INVITE_TEAM', inviteCountResult.count > 0),
        pointsEarned: inviteCountResult.count > 0 ? 10 : 0,
        pointsPossible: 10,
        orderIndex: 3,
        isRequired: true,
      },
      {
        stepId: 'TEAM_INTAKES',
        label: 'Team Intakes',
        status: checkStep('TEAM_INTAKES', hasTeamIntakes),
        pointsEarned: hasTeamIntakes ? 30 : 0,
        pointsPossible: 30,
        orderIndex: 4,
        isRequired: true,
      },
      {
        stepId: 'DIAGNOSTIC_GENERATED',
        label: 'Diagnostic Created',
        status: checkStep('DIAGNOSTIC_GENERATED', diagnosticCountResult.count > 0),
        pointsEarned: diagnosticCountResult.count > 0 ? 20 : 0,
        pointsPossible: 20,
        orderIndex: 5,
        isRequired: true,
      },
      {
        stepId: 'DISCOVERY_CALL',
        label: 'Discovery Call',
        status: checkStep('DISCOVERY_CALL', tenant.discoveryComplete),
        pointsEarned: tenant.discoveryComplete ? 10 : 0,
        pointsPossible: 10,
        orderIndex: 6,
        isRequired: true,
      },
      {
        stepId: 'ROADMAP_REVIEWED',
        label: 'Final Roadmap',
        status: checkStep('ROADMAP_REVIEWED', roadmapCountResult.count > 0),
        pointsEarned: roadmapCountResult.count > 0 ? 50 : 0,
        pointsPossible: 50,
        orderIndex: 7,
        isRequired: true,
      },
    ];

    const totalPoints = steps.reduce((sum, s) => sum + s.pointsEarned, 0);
    const maxPoints = steps.reduce((sum, s) => sum + s.pointsPossible, 0);
    const percentComplete = Math.round((totalPoints / maxPoints) * 100);

    const result = {
      tenantId,
      percentComplete,
      totalPoints,
      maxPoints,
      steps,
      badges: [],
    };

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Onboarding] Derived state for ${tenantId}: ${percentComplete}% complete`);
    }

    return result;
  }
};
