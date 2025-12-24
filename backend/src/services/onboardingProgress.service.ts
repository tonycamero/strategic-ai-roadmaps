// ============================================================================
// ONBOARDING PROGRESS SERVICE
// Strategic AI Roadmaps - Gamified Onboarding System
// ============================================================================

import { db } from '../db';
import { onboardingStates, tenants } from '../db/schema';
import { eq } from 'drizzle-orm';
import type {
  OnboardingState,
  OnboardingStep,
  OnboardingStepId,
  OnboardingStepStatus,
  OnboardingBadge,
  OnboardingBadgeId,
} from '../types/onboarding';

export class OnboardingProgressService {
  /**
   * Get the current onboarding state for a tenant
   * Creates initial state if none exists
   */
  async getState(tenantId: string): Promise<OnboardingState> {
    const row = await db.query.onboardingStates.findFirst({
      where: eq(onboardingStates.tenantId, tenantId),
    });

    if (!row) {
      return this.createInitialState(tenantId);
    }

    // Reconstruct OnboardingState from DB row
    return {
      tenantId,
      percentComplete: row.percentComplete,
      totalPoints: row.totalPoints,
      maxPoints: row.maxPoints,
      steps: (row.steps as any) || [],
      badges: (row.badges as any) || [],
      // Next step computed on the fly
      ...this.computeNextStep((row.steps as any) || []),
    };
  }

  /**
   * Mark a step with a new status and recalculate state
   */
  async markStep(
    tenantId: string,
    stepId: OnboardingStepId,
    status: OnboardingStepStatus
  ): Promise<OnboardingState> {
    const current = await this.getState(tenantId);
    const now = new Date().toISOString();

    // Update the specific step
    const steps = current.steps.map(step => {
      if (step.stepId !== stepId) return step;

      const updated = { ...step, status };

      if (status === 'COMPLETED') {
        updated.pointsEarned = updated.pointsPossible;
        if (!updated.completedAt) {
          updated.completedAt = now;
        }
      }

      if (status === 'NOT_STARTED') {
        updated.pointsEarned = 0;
        delete updated.completedAt;
      }

      return updated;
    });

    // Recalculate state
    let nextState = this.recalculateState({
      ...current,
      steps,
    });

    // Apply badge logic
    nextState = this.applyBadges(nextState);

    // Compute next step
    const nextStepData = this.computeNextStep(nextState.steps);
    nextState = {
      ...nextState,
      ...nextStepData,
    };

    // Persist to DB
    await this.saveState(tenantId, nextState);
    return nextState;
  }

