/**
 * EXEC-TICKET-075-B: Snapshot Contract Guardrail
 *
 * Authoritative TypeScript contract for TenantLifecycleSnapshot as consumed by the frontend.
 * Any schema drift in resolveTenantLifecycleSnapshot() will surface here as a type error
 * AND at runtime via validateSnapshot().
 *
 * NOTE: This mirrors the projection shape from TenantLifecycleView, not raw tables.
 */

export interface SnapshotProjection {
  lifecycle: {
    currentPhase: string;
    intakeWindowState: string;
    intakeVersion: number;
  };
  analytics: {
    frictionMap: {
      totalTickets: number;
      rejectedTickets: number;
      manualWorkflowsIdentified: number;
      strategicMisalignmentScore: number;
      highPriorityBottlenecks: number;
    };
    capacityROI: {
      projectedHoursSavedWeekly: number;
      speedToValue: 'LOW' | 'MEDIUM' | 'HIGH';
    };
  };
  artifacts: {
    hasRoadmap: boolean;
    hasExecutiveBrief: boolean;
    hasCanonicalFindings: boolean;
    diagnostic: { exists: boolean; status?: string };
  };
  stages: {
    intake: string;
    executiveBrief: string;
    diagnostic: string;
    discovery: string;
    synthesis: string;
    moderation: string;
    roadmap: string;
  };
  workflow: {
    discoveryComplete: boolean;
    roadmapComplete: boolean;
    knowledgeBaseReady: boolean;
  };
  stageState: {
    stage6ModerationReady: boolean;
    stage7SynthesisReady: boolean;
    stage7TicketsExist: boolean;
  };
  identity: { tenantName: string };
}

export interface TenantLifecycleSnapshotContract {
  projection: SnapshotProjection;
  tenant: { name: string; businessType?: string } | null;
  signals: string[];
  diagnostics: { overview?: string | null } | null;
  roiBaseline?: {
    monthlyLeadVolume?: number;
    closeRate?: number;
    avgJobValue?: number;
    salesRepCount?: number;
    opsAdminCount?: number;
    avgResponseTime?: number;
    maxThroughputPerHour?: number;
    avgThroughputPerHour?: number;
    primaryBottleneck?: string;
  } | null;
}
