import { useEffect, useState } from "react";
import { getSnapshot } from "../../services/snapshotService";
import { TenantLifecycleSnapshot } from "../../services/snapshotContract";

export default function ExecutionOpsPage() {
  const [snapshot, setSnapshot] = useState<TenantLifecycleSnapshot | null>(null);

  const searchParams = new URLSearchParams(window.location.search);
  const tenantId = searchParams.get("tenantId") || "demo";
  console.log("Resolved tenantId:", tenantId);

  useEffect(() => {
    getSnapshot(tenantId).then(setSnapshot);
  }, [tenantId]);

  if (!snapshot) {
    return (
      <div className="p-8 text-slate-400">
        <h1 className="text-2xl font-bold mb-4">Tre — Warehouse & Schedule Execution</h1>
        <p>Loading snapshot...</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-slate-100 font-sans">
      <header className="mb-8 border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-bold text-slate-100">Tre — Warehouse & Schedule Execution</h1>
        <p className="text-slate-400">Operational Surface</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Operational Focus</h2>
          <div className="text-lg font-medium">Constraint: {snapshot.constraint}</div>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Schedule Volatility</h2>
          <div className={`text-2xl font-bold ${snapshot.operations.scheduleVolatility === 'High' ? 'text-red-400' : 'text-blue-400'}`}>
            {snapshot.operations.scheduleVolatility}
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Material Readiness Risk</h2>
          <div className="text-2xl font-bold text-blue-400">
            {snapshot.operations.materialReadinessRisk}
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Warehouse Movement Pressure</h2>
          <div className="text-2xl font-bold text-blue-400">
            {snapshot.operations.warehouseMovementPressure}
          </div>
        </div>
      </div>

      <div className="mt-8 bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Operational Focus Today</h2>
        <p className="text-slate-300">
          The primary focus is managing {snapshot.constraint.toLowerCase()} to mitigate {snapshot.operations.scheduleVolatility.toLowerCase()} schedule volatility. 
          Current material readiness is {snapshot.operations.materialReadinessRisk.toLowerCase()} while movement pressure remains {snapshot.operations.warehouseMovementPressure.toLowerCase()}.
        </p>
      </div>
    </div>
  );
}
