/**
 * Kaitlin Execution Dashboard — EXEC-TICKET-075-E
 * Kaitlin manages roadmap execution and artifact pipeline.
 * Data source: snapshot.projection.artifacts + projection.stageState
 */
import type { TenantLifecycleSnapshotContract } from '../../contracts/TenantLifecycleSnapshot';

interface Props { snapshot: TenantLifecycleSnapshotContract }

type ArtifactStatus = 'COMPLETE' | 'ACTIVE' | 'NOT STARTED';

function artifactStatus(exists: boolean, active?: boolean): ArtifactStatus {
  if (exists)  return 'COMPLETE';
  if (active)  return 'ACTIVE';
  return 'NOT STARTED';
}

function statusStyle(s: ArtifactStatus) {
  if (s === 'COMPLETE')    return { dot: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-950/10' };
  if (s === 'ACTIVE')      return { dot: 'bg-indigo-500 animate-pulse', text: 'text-indigo-400', border: 'border-indigo-500/20', bg: 'bg-indigo-950/10' };
  return { dot: 'bg-slate-600', text: 'text-slate-500', border: 'border-slate-700', bg: 'bg-slate-900/30' };
}

export default function KaitlinDashboard({ snapshot }: Props) {
  const art = snapshot.projection.artifacts;
  const ss  = snapshot.projection.stageState;
  const wf  = snapshot.projection.workflow;

  const artifacts = [
    {
      label: 'Executive Brief',
      desc:  art.hasExecutiveBrief ? 'Approved and on record.' : 'Not yet generated.',
      status: artifactStatus(art.hasExecutiveBrief),
    },
    {
      label: 'Diagnostic',
      desc:  art.diagnostic.exists
        ? `Status: ${art.diagnostic.status ?? 'generated'}`
        : 'Pending discovery completion.',
      status: artifactStatus(art.diagnostic.exists),
    },
    {
      label: 'Canonical Findings',
      desc:  art.hasCanonicalFindings ? 'Declared and locked.' : 'Awaiting moderation.',
      status: artifactStatus(art.hasCanonicalFindings, ss.stage6ModerationReady),
    },
    {
      label: 'Strategic Roadmap',
      desc:  art.hasRoadmap ? 'Roadmap assembled.' : 'Pending ticket execution.',
      status: artifactStatus(art.hasRoadmap, ss.stage7TicketsExist),
    },
  ];

  const gates = [
    { label: 'Discovery Complete',        ok: wf.discoveryComplete },
    { label: 'Knowledge Base Ready',      ok: wf.knowledgeBaseReady },
    { label: 'Roadmap Complete',          ok: wf.roadmapComplete },
    { label: 'Stage 6 (Moderation Ready)', ok: ss.stage6ModerationReady },
    { label: 'Stage 7 (Synthesis Ready)', ok: ss.stage7SynthesisReady },
    { label: 'Execution Tickets Exist',   ok: ss.stage7TicketsExist },
  ];

  const completedCount = artifacts.filter(a => a.status === 'COMPLETE').length;
  const progressPct    = Math.round((completedCount / artifacts.length) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 px-1">
        <div className="w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
        <span className="text-[9px] font-black uppercase tracking-[0.25em] text-violet-400">Kaitlin · Execution View</span>
      </div>

      {/* Pipeline Progress */}
      <div className="p-5 bg-violet-950/10 border border-violet-500/20 rounded-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[9px] font-black uppercase tracking-widest text-violet-400">Artifact Pipeline</div>
          <div className="text-xs font-black text-violet-300">{completedCount}/{artifacts.length} Complete</div>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Artifact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {artifacts.map(({ label, desc, status }) => {
          const st = statusStyle(status);
          return (
            <div key={label} className={`p-5 border rounded-2xl ${st.bg} ${st.border}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${st.dot}`} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${st.text}`}>{label}</span>
                <span className={`ml-auto text-[9px] font-black uppercase tracking-widest ${st.text} opacity-70`}>
                  {status}
                </span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{desc}</p>
            </div>
          );
        })}
      </div>

      {/* Stage Gate Status */}
      <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Stage Gate Checklist</div>
        <div className="space-y-2">
          {gates.map(({ label, ok }) => (
            <div key={label} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ok ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                <span className="text-sm text-slate-300">{label}</span>
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest ${ok ? 'text-emerald-400' : 'text-slate-600'}`}>
                {ok ? 'Ready' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
