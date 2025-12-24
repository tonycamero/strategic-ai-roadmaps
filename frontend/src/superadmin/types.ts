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
}
