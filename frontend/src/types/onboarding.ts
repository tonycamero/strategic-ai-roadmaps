// ============================================================================
// ONBOARDING TYPES
// Frontend types matching backend API schema
// ============================================================================

export type OnboardingStepId =
  | 'ORGANIZATION_TYPE'
  | 'OWNER_INTAKE'
  | 'BUSINESS_PROFILE'
  | 'INVITE_TEAM'
  | 'TEAM_INTAKES'
  | 'DISCOVERY_CALL'
  | 'DIAGNOSTIC_GENERATED'
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
  
  // UX helpers - computed by backend
  nextStepId?: OnboardingStepId;
  nextStepLabel?: string;
  nextStepEstimatedMinutes?: number;
}
