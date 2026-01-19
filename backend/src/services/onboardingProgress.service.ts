<<<<<<< HEAD
import { db } from '../db';
<<<<<<< HEAD
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
=======
import { tenants, intakes, invites, users, intakeVectors, executiveBriefs, roadmaps } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import type { OnboardingState, OnboardingStep, OnboardingStepStatus } from '../types/onboarding';

export class OnboardingProgressService {
  async markStep(tenantId: string, step: string, status: string): Promise<void> {
    // Stub - not currently used
  }

  async getState(tenantId: string): Promise<OnboardingState> {
    // Fetch tenant
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Fetch dependencies for state derivation
    const allIntakes = await db.select().from(intakes).where(eq(intakes.tenantId, tenantId));
    const allVectors = await db.select().from(intakeVectors).where(eq(intakeVectors.tenantId, tenantId));
    const [latestBrief] = await db.select().from(executiveBriefs).where(eq(executiveBriefs.tenantId, tenantId)).orderBy(desc(executiveBriefs.createdAt)).limit(1);
    const [latestRoadmap] = await db.select().from(roadmaps).where(eq(roadmaps.tenantId, tenantId)).orderBy(desc(roadmaps.createdAt)).limit(1);

    // Compute step statuses based on database truth
    const steps: OnboardingStep[] = [];
    const reasons: string[] = [];

    // Step 1: Organization Type
    const orgTypeComplete = !!tenant.businessType;
    steps.push({
      stepId: 'ORGANIZATION_TYPE',
      label: 'Organization Type',
      status: orgTypeComplete ? 'COMPLETED' : 'NOT_STARTED',
      pointsEarned: orgTypeComplete ? 10 : 0,
      pointsPossible: 10,
      orderIndex: 1,
      isRequired: true,
      estimatedMinutes: 2,
    });
    if (!orgTypeComplete) reasons.push('Missing organization type');

    // Step 2: Owner Intake
    const ownerIntake = allIntakes.find(i => i.role === 'owner');
    const ownerIntakeComplete = ownerIntake?.status === 'completed';
    steps.push({
      stepId: 'OWNER_INTAKE',
      label: 'Owner Intake',
      status: ownerIntakeComplete ? 'COMPLETED' : ownerIntake ? 'IN_PROGRESS' : 'NOT_STARTED',
      pointsEarned: ownerIntakeComplete ? 20 : 0,
      pointsPossible: 20,
      orderIndex: 2,
      isRequired: true,
      estimatedMinutes: 15,
      completedAt: ownerIntake?.completedAt?.toISOString(),
    });
    if (!ownerIntakeComplete) reasons.push('Owner intake incomplete');

    // Step 3: Business Profile
    const businessProfileComplete = !!(tenant.teamHeadcount && tenant.baselineMonthlyLeads && tenant.firmSizeTier);
    steps.push({
      stepId: 'BUSINESS_PROFILE',
      label: 'Business Profile',
      status: businessProfileComplete ? 'COMPLETED' : 'NOT_STARTED',
      pointsEarned: businessProfileComplete ? 10 : 0,
      pointsPossible: 10,
      orderIndex: 3,
      isRequired: true,
      estimatedMinutes: 5,
    });
    if (!businessProfileComplete) reasons.push('Business profile details missing');

    // Step 4: Define Vectors & Invite Team
    const vectorsDefined = allVectors.length >= 1;
    const allInvited = allVectors.length > 0 && allVectors.every(v => v.inviteStatus === 'SENT' || v.inviteStatus === 'FAILED');

    steps.push({
      stepId: 'INVITE_TEAM',
      label: 'Invite Team',
      status: (vectorsDefined && allInvited) ? 'COMPLETED' : allVectors.length > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
      pointsEarned: (vectorsDefined && allInvited) ? 15 : 0,
      pointsPossible: 15,
      orderIndex: 4,
      isRequired: true,
      estimatedMinutes: 10,
    });
    if (allVectors.length === 0) reasons.push('No strategic stakeholders defined');
    else if (!allInvited) reasons.push('Stakeholder invites pending');

    // Step 5: Team Intakes
    const allIntakesComplete = allVectors.length > 0 && allVectors.every(v => v.intakeId !== null);
    steps.push({
      stepId: 'TEAM_INTAKES',
      label: 'Team Intakes',
      status: allIntakesComplete ? 'COMPLETED' : allIntakes.length > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
      pointsEarned: allIntakesComplete ? 25 : 0,
      pointsPossible: 25,
      orderIndex: 5,
      isRequired: true,
      estimatedMinutes: 30,
    });
    if (!allIntakesComplete && allVectors.length > 0) reasons.push('Stakeholder intakes pending');

    // Step 6: Diagnostic Generated
    const diagnosticComplete = !!tenant.lastDiagnosticId;
    steps.push({
      stepId: 'DIAGNOSTIC_GENERATED',
      label: 'Diagnostic Created',
      status: diagnosticComplete ? 'COMPLETED' : 'NOT_STARTED',
      pointsEarned: diagnosticComplete ? 20 : 0,
      pointsPossible: 20,
      orderIndex: 6,
      isRequired: true,
    });
    if (!diagnosticComplete) reasons.push('Diagnostic not yet generated');

    // Calculate totals
    const totalPoints = steps.reduce((sum, step) => sum + step.pointsEarned, 0);
    const maxPoints = steps.reduce((sum, step) => sum + step.pointsPossible, 0);
    const percentComplete = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;

    // Derive High Level Onboarding State
    let onboardingState = 'intake_open';
    if (latestRoadmap?.status === 'finalized' || latestRoadmap?.status === 'delivered') onboardingState = 'roadmap_finalized';
    else if (tenant.execReadyAt) onboardingState = 'exec_review';
    else if (tenant.rolesValidatedAt) onboardingState = 'delegate_ready';
    else if (latestBrief?.status === 'APPROVED') onboardingState = 'diagnostic_complete';
    else if (allIntakesComplete && ownerIntakeComplete) onboardingState = 'diagnostic_ready';

    // Readiness Flags
    const flags = {
      knowledgeBaseReady: !!tenant.knowledgeBaseReadyAt,
      rolesValidated: !!tenant.rolesValidatedAt,
      execReady: !!tenant.execReadyAt,
      briefResolved: latestBrief?.status === 'APPROVED'
    };

    // Find next incomplete step
    const nextStep = steps.find(s => s.status !== 'COMPLETED' && s.status !== 'SKIPPED');

    return {
      tenantId,
      percentComplete,
      totalPoints,
      maxPoints,
      steps,
      badges: [],
      onboardingState,
      flags,
      reasons,
      nextStepId: nextStep?.stepId,
      nextStepLabel: nextStep?.label,
      nextStepEstimatedMinutes: nextStep?.estimatedMinutes,
    };
  }
}

