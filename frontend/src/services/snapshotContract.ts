/**
 * EXEC-078B: Tenant Lifecycle Snapshot Contract
 * The authoritative shared execution state consumed by all role-targeted operational surfaces.
 */

export interface TenantLifecycleSnapshot {
  tenantId: string;
  lifecyclePhase: string;
  constraint: string;
  roi: {
    revenueUnlock: string;
    hoursRecovered: string;
  };
  operations: {
    scheduleVolatility: string;
    materialReadinessRisk: string;
    warehouseMovementPressure: string;
  };
  exceptions: {
    id: string;
    status: "OPEN" | "ACKNOWLEDGED" | "INVESTIGATING" | "ESCALATED" | "RESOLVED";
    signal: string;
  }[];
  coordination: {
    blockers: string[];
  };
}
