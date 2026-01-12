export interface IntakeRoleDefinition {
  id: string;
  roleLabel: string; // e.g. "Manufacturing Facilitator"
  roleType: 'FACILITATOR' | 'OPERATIONAL_LEAD' | 'EXECUTIVE' | 'OTHER';
  description?: string;

  // Lead's Framing (Perception vs Reality)
  perceivedConstraints: string;
  anticipatedBlindSpots: string;

  // Recipient Link
  recipientEmail?: string;
  recipientName?: string;

  // Status
  inviteStatus: 'NOT_SENT' | 'SENT' | 'FAILED';
  intakeStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  completedAt?: string;
}

export interface SuperAdminOverview {

  totalFirms: number;
  totalIntakes: number;
  statusStats: { status: string; count: number }[];
  roadmapStats: { status: string; count: number }[];
  pilotStats: { pilotStage: string; count: number }[];
  cohortStats: { cohortLabel: string | null; count: number }[];
}

export interface SuperAdminFirmRow {
  tenantId: string;
  name: string;
  ownerEmail: string;
  cohortLabel: string | null;
  segment: string | null;
  region: string | null;
  status: string;
  intakeCount: number;
  roadmapCount: number;
  createdAt: string;
  // Executive-Reflected Signals (may be null for delegates at API level, but UI must handle)
  executiveBriefStatus?: 'NOT_CREATED' | 'DRAFT' | 'READY' | 'ACKNOWLEDGED' | 'WAIVED' | null;
  roadmapStatus?: 'LOCKED' | 'READY' | 'DELIVERED' | null;
  diagnosticStatus?: 'NOT_STARTED' | 'IN_REVIEW' | 'FINALIZED' | null;
}

export interface SuperAdminTenantDetail {
  tenant: {
    id: string;
    name: string;
    cohortLabel: string | null;
    segment: string | null;
    region: string | null;
    status: string;
    notes: string | null;
    createdAt: string;
    ownerEmail: string;
    ownerName: string;
    lastDiagnosticId?: string | null;
    intakeWindowState: 'OPEN' | 'CLOSED';
    intakeSnapshotId?: string | null;
    intakeClosedAt?: string | null;
    knowledgeBaseReadyAt?: string | null;
    rolesValidatedAt?: string | null;
    execReadyAt?: string | null;
    execReadyByUserId?: string | null;
    readinessNotes?: string | null;
  };
  onboarding?: {
    onboardingState: 'PRE_INTAKE' | 'INTAKE_ACTIVE' | 'DIAGNOSTIC_READY' | 'ROADMAP_READY' | 'COMPLETED' | 'STALLED';
    percentComplete: number;
    reasons: string[];
    flags: {
      intakeWindowClosed: boolean;
      briefResolved: boolean;
      ticketsModerated: boolean;
      knowledgeBaseReady: boolean;
      rolesValidated: boolean;
      execReady: boolean;
      roadmapFinalized: boolean;
    };
  };
  owner: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  } | null;
  teamMembers: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  }[];
  intakes: {
    id: string;
    role: string;
    status: string;
    answers: Record<string, unknown>;
    createdAt: string;
    completedAt: string | null;
    userName: string;
    userEmail: string;
    // Expanded Metadata
    domain?: string;
    perceivedConstraints?: string[];
  }[];
  roadmaps: {
    id: string;
    ownerId: string;
    pdfUrl?: string;
    status: string;
    pilotStage?: string | null;
    deliveredAt?: string | null;
    createdAt: string;
  }[];
  latestRoadmap?: {
    id: string;
    status: string;
    createdAt: string;
    deliveredAt?: string | null;
  } | null;
  recentActivity: {
    id: string;
    eventType: string;
    entityType: string | null;
    entityId: string | null;
    metadata: Record<string, unknown>;
    createdAt: string;
    actorName: string;
    actorRole: string | null;
  }[];
  diagnosticStatus: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    readyForRoadmap: boolean;
  };
}

export interface CommandCenterTenant {
  id: string;
  name: string;
  onboardingState: string;
  percentComplete: number;
  owner: { name: string; email: string } | null;
  cohortLabel: string | null;
  readiness: {
    knowledgeBaseReadyAt: string | null;
    rolesValidatedAt: string | null;
    execReadyAt: string | null;
  };
}
