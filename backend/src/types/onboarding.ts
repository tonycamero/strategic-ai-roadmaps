// ============================================================================
// ONBOARDING PROGRESS TYPES
// Strategic AI Roadmaps - Gamified Onboarding System
// ============================================================================

export type OnboardingStepId =
  | 'ORGANIZATION_TYPE'
  | 'OWNER_INTAKE'
  | 'BUSINESS_PROFILE'
  | 'INVITE_TEAM'
  | 'TEAM_INTAKES'
  | 'DIAGNOSTIC_GENERATED'
  | 'DISCOVERY_CALL'
  | 'ROADMAP_REVIEWED'
  | 'TICKETS_MODERATED'
  | 'IMPLEMENTATION_DECISION';

export type OnboardingStepStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'SKIPPED';

export type OnboardingBadgeId =
  | 'FOUNDATION_BUILDER'
  | 'TEAM_ASSEMBLER'
  | 'FULL_TEAM_ACTIVATED'
  | 'DIAGNOSTIC_READY'
  | 'ROADMAP_OWNER'
  | 'IMPLEMENTATION_READY'
  | 'PILOT_CANDIDATE';

export interface OnboardingStep {
  stepId: OnboardingStepId;
  label: string;
  status: OnboardingStepStatus;
  pointsEarned: number;
  pointsPossible: number;
  orderIndex: number;
  isRequired: boolean;
  estimatedMinutes?: number;
  completedAt?: string; // ISO timestamp
}

export interface OnboardingBadge {
  badgeId: OnboardingBadgeId;
  label: string;
  description: string;
  awardedAt: string; // ISO timestamp
}

export interface OnboardingState {
  tenantId: string;
  percentComplete: number;
  totalPoints: number;
  maxPoints: number;
  steps: OnboardingStep[];
  badges: OnboardingBadge[];

  // High-level state Label
  onboardingState: string;

  // Granular flags for Command Center
  flags: {
    knowledgeBaseReady: boolean;
    rolesValidated: boolean;
    execReady: boolean;
    briefResolved: boolean;
  };

  // Why they are in this state / what is blocking
  reasons: string[];

  // UX helpers - computed fields
  nextStepId?: OnboardingStepId;
  nextStepLabel?: string;
  nextStepEstimatedMinutes?: number;
}