export const onboardingProgressService = new OnboardingProgressService();
>>>>>>> 02e8d03 (feat: executive brief approval, state sync, and pdf delivery pipeline)
=======
import { db } from '../db';
import { tenants, intakes, invites, users, intakeVectors, executiveBriefs, roadmaps } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import type { OnboardingState, OnboardingStep, OnboardingStepStatus } from '../types/onboarding';

export class OnboardingProgressService {
  async markStep(tenantId: string, step: string, status: string): Promise<void> {
    // Stub - not currently used
  }

  async getState(tenantId: string): Promise<OnboardingState> {
    // Fetch tenant
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Fetch dependencies for state derivation
    const allIntakes = await db.select().from(intakes).where(eq(intakes.tenantId, tenantId));
    const allVectors = await db.select().from(intakeVectors).where(eq(intakeVectors.tenantId, tenantId));
    const [latestBrief] = await db.select().from(executiveBriefs).where(eq(executiveBriefs.tenantId, tenantId)).orderBy(desc(executiveBriefs.createdAt)).limit(1);
    const [latestRoadmap] = await db.select().from(roadmaps).where(eq(roadmaps.tenantId, tenantId)).orderBy(desc(roadmaps.createdAt)).limit(1);

    // Compute step statuses based on database truth
    const steps: OnboardingStep[] = [];
    const reasons: string[] = [];

    // Step 1: Organization Type
    const orgTypeComplete = !!tenant.businessType;
    steps.push({
      stepId: 'ORGANIZATION_TYPE',
      label: 'Organization Type',
      status: orgTypeComplete ? 'COMPLETED' : 'NOT_STARTED',
      pointsEarned: orgTypeComplete ? 10 : 0,
      pointsPossible: 10,
      orderIndex: 1,
      isRequired: true,
      estimatedMinutes: 2,
    });
    if (!orgTypeComplete) reasons.push('Missing organization type');

    // Step 2: Owner Intake
    const ownerIntake = allIntakes.find(i => i.role === 'owner');
    const ownerIntakeComplete = ownerIntake?.status === 'completed';
    steps.push({
      stepId: 'OWNER_INTAKE',
      label: 'Owner Intake',
      status: ownerIntakeComplete ? 'COMPLETED' : ownerIntake ? 'IN_PROGRESS' : 'NOT_STARTED',
      pointsEarned: ownerIntakeComplete ? 20 : 0,
      pointsPossible: 20,
      orderIndex: 2,
      isRequired: true,
      estimatedMinutes: 15,
      completedAt: ownerIntake?.completedAt?.toISOString(),
    });
    if (!ownerIntakeComplete) reasons.push('Owner intake incomplete');

    // Step 3: Business Profile
    const businessProfileComplete = !!(tenant.teamHeadcount && tenant.baselineMonthlyLeads && tenant.firmSizeTier);
    steps.push({
      stepId: 'BUSINESS_PROFILE',
      label: 'Business Profile',
      status: businessProfileComplete ? 'COMPLETED' : 'NOT_STARTED',
      pointsEarned: businessProfileComplete ? 10 : 0,
      pointsPossible: 10,
      orderIndex: 3,
      isRequired: true,
      estimatedMinutes: 5,
    });
    if (!businessProfileComplete) reasons.push('Business profile details missing');

    // Step 4: Define Vectors & Invite Team
    const vectorsDefined = allVectors.length >= 1;
    const allInvited = allVectors.length > 0 && allVectors.every(v => v.inviteStatus === 'SENT' || v.inviteStatus === 'FAILED');

    steps.push({
      stepId: 'INVITE_TEAM',
      label: 'Invite Team',
      status: (vectorsDefined && allInvited) ? 'COMPLETED' : allVectors.length > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
      pointsEarned: (vectorsDefined && allInvited) ? 15 : 0,
      pointsPossible: 15,
      orderIndex: 4,
      isRequired: true,
      estimatedMinutes: 10,
    });
    if (allVectors.length === 0) reasons.push('No strategic stakeholders defined');
    else if (!allInvited) reasons.push('Stakeholder invites pending');

    // Step 5: Team Intakes
    const allIntakesComplete = allVectors.length > 0 && allVectors.every(v => v.intakeId !== null);
    steps.push({
      stepId: 'TEAM_INTAKES',
      label: 'Team Intakes',
      status: allIntakesComplete ? 'COMPLETED' : allIntakes.length > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
      pointsEarned: allIntakesComplete ? 25 : 0,
      pointsPossible: 25,
      orderIndex: 5,
      isRequired: true,
      estimatedMinutes: 30,
    });
    if (!allIntakesComplete && allVectors.length > 0) reasons.push('Stakeholder intakes pending');

    // Step 6: Diagnostic Generated
    const diagnosticComplete = !!tenant.lastDiagnosticId;
    steps.push({
      stepId: 'DIAGNOSTIC_GENERATED',
      label: 'Diagnostic Created',
      status: diagnosticComplete ? 'COMPLETED' : 'NOT_STARTED',
      pointsEarned: diagnosticComplete ? 20 : 0,
      pointsPossible: 20,
      orderIndex: 6,
      isRequired: true,
    });
    if (!diagnosticComplete) reasons.push('Diagnostic not yet generated');

    // Calculate totals
    const totalPoints = steps.reduce((sum, step) => sum + step.pointsEarned, 0);
    const maxPoints = steps.reduce((sum, step) => sum + step.pointsPossible, 0);
    const percentComplete = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;

    // Derive High Level Onboarding State
    let onboardingState = 'intake_open';
    if (latestRoadmap?.status === 'finalized' || latestRoadmap?.status === 'delivered') onboardingState = 'roadmap_finalized';
    else if (tenant.execReadyAt) onboardingState = 'exec_review';
    else if (tenant.rolesValidatedAt) onboardingState = 'delegate_ready';
    else if (latestBrief?.status === 'APPROVED') onboardingState = 'diagnostic_complete';
    else if (allIntakesComplete && ownerIntakeComplete) onboardingState = 'diagnostic_ready';

    // Readiness Flags
    const flags = {
      knowledgeBaseReady: !!tenant.knowledgeBaseReadyAt,
      rolesValidated: !!tenant.rolesValidatedAt,
      execReady: !!tenant.execReadyAt,
      briefResolved: latestBrief?.status === 'APPROVED'
    };

    // Find next incomplete step
    const nextStep = steps.find(s => s.status !== 'COMPLETED' && s.status !== 'SKIPPED');

    return {
      tenantId,
      percentComplete,
      totalPoints,
      maxPoints,
      steps,
      badges: [],
      onboardingState,
      flags,
      reasons,
      nextStepId: nextStep?.stepId,
      nextStepLabel: nextStep?.label,
      nextStepEstimatedMinutes: nextStep?.estimatedMinutes,
    };
  }
}

export const onboardingProgressService = new OnboardingProgressService();
>>>>>>> 1e46cab (chore: lock executive brief render + pdf contracts)