  /**
   * Create initial onboarding state for a new tenant
   * Returns state but does NOT persist (will be created on first markStep)
   */
  private createInitialState(tenantId: string): OnboardingState {
    const steps: OnboardingStep[] = [
      {
        stepId: 'ORGANIZATION_TYPE',
        label: 'Organization Type',
        status: 'NOT_STARTED',
        pointsEarned: 0,
        pointsPossible: 5,
        orderIndex: 0,
        isRequired: true,
        estimatedMinutes: 1,
      },
      {
        stepId: 'BUSINESS_PROFILE',
        label: 'Business Profile',
        status: 'NOT_STARTED',
        pointsEarned: 0,
        pointsPossible: 25,
        orderIndex: 1,
        isRequired: true,
        estimatedMinutes: 5,
      },
      {
        stepId: 'OWNER_INTAKE',
        label: 'Owner Intake',
        status: 'NOT_STARTED',
        pointsEarned: 0,
        pointsPossible: 15,
        orderIndex: 2,
        isRequired: true,
        estimatedMinutes: 15,
      },
      {
        stepId: 'INVITE_TEAM',
        label: 'Invite Team',
        status: 'NOT_STARTED',
        pointsEarned: 0,
        pointsPossible: 5,
        orderIndex: 3,
        isRequired: true,
        estimatedMinutes: 3,
      },
      {
        stepId: 'TEAM_INTAKES',
        label: 'Team Intakes (waiting on your team)',
        status: 'NOT_STARTED',
        pointsEarned: 0,
        pointsPossible: 15,
        orderIndex: 4,
        isRequired: true,
        estimatedMinutes: 10,
      },
      {
        stepId: 'DIAGNOSTIC_GENERATED',
        label: 'Diagnostic Generated',
        status: 'NOT_STARTED',
        pointsEarned: 0,
        pointsPossible: 15,
        orderIndex: 5,
        isRequired: true,
        estimatedMinutes: 0,
      },
      {
        stepId: 'DISCOVERY_CALL',
        label: 'Discovery Call',
        status: 'NOT_STARTED',
        pointsEarned: 0,
        pointsPossible: 10,
        orderIndex: 6,
        isRequired: false,
        estimatedMinutes: 1,
      },
      {
        stepId: 'ROADMAP_REVIEWED',
        label: 'Roadmap Reviewed',
        status: 'NOT_STARTED',
        pointsEarned: 0,
        pointsPossible: 10,
        orderIndex: 7,
        isRequired: false,
        estimatedMinutes: 5,
      },
      {
        stepId: 'TICKETS_MODERATED',
        label: 'Tickets Moderated',
        status: 'NOT_STARTED',
        pointsEarned: 0,
        pointsPossible: 10,
        orderIndex: 8,
        isRequired: false,
        estimatedMinutes: 10,
      },
      {
        stepId: 'IMPLEMENTATION_DECISION',
        label: 'Implementation Decision',
        status: 'NOT_STARTED',
        pointsEarned: 0,
        pointsPossible: 10,
        orderIndex: 9,
        isRequired: false,
        estimatedMinutes: 3,
      },
    ];

    const maxPoints = steps.reduce((sum, s) => sum + s.pointsPossible, 0);

    const initialState: OnboardingState = {
      tenantId,
      steps,
      badges: [],
      percentComplete: 0,
      totalPoints: 0,
      maxPoints,
    };

    return {
      ...initialState,
      ...this.computeNextStep(steps),
    };
  }

