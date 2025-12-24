// frontend/src/components/dashboard/types.ts

export type TenantSummary = {
  id: string;
  name: string;
  cohortLabel?: string | null;
  segment?: string | null;
  region?: string | null;
  status: string;
  businessType: string;
  teamHeadcount: number | null;
  baselineMonthlyLeads: number | null;
  firmSizeTier?: string | null;
  createdAt: string;
  notes?: string | null;
  lastDiagnosticId?: string | null;
};

export type OwnerUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

export type OnboardingSummary = {
  percentComplete: number;
  totalPoints: number;
  maxPoints: number;
};

export type ActivitySummary = {
  intakeStarted: number;
  intakeCompleted: number;
  roadmapCreated: number;
  roadmapDelivered: number;
  lastActivityAt: string | null;
};

export type RoadmapStats = {
  total: number;
  delivered: number;
  draft: number;
};

export type DocumentSummary = Record<string, number>;

export type DashboardIntake = {
  id: string;
  role: string;
  status: string;
  answers: Record<string, any>;
  createdAt: string;
  completedAt: string | null;
  userName: string;
  userEmail: string;
};

export type DashboardRoadmap = {
  id: string;
  ownerId: string;
  pdfUrl?: string | null;
  status: string;
  pilotStage?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
};

export type AuditEventItem = {
  id: string;
  eventType: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, any>;
  createdAt: string;
  actorName: string;
  actorRole: string | null;
};

export type DashboardData = {
  tenantSummary: TenantSummary;
  owner: OwnerUser | null;
  teamMembers: TeamMember[];
  onboardingSummary: OnboardingSummary | null;
  activitySummary: ActivitySummary;
  roadmapStats: RoadmapStats;
  documentSummary: DocumentSummary;
  intakes: DashboardIntake[];
  roadmaps: DashboardRoadmap[];
  recentActivity: AuditEventItem[];
};

// Used by role-aware dashboard wrapper
export type UserRole = 'owner' | 'team' | 'staff' | 'superadmin';
