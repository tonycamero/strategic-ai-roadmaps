import { useEffect, useState } from "react";
import { getSnapshot } from "../../services/snapshotService";
import { TenantLifecycleSnapshot } from "../../services/snapshotContract";

export default function CoordinationOpsPage() {
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
        <h1 className="text-2xl font-bold mb-4">Kaitlin — Coordination & Decision Flow</h1>
        <p>Loading snapshot...</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-slate-100 font-sans">
      <header className="mb-8 border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-bold text-slate-100">Kaitlin — Coordination & Decision Flow</h1>
        <p className="text-slate-400">Operational Surface</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6 pb-2 border-b border-slate-800 flex justify-between">
            Coordination Blockers
            <span className="text-red-400">{snapshot.coordination.blockers.length}</span>
          </h2>
          <div className="space-y-4">
            {snapshot.coordination.blockers.map((blocker, idx) => (
              <div key={blocker} className="flex gap-4 items-start bg-slate-950/50 p-4 rounded-lg border border-slate-800">
                <div className="bg-red-500/10 text-red-500 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                  !
                </div>
                <div className="text-sm text-slate-200">{blocker}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6 pb-2 border-b border-slate-800">
            Decision Queue
          </h2>
          <div className="text-slate-500 text-sm italic">
            Awaiting executive confirmation on {snapshot.constraint.toLowerCase()}...
          </div>
          <div className="mt-4 p-4 bg-blue-500/5 rounded-lg border border-blue-500/20 text-xs text-blue-300">
            Next regular decision window: Monday 09:00 AM
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6 pb-2 border-b border-slate-800">
            Cross-Team Dependencies
          </h2>
          <div className="space-y-3">
            <div className="text-sm text-slate-300 flex justify-between">
              <span>Ops ↔ Sales</span>
              <span className="text-green-400 text-xs">Healthy</span>
            </div>
            <div className="text-sm text-slate-300 flex justify-between">
              <span>Ops ↔ Delivery</span>
              <span className="text-yellow-400 text-xs">Attention Required</span>
            </div>
            <div className="text-sm text-slate-300 flex justify-between">
              <span>Sales ↔ Exec</span>
              <span className="text-green-400 text-xs">Healthy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