  /**
   * Persist onboarding state to database
   */
  private async saveState(tenantId: string, state: OnboardingState): Promise<void> {
    const now = new Date();

    // Check if row exists
    const existing = await db.query.onboardingStates.findFirst({
      where: eq(onboardingStates.tenantId, tenantId),
    });

    if (existing) {
      // Update existing
      await db
        .update(onboardingStates)
        .set({
          percentComplete: state.percentComplete,
          totalPoints: state.totalPoints,
          maxPoints: state.maxPoints,
          steps: state.steps as any,
          badges: state.badges as any,
          updatedAt: now,
        })
        .where(eq(onboardingStates.id, existing.id));
    } else {
      // Insert new
      await db.insert(onboardingStates).values({
        tenantId,
        percentComplete: state.percentComplete,
        totalPoints: state.totalPoints,
        maxPoints: state.maxPoints,
        steps: state.steps as any,
        badges: state.badges as any,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  /**
   * Recalculate totalPoints and percentComplete
   */
  private recalculateState(state: OnboardingState): OnboardingState {
    const totalPoints = state.steps.reduce(
      (sum, step) => sum + (step.pointsEarned || 0),
      0
    );
    const maxPoints = state.maxPoints;

    const percentComplete =
      maxPoints === 0 ? 0 : Math.round((totalPoints / maxPoints) * 100);

    return {
      ...state,
      totalPoints,
      percentComplete,
    };
  }

  /**
   * Apply badge award logic based on completed steps
   */
  private applyBadges(state: OnboardingState): OnboardingState {
    const now = new Date().toISOString();
    const badges: OnboardingBadge[] = [...state.badges];

    const hasBadge = (id: OnboardingBadgeId) =>
      badges.some(b => b.badgeId === id);

    const step = (id: OnboardingStepId) =>
      state.steps.find(s => s.stepId === id);

    // FOUNDATION_BUILDER - Owner Intake + Business Profile
    if (
      step('OWNER_INTAKE')?.status === 'COMPLETED' &&
      step('BUSINESS_PROFILE')?.status === 'COMPLETED' &&
      !hasBadge('FOUNDATION_BUILDER')
    ) {
      badges.push({
        badgeId: 'FOUNDATION_BUILDER',
        label: 'Foundation Builder',
        description: 'Completed Owner Intake and Business Profile.',
        awardedAt: now,
      });
    }

    // TEAM_ASSEMBLER - At least one invite sent (checked via INVITE_TEAM step)
    if (
      step('INVITE_TEAM')?.status === 'COMPLETED' &&
      !hasBadge('TEAM_ASSEMBLER')
    ) {
      badges.push({
        badgeId: 'TEAM_ASSEMBLER',
        label: 'Team Assembler',
        description: 'Invited team members to join.',
        awardedAt: now,
      });
    }

    // FULL_TEAM_ACTIVATED - All team intakes completed
    if (
      step('TEAM_INTAKES')?.status === 'COMPLETED' &&
      !hasBadge('FULL_TEAM_ACTIVATED')
    ) {
      badges.push({
        badgeId: 'FULL_TEAM_ACTIVATED',
        label: 'Full Team Activated',
        description: 'All three team roles completed their intakes.',
        awardedAt: now,
      });
    }

    // DIAGNOSTIC_READY
    if (
      step('DIAGNOSTIC_GENERATED')?.status === 'COMPLETED' &&
      !hasBadge('DIAGNOSTIC_READY')
    ) {
      badges.push({
        badgeId: 'DIAGNOSTIC_READY',
        label: 'Diagnostic Ready',
        description: 'Your diagnostic is fully generated.',
        awardedAt: now,
      });
    }

    // ROADMAP_OWNER
    if (
      step('ROADMAP_REVIEWED')?.status === 'COMPLETED' &&
      !hasBadge('ROADMAP_OWNER')
    ) {
      badges.push({
        badgeId: 'ROADMAP_OWNER',
        label: 'Roadmap Owner',
        description: 'You have reviewed your Strategic AI Roadmap.',
        awardedAt: now,
      });
    }

    // IMPLEMENTATION_READY
    if (
      step('TICKETS_MODERATED')?.status === 'COMPLETED' &&
      !hasBadge('IMPLEMENTATION_READY')
    ) {
      badges.push({
        badgeId: 'IMPLEMENTATION_READY',
        label: 'Implementation Ready',
        description: 'Your initiatives are approved and prioritized.',
        awardedAt: now,
      });
    }

    // PILOT_CANDIDATE
    if (
      step('IMPLEMENTATION_DECISION')?.status === 'COMPLETED' &&
      !hasBadge('PILOT_CANDIDATE')
    ) {
      badges.push({
        badgeId: 'PILOT_CANDIDATE',
        label: 'Pilot Candidate',
        description: 'You are ready to move from planning to execution.',
        awardedAt: now,
      });
    }

    return {
      ...state,
      badges,
    };
  }

  /**
   * Compute the next recommended step
   * Returns nextStepId, nextStepLabel, nextStepEstimatedMinutes
   */
  private computeNextStep(
    steps: OnboardingStep[]
  ): {
    nextStepId?: OnboardingStepId;
    nextStepLabel?: string;
    nextStepEstimatedMinutes?: number;
  } {
    // Strategy: Follow the natural orderIndex sequence
    // This ensures the flow is: Owner Intake → Business Profile → Invite Team → etc.
    const next = steps
      .filter(s => s.status !== 'COMPLETED' && s.status !== 'SKIPPED')
      .sort((a, b) => a.orderIndex - b.orderIndex)[0];

    if (!next) {
      return {
        nextStepId: undefined,
        nextStepLabel: undefined,
        nextStepEstimatedMinutes: undefined,
      };
    }

    return {
      nextStepId: next.stepId,
      nextStepLabel: next.label,
      nextStepEstimatedMinutes: next.estimatedMinutes,
    };
  }
}

// Singleton export
export const onboardingProgressService = new OnboardingProgressService();
