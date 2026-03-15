import { TenantLifecycleSnapshot } from './snapshotContract';

export function mockSnapshot(tenantId: string): TenantLifecycleSnapshot {
  return {
    tenantId,
    lifecyclePhase: "Discovery",
    constraint: "Production scheduling coordination",
    roi: {
      revenueUnlock: "$420K–$680K",
      hoursRecovered: "22–34 hrs/week"
    },
    operations: {
      scheduleVolatility: "High",
      materialReadinessRisk: "Moderate",
      warehouseMovementPressure: "Elevated"
    },
    exceptions: [
      {
        id: "ex-1",
        status: "OPEN",
        signal: "Inventory variance"
      },
      {
        id: "ex-2",
        status: "INVESTIGATING",
        signal: "Packaging shortage"
      }
    ],
    coordination: {
      blockers: [
        "Production schedule approval",
        "Packaging material confirmation"
      ]
    }
  };
}
