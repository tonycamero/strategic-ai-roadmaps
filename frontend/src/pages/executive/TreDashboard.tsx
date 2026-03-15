/**
 * Tre Operations Dashboard — EXEC-TICKET-075-C
 * Tre monitors operational friction and execution readiness.
 * Data source: TenantLifecycleSnapshotContract (projection only, no raw DB reads)
 */
import type { TenantLifecycleSnapshotContract } from '../../contracts/TenantLifecycleSnapshot';

interface Props { snapshot: TenantLifecycleSnapshotContract }

const STAGE_ORDER = [
  'intake', 'executiveBrief', 'diagnostic', 'discovery', 'synthesis', 'moderation', 'roadmap',
] as const;

const STAGE_LABELS: Record<string, string> = {
  intake: 'Intake', executiveBrief: 'Executive Brief', diagnostic: 'Diagnostic',
  discovery: 'Discovery', synthesis: 'Synthesis', moderation: 'Moderation', roadmap: 'Roadmap',
};

const PHASE_LABELS: Record<string, string> = {
  OPEN_INITIAL: 'Discovery', INTAKE: 'Intake', DISCOVERY: 'Discovery',
  ROADMAP_READY: 'Roadmap Ready', EXECUTION_READY: 'Execution Ready',
  EXECUTION: 'Early Stabilization', SCALING: 'Scaling',
};

function stageDot(status: string) {
  if (status === 'COMPLETE') return 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]';
  if (status === 'ACTIVE')   return 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.7)] animate-pulse';
  if (status === 'READY')    return 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]';
  return 'bg-slate-600';
}

function stageBg(status: string) {
  if (status === 'COMPLETE') return 'border-emerald-500/25 bg-emerald-950/10 text-emerald-400';
  if (status === 'ACTIVE')   return 'border-indigo-500/25 bg-indigo-950/10 text-indigo-400';
  if (status === 'READY')    return 'border-amber-500/25 bg-amber-950/10 text-amber-400';
  return 'border-slate-700 bg-slate-900/30 text-slate-500';
}

export default function TreDashboard({ snapshot }: Props) {
  const { projection } = snapshot;
  const fm     = projection.analytics.frictionMap;
  const stages = projection.stages;
  const phase  = projection.lifecycle.currentPhase;
  const ss     = projection.stageState;

  const frictionItems = [
    { label: 'High-Priority Bottlenecks', value: fm.highPriorityBottlenecks, c: 'rose' },
    { label: 'Manual Workflows',          value: fm.manualWorkflowsIdentified, c: 'amber' },
    { label: 'Rejected Tickets',          value: fm.rejectedTickets, c: 'orange' },
    { label: 'Misalignment Score',        value: fm.strategicMisalignmentScore, c: 'violet' },
  ];

  const readinessItems = [
    { label: 'Roadmap Ready',       ok: projection.artifacts.hasRoadmap },
    { label: 'Canonical Findings',  ok: projection.artifacts.hasCanonicalFindings },
    { label: 'Diagnostic Exists',   ok: projection.artifacts.diagnostic.exists },
    { label: 'Stage 6 Ready',       ok: ss.stage6ModerationReady },
    { label: 'Stage 7 Ready',       ok: ss.stage7SynthesisReady },
    { label: 'Exec Tickets Exist',  ok: ss.stage7TicketsExist },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 px-1">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
        <span className="text-[9px] font-black uppercase tracking-[0.25em] text-amber-400">Tre · Operations View</span>
      </div>

      {/* Section 1: Operational Phase */}
      <div className="p-6 bg-indigo-950/20 border border-indigo-500/20 rounded-2xl">
        <div className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-2">Operational Phase</div>
        <div className="text-2xl font-black text-slate-100">{PHASE_LABELS[phase] ?? phase}</div>
        <div className="text-xs font-mono text-slate-500 mt-1">{phase}</div>
      </div>

      {/* Section 2: Friction Map */}
      <div className="p-6 bg-rose-950/10 border border-rose-500/20 rounded-2xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400">Friction Map</div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {frictionItems.map(({ label, value, c }) => (
            <div key={label} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-center">
              <div className={`text-2xl font-black text-${c}-400`}>{value}</div>
              <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-1 leading-tight">{label}</div>
            </div>
          ))}
        </div>
        {fm.highPriorityBottlenecks === 0 && (
          <p className="text-xs text-slate-500 mt-4 italic">No bottlenecks detected in current projection window.</p>
        )}
      </div>

      {/* Section 3: Stage Status */}
      <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Stage Pipeline</div>
        <div className="space-y-2">
          {STAGE_ORDER.map(key => {
            const status = (stages as any)[key] as string;
            return (
              <div key={key} className={`p-3 border rounded-xl flex items-center gap-3 ${stageBg(status)}`}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${stageDot(status)}`} />
                <span className="text-xs font-bold flex-1">{STAGE_LABELS[key]}</span>
                <span className="text-[9px] font-black uppercase tracking-widest opacity-70">{status}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 4: Execution Readiness */}
      <div className="p-6 bg-emerald-950/10 border border-emerald-500/20 rounded-2xl">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-4">Execution Readiness</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {readinessItems.map(({ label, ok }) => (
            <div key={label} className={`p-3 border rounded-xl flex items-center gap-2 ${ok ? 'border-emerald-500/20 bg-emerald-950/10' : 'border-slate-700 bg-slate-900/30'}`}>
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ok ? 'bg-emerald-500' : 'bg-slate-600'}`} />
              <span className={`text-[10px] font-bold ${ok ? 'text-emerald-300' : 'text-slate-500'}`}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
