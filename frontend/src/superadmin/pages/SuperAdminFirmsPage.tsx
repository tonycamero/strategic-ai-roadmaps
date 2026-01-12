import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { superadminApi } from '../api';
import { SuperAdminFirmRow } from '../types';
import { useSuperAdminAuthority } from '../../hooks/useSuperAdminAuthority';
import { AuthorityGuard } from '../../components/AuthorityGuard';
import { AuthorityCategory } from '@roadmap/shared';

export default function SuperAdminFirmsPage() {
  const [firms, setFirms] = useState<SuperAdminFirmRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { isExecutive, isDelegate } = useSuperAdminAuthority();

  useEffect(() => {
    superadminApi
      .getFirms()
      .then((res) => setFirms(res.firms))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-400 p-8 flex items-center justify-center min-h-[50vh] font-mono text-sm animate-pulse">Scan_Running...</div>;
  if (error) return <div className="text-red-400 p-8 font-mono border border-red-900 bg-red-900/10 rounded m-4">Failed to load firms: {error}</div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-8">
      <header className="flex items-end justify-between border-b border-slate-800 pb-6">
        <div>
          <div className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
            Portfolio Readiness Authority
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Portfolio Readiness</h1>
          <p className="text-sm text-slate-400 max-w-2xl font-light">
            Control surface for all active enterprise tenants. <span className="text-slate-500">Select a firm to enter decision context.</span>
          </p>
        </div>
        <div className="text-right pl-8 border-l border-slate-800 hidden md:block">
          <div className="text-3xl font-mono text-white tracking-tight">{firms.length}</div>
          <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Active Tenants</div>
        </div>
      </header>

      <div className="space-y-4">
        {firms.length === 0 ? (
          <div className="p-16 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 font-mono text-sm bg-slate-900/20">
            No active tenants in readiness scope.
          </div>
        ) : (
          <div className="bg-slate-950 border border-slate-900 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/5">
            {/* Table Header */}
            <div className={`grid gap-4 px-6 py-4 bg-slate-900/80 border-b border-slate-800 text-[9px] uppercase tracking-widest font-extrabold text-slate-500 select-none backdrop-blur-sm
                 ${isExecutive ? 'grid-cols-12' : 'grid-cols-8'}`}>
              <div className="col-span-3">Entity Identity</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2">Intake Velocity</div>
              <div className="col-span-2">Diagnostic State</div>

              {/* Executive Only Columns */}
              <AuthorityGuard requiredCategory={AuthorityCategory.EXECUTIVE}>
                <div className="col-span-2">Executive Brief</div>
                <div className="col-span-2 text-right">Roadmap Authority</div>
              </AuthorityGuard>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-slate-900">
              {firms.map((firm) => (
                <FirmRow
                  key={firm.tenantId}
                  firm={firm}
                  isExecutive={isExecutive}
                  onClick={() => setLocation(`/superadmin/execute/firms/${firm.tenantId}`)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FirmRow({
  firm,
  isExecutive,
  onClick
}: {
  firm: SuperAdminFirmRow;
  isExecutive: boolean;
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`grid gap-4 px-6 py-5 items-center hover:bg-slate-900/40 cursor-pointer transition-all duration-200 group border-l-2 border-transparent hover:border-indigo-500
         ${isExecutive ? 'grid-cols-12' : 'grid-cols-8'}`}
    >
      {/* 1. Entity Identity */}
      <div className="col-span-3">
        <div className="font-bold text-slate-200 group-hover:text-white transition-colors text-sm mb-1 tracking-tight">
          {firm.name}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 font-mono">
            Since {new Date(firm.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
          </span>
          {firm.cohortLabel && (
            <span className="px-1.5 py-0.5 rounded-sm bg-slate-800 text-[9px] text-slate-400 border border-slate-700">
              {firm.cohortLabel}
            </span>
          )}
        </div>
      </div>

      {/* 2. Status */}
      <div className="col-span-1">
        <StatusBadge status={firm.status} />
      </div>

      {/* 3. Intake Velocity */}
      <div className="col-span-2">
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-end">
            <span className="text-[10px] text-slate-500 font-bold">Coverage</span>
            <span className="text-[10px] font-mono text-slate-300">
              {firm.intakeCount} Roles
            </span>
          </div>
          {/* Visual Progress Bar Mock (Intake Count / 4 typical roles) */}
          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500/70"
              style={{ width: `${Math.min((firm.intakeCount / 4) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 4. Diagnostic State */}
      <div className="col-span-2">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${firm.diagnosticStatus === 'FINALIZED' ? 'bg-emerald-500' : 'bg-slate-700'}`} />
          <span className={`text-[10px] font-bold uppercase tracking-wide ${firm.diagnosticStatus === 'FINALIZED' ? 'text-emerald-400' : 'text-slate-500'}`}>
            {firm.diagnosticStatus?.replace('_', ' ') || 'PENDING'}
          </span>
        </div>
      </div>

      {/* 5. Executive Brief (Exec Only) */}
      <AuthorityGuard requiredCategory={AuthorityCategory.EXECUTIVE}>
        <div className="col-span-2">
          <BriefStatusBadge status={firm.executiveBriefStatus || 'NOT_CREATED'} />
        </div>
      </AuthorityGuard>

      {/* 6. Roadmap Authority (Exec Only) */}
      <AuthorityGuard requiredCategory={AuthorityCategory.EXECUTIVE}>
        <div className="col-span-2 text-right">
          <RoadmapStatusBadge status={firm.roadmapStatus || 'LOCKED'} />
        </div>
      </AuthorityGuard>
    </div>
  );
}

// ----------------------------------------------------------------------
// Status Components
// ----------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    prospect: 'text-slate-500 border-slate-700 bg-slate-800/50',
    engaged: 'text-indigo-400 border-indigo-500/30 bg-indigo-900/10',
    qualified: 'text-blue-400 border-blue-500/30 bg-blue-900/10',
    pilot_active: 'text-emerald-400 border-emerald-500/30 bg-emerald-900/10',
  };

  const defaultStyle = 'text-slate-500 border-slate-700 bg-slate-800/50';

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border ${styles[status] || defaultStyle}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function BriefStatusBadge({ status }: { status: string }) {
  const isAck = status === 'ACKNOWLEDGED' || status === 'WAIVED';
  const isReady = status === 'READY';

  return (
    <div className={`
            inline-flex items-center gap-1.5 px-2 py-1 rounded border text-[9px] font-bold uppercase tracking-wide transition-all
            ${isAck ? 'border-purple-500/30 bg-purple-900/20 text-purple-300' :
        isReady ? 'border-amber-500/30 bg-amber-900/20 text-amber-500 animate-pulse' :
          'border-slate-800 bg-slate-900 text-slate-600'}
        `}>
      {isAck && <span className="text-purple-400">✓</span>}
      {status.replace(/_/g, ' ')}
    </div>
  );
}

function RoadmapStatusBadge({ status }: { status: string }) {
  const isDelivered = status === 'DELIVERED';
  const isReady = status === 'READY';

  return (
    <span className={`
            text-[10px] font-mono font-bold
            ${isDelivered ? 'text-emerald-400' :
        isReady ? 'text-white' :
          'text-slate-600'}
        `}>
      {status}
    </span>
  );
}
