import { useEffect, useState } from "react";
import { getSnapshot } from "../../services/snapshotService";
import { TenantLifecycleSnapshot } from "../../services/snapshotContract";

export default function ExceptionsOpsPage() {
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
        <h1 className="text-2xl font-bold mb-4">Hootie — Exception Lifecycle Board</h1>
        <p>Loading snapshot...</p>
      </div>
    );
  }

  const columns = ["OPEN", "ACKNOWLEDGED", "INVESTIGATING", "ESCALATED", "RESOLVED"];

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-slate-100 font-sans">
      <header className="mb-8 border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-bold text-slate-100">Hootie — Exception Lifecycle Board</h1>
        <p className="text-slate-400">Operational Surface</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {columns.map(column => (
          <div key={column} className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 min-w-[200px]">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-tighter mb-4 border-b border-slate-800 pb-2 flex justify-between items-center">
              {column}
              <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full text-[10px]">
                {snapshot.exceptions.filter(e => e.status === column).length}
              </span>
            </h2>
            
            <div className="space-y-3">
              {snapshot.exceptions.filter(e => e.status === column).map(exception => (
                <div key={exception.id} className="bg-slate-900 p-4 rounded-lg border border-slate-700 shadow-sm hover:border-blue-500/50 transition-colors cursor-pointer">
                  <div className="text-xs text-slate-500 mb-1">ID: {exception.id}</div>
                  <div className="text-sm font-medium text-slate-200">{exception.signal}</div>
                  <div className={`mt-2 text-[10px] font-bold px-1.5 py-0.5 rounded inline-block ${
                    exception.status === 'OPEN' ? 'bg-red-500/10 text-red-400' :
                    exception.status === 'ESCALATED' ? 'bg-orange-500/10 text-orange-400' :
                    'bg-blue-500/10 text-blue-400'
                  }`}>
                    {exception.status}
                  </div>
                </div>
              ))}
              
              {snapshot.exceptions.filter(e => e.status === column).length === 0 && (
                <div className="text-[10px] text-slate-600 italic text-center py-4">
                  No exceptions in this stage
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
