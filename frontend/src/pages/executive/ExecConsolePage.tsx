import { useState, useEffect, useRef } from 'react';
import { useParams } from 'wouter';
import { useAuth } from '../../context/AuthContext';
import RoiStrip from '../../components/executive/RoiStrip';
import { estimateROI, type RoiBaseline } from '../../utils/roiEstimator';
import TreDashboard from './TreDashboard';
import HootieDashboard from './HootieDashboard';
import KaitlinDashboard from './KaitlinDashboard';
import { validateSnapshot } from '../../contracts/validateSnapshot';
import type { TenantLifecycleSnapshotContract as SnapshotData } from '../../contracts/TenantLifecycleSnapshot';
import { useTenant } from '../../context/TenantContext';

// ---------------------------------------------------------------------------
// EXEC-TICKET-074-D: Seed signals if snapshot.signals is empty
// ---------------------------------------------------------------------------
const SEED_SIGNALS = [
  'Operational workflow latency',
  'Stakeholder alignment gap',
  'Data visibility constraints',
  'Resource allocation friction',
];

const SEED_FRICTION_SIGNALS = [
  'Operational Friction',
  'Owner Bottleneck',
  'Workflow Latency',
];

// ---------------------------------------------------------------------------
// Types — derived from TenantLifecycleView + TenantLifecycleSnapshot contract
// ---------------------------------------------------------------------------
interface Firm {
  id: string;
  name: string;
  status: string;
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------
type Tab = 'overview' | 'lifecycle' | 'signals' | 'findings' | 'graph' | 'tre' | 'hootie' | 'kaitlin';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview',  label: 'Overview'  },
  { id: 'lifecycle', label: 'Lifecycle' },
  { id: 'signals',   label: 'Signals'   },
  { id: 'findings',  label: 'Findings'  },
  { id: 'graph',     label: 'Graph'     },
  { id: 'tre',       label: 'Tre Ops' },
  { id: 'hootie',    label: 'Hootie Revenue' },
  { id: 'kaitlin',   label: 'Kaitlin Execution' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function resolveSignals(s: SnapshotData): string[] {
  if (s.signals?.length > 0) return s.signals;
  return SEED_SIGNALS;
}

function deriveConstraint(s: SnapshotData): string {
  if (s.projection.analytics.frictionMap?.highPriorityBottlenecks > 0) {
    return `Identified ${s.projection.analytics.frictionMap.highPriorityBottlenecks} critical operational bottlenecks requiring immediate review.`;
  }
  const phase = s.projection.lifecycle.currentPhase;
  if (phase === 'EXECUTION' || phase === 'EXECUTION_READY')
    return 'Managing transition from strategic planning to operational stabilization.';
  if (phase === 'ROADMAP_READY')
    return 'Finalizing stakeholder alignment and resource allocation for roadmap activation.';
  return 'Primary constraint is currently data collection and foundational baseline establishment.';
}

function deriveObjective(s: SnapshotData): string {
  const phase = s.projection.lifecycle.currentPhase;
  if (phase === 'EXECUTION' || phase === 'EXECUTION_READY') return 'Stabilize operational throughput';
  if (phase === 'ROADMAP_READY') return 'Activate strategic roadmap';
  return 'Complete discovery and define operational baseline';
}

function deriveNarrative(s: SnapshotData): string {
  const diagnostic = s.diagnostics?.overview;
  if (diagnostic && diagnostic.length > 20) return diagnostic;
  
  return 'The system is currently aggregating signals across the operation. Early indicators suggest opportunities for throughput optimization and hours recovery through process standardization.';
}

function deriveNextFocus(s: SnapshotData): string {
  const phase = s.projection.lifecycle.currentPhase;
  if (phase === 'EXECUTION' || phase === 'EXECUTION_READY')
    return 'Review high-priority friction vectors identified in the current stabilization phase.';
  if (phase === 'ROADMAP_READY') return 'Verify execution readiness and confirm resource availability.';
  return 'Ensure all intake vectors are completed to unlock high-fidelity diagnostics.';
}

const PHASE_LABELS: Record<string, string> = {
  OPEN_INITIAL:    'Discovery',
  INTAKE:          'Intake',
  DISCOVERY:       'Discovery',
  ROADMAP_READY:   'Roadmap Ready',
  EXECUTION_READY: 'Execution Ready',
  EXECUTION:       'Early Stabilization',
  SCALING:         'Scaling',
};

const STAGE_ORDER = ['intake', 'executiveBrief', 'diagnostic', 'discovery', 'synthesis', 'moderation', 'roadmap'] as const;
const STAGE_LABELS: Record<string, string> = {
  intake: 'Intake', executiveBrief: 'Executive Brief', diagnostic: 'Diagnostic',
  discovery: 'Discovery', synthesis: 'Synthesis', moderation: 'Moderation', roadmap: 'Roadmap',
};

// ---------------------------------------------------------------------------
// ── PANEL VIEWS ─────────────────────────────────────────────────────────────
// ---------------------------------------------------------------------------

// EXEC-TICKET-074-B: Overview (Dashboard)
// EXEC-TICKET-ROI-01 + ROI-02: ROI strip renders above constraint
function OverviewTab({ s }: { s: SnapshotData }) {
  const orgName  = s.tenant?.name || s.projection.identity?.tenantName || '—';
  const phase    = s.projection.lifecycle.currentPhase;
  const label    = PHASE_LABELS[phase] ?? phase;
  const signals  = resolveSignals(s);
  const constraint = deriveConstraint(s);
  const objective  = deriveObjective(s);
  const narrative  = deriveNarrative(s);
  const nextFocus  = deriveNextFocus(s);

  // EXEC-TICKET-ROI-04: compute ROI — falls back to seeded if no baseline
  const roi = estimateROI(
    s.roiBaseline
      ? { ...s.roiBaseline, lifecyclePhase: phase }
      : { lifecyclePhase: phase }
  );

  return (
    <div className="space-y-6">
      {/* ── ROI STRIP — economic impact first (EXEC-TICKET-ROI-02) ── */}
      <RoiStrip
        revenueUnlock={roi.revenueUnlockRange}
        hoursRecovered={roi.hoursRecoveredRange}
        throughputLift={roi.throughputIncrease}
        speedToValue={roi.speedToValue}
      />

      {/* Summary chips */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { l: 'Dominant Constraint', v: 'Production scheduling coordination', c: 'amber' },
          { l: 'Lifecycle Phase',      v: label,       c: 'indigo' },
          { l: 'Strategic Objective',  v: objective,   c: 'emerald' },
        ].map(({ l, v, c }) => (
          <div key={l} className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl">
            <div className={`text-[9px] font-black uppercase tracking-[0.2em] mb-2 text-${c}-500/70`}>{l}</div>
            <div className="text-sm font-bold text-slate-100 leading-snug">{v}</div>
          </div>
        ))}
      </div>

      {/* Dominant Constraint */}
      <div className="p-6 bg-amber-950/10 border border-amber-500/20 rounded-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">Dominant Constraint</h2>
        </div>
        <p className="text-lg font-semibold text-slate-100 leading-relaxed max-w-2xl">{constraint}</p>
      </div>

      {/* Signals + Context */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400">Emerging Signals</h2>
          </div>
          <ul className="space-y-3">
            {signals.map((sig, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="mt-1.5 flex-shrink-0 w-1 h-1 rounded-full bg-rose-400/60" />
                <span className="text-sm text-slate-200 font-medium leading-snug">{sig}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-6 bg-indigo-950/20 border border-indigo-500/20 rounded-2xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Strategic Context</h2>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{narrative}</p>
        </div>
      </div>

      {/* Focus */}
      <div className="p-6 bg-emerald-950/10 border border-emerald-500/20 rounded-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Recommended Focus</h2>
        </div>
        <p className="text-base font-semibold text-slate-100 leading-relaxed max-w-2xl">{nextFocus}</p>
      </div>
    </div>
  );
}

// EXEC-TICKET-074-C: Lifecycle
function LifecycleTab({ s }: { s: SnapshotData }) {
  const stages = s.projection.stages;
  const currentPhase = s.projection.lifecycle.currentPhase;
  const activeIndex = STAGE_ORDER.findIndex(
    st => (stages as any)[st] === 'ACTIVE' || (stages as any)[st] === 'READY'
  );

  const statusColor = (status: string) => {
    if (status === 'COMPLETE') return 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20';
    if (status === 'ACTIVE')   return 'text-indigo-400 border-indigo-500/30 bg-indigo-950/20';
    if (status === 'READY')    return 'text-amber-400 border-amber-500/30 bg-amber-950/15';
    return 'text-slate-500 border-slate-700 bg-slate-900/30';
  };

  const statusDot = (status: string) => {
    if (status === 'COMPLETE') return 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]';
    if (status === 'ACTIVE')   return 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.7)] animate-pulse';
    if (status === 'READY')    return 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]';
    return 'bg-slate-600';
  };

  return (
    <div className="space-y-6">
      <div className="p-6 bg-indigo-950/20 border border-indigo-500/20 rounded-2xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
          <span className="text-[9px] font-black uppercase tracking-[0.25em] text-indigo-400">Current Phase</span>
        </div>
        <p className="text-2xl font-black text-slate-100">{PHASE_LABELS[currentPhase] ?? currentPhase}</p>
        <p className="text-xs text-slate-500 mt-1 font-mono">{currentPhase}</p>
      </div>

      <div className="space-y-3">
        {STAGE_ORDER.map((stageKey, idx) => {
          const status = (stages as any)[stageKey] as string;
          return (
            <div key={stageKey} className={`p-4 border rounded-xl flex items-center gap-4 transition-all ${statusColor(status)}`}>
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusDot(status)}`} />
              <div className="flex-1">
                <div className="text-xs font-black uppercase tracking-widest">{STAGE_LABELS[stageKey]}</div>
              </div>
              <div className="text-[9px] font-black uppercase tracking-widest opacity-60">{status}</div>
            </div>
          );
        })}
      </div>

      <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl">
        <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Intake Window</div>
        <div className="text-sm font-bold text-slate-200">{s.projection.lifecycle.intakeWindowState}</div>
      </div>
    </div>
  );
}

// EXEC-TICKET-074-D: Signals
function SignalsTab({ s }: { s: SnapshotData }) {
  const fm = s.projection.analytics.frictionMap;
  const roi = s.projection.analytics.capacityROI;
  const signals = resolveSignals(s);
  const frictionSignals = fm.highPriorityBottlenecks === 0 ? SEED_FRICTION_SIGNALS : [];

  const roiColor: Record<string, string> = {
    HIGH: 'text-emerald-400', MEDIUM: 'text-amber-400', LOW: 'text-rose-400',
  };

  return (
    <div className="space-y-6">
      {/* Friction metrics */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Tickets',    value: fm.totalTickets,               c: 'slate'   },
          { label: 'Rejected',         value: fm.rejectedTickets,            c: 'rose'    },
          { label: 'Manual Workflows', value: fm.manualWorkflowsIdentified,  c: 'amber'   },
          { label: 'Bottlenecks',      value: fm.highPriorityBottlenecks,    c: 'indigo'  },
        ].map(({ label, value, c }) => (
          <div key={label} className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-center">
            <div className={`text-2xl font-black text-${c}-400`}>{value}</div>
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* ROI */}
      <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Projected Hours Saved / Week</div>
          <div className="text-3xl font-black text-slate-100">{roi.projectedHoursSavedWeekly}<span className="text-sm text-slate-500 ml-1">hrs</span></div>
        </div>
        <div className="text-right">
          <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Speed to Value</div>
          <div className={`text-lg font-black ${roiColor[roi.speedToValue] || 'text-slate-400'}`}>{roi.speedToValue}</div>
        </div>
      </div>

      {/* Live signals */}
      <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400">Operational Signals</h2>
        </div>
        <ul className="space-y-3">
          {[...signals, ...frictionSignals].map((sig, i) => (
            <li key={i} className="flex items-start gap-3 p-3 bg-slate-800/40 rounded-lg">
              <div className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-rose-400/70" />
              <span className="text-sm text-slate-200 font-medium">{sig}</span>
            </li>
          ))}
        </ul>
      </div>

      {fm.strategicMisalignmentScore > 0 && (
        <div className="p-4 bg-amber-950/10 border border-amber-500/20 rounded-xl">
          <div className="text-[9px] font-black uppercase tracking-widest text-amber-400 mb-1">Strategic Misalignment Score</div>
          <div className="text-2xl font-black text-amber-300">{fm.strategicMisalignmentScore}</div>
        </div>
      )}
    </div>
  );
}

// EXEC-TICKET-074-E: Findings (Artifacts)
function FindingsTab({ s }: { s: SnapshotData }) {
  const art = s.projection.artifacts;

  const items = [
    {
      label: 'Executive Brief',
      ready: art.hasExecutiveBrief,
      desc: art.hasExecutiveBrief ? 'Approved and on record.' : 'Not yet generated.',
      color: art.hasExecutiveBrief ? 'emerald' : 'slate',
    },
    {
      label: 'Diagnostic',
      ready: art.diagnostic.exists,
      desc: art.diagnostic.exists
        ? `Status: ${art.diagnostic.status ?? 'generated'}`
        : 'Pending discovery completion.',
      color: art.diagnostic.exists ? 'indigo' : 'slate',
    },
    {
      label: 'Canonical Findings',
      ready: art.hasCanonicalFindings,
      desc: art.hasCanonicalFindings ? 'Declared and locked.' : 'Awaiting moderation.',
      color: art.hasCanonicalFindings ? 'violet' : 'slate',
    },
    {
      label: 'Strategic Roadmap',
      ready: art.hasRoadmap,
      desc: art.hasRoadmap ? 'Roadmap assembled.' : 'Pending ticket execution.',
      color: art.hasRoadmap ? 'emerald' : 'slate',
    },
  ];

  const stageState = s.projection.stageState;
  const executionItems = [
    { label: 'Proposals Ready for Moderation', value: stageState.stage6ModerationReady },
    { label: 'Approved for Synthesis',         value: stageState.stage7SynthesisReady },
    { label: 'Execution Tickets Exist',        value: stageState.stage7TicketsExist },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {items.map(({ label, ready, desc, color }) => (
          <div key={label} className={`p-5 border rounded-2xl ${ready ? `bg-${color}-950/10 border-${color}-500/20` : 'bg-slate-900/40 border-slate-800'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-2 h-2 rounded-full ${ready ? `bg-${color}-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]` : 'bg-slate-600'}`} />
              <span className={`text-[10px] font-black uppercase tracking-widest ${ready ? `text-${color}-400` : 'text-slate-500'}`}>{label}</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.4)]" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-400">Execution State</h2>
        </div>
        <div className="space-y-3">
          {executionItems.map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg">
              <span className="text-sm text-slate-300">{label}</span>
              <span className={`text-[10px] font-black uppercase tracking-widest ${value ? 'text-emerald-400' : 'text-slate-500'}`}>
                {value ? 'Yes' : 'No'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// EXEC-TICKET-074-F: Graph (operational relationship map)
function GraphTab({ s }: { s: SnapshotData }) {
  const phase    = PHASE_LABELS[s.projection.lifecycle.currentPhase] ?? s.projection.lifecycle.currentPhase;
  const signals  = resolveSignals(s);
  const art      = s.projection.artifacts;

  // Build a simple relationship model: Phase → Signals → Artifacts
  const artifactList = [
    art.hasExecutiveBrief     && 'Executive Brief',
    art.diagnostic.exists     && 'Diagnostic',
    art.hasCanonicalFindings  && 'Canonical Findings',
    art.hasRoadmap            && 'Strategic Roadmap',
  ].filter(Boolean) as string[];

  const emptyArtifacts = [
    !art.hasExecutiveBrief    && 'Executive Brief',
    !art.diagnostic.exists    && 'Diagnostic',
    !art.hasCanonicalFindings && 'Canonical Findings',
    !art.hasRoadmap           && 'Strategic Roadmap',
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-4">
      {/* Relationship graph — vertical flow */}
      <div className="flex flex-col items-center gap-4 py-4">

        {/* Node: Lifecycle Stage */}
        <div className="px-8 py-4 bg-indigo-950/30 border border-indigo-500/30 rounded-2xl text-center w-72">
          <div className="text-[9px] font-black uppercase tracking-[0.25em] text-indigo-400 mb-1">Lifecycle Stage</div>
          <div className="text-lg font-black text-slate-100">{phase}</div>
        </div>

        {/* Connector */}
        <div className="flex flex-col items-center">
          <div className="w-px h-6 bg-gradient-to-b from-indigo-500/80 to-rose-500/80" />
          <div className="text-[9px] text-slate-600 font-bold tracking-widest">drives</div>
          <div className="w-px h-6 bg-gradient-to-b from-rose-500/80 to-rose-500/40" />
        </div>

        {/* Node: Signals */}
        <div className="px-6 py-4 bg-rose-950/20 border border-rose-500/20 rounded-2xl w-72">
          <div className="text-[9px] font-black uppercase tracking-[0.25em] text-rose-400 mb-3">Operational Signals</div>
          <div className="space-y-1.5">
            {signals.slice(0, 3).map((sig, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-rose-400/60 flex-shrink-0" />
                <span className="text-xs text-slate-300">{sig}</span>
              </div>
            ))}
            {signals.length > 3 && (
              <div className="text-[10px] text-slate-500 pl-3">+{signals.length - 3} more</div>
            )}
          </div>
        </div>

        {/* Connector */}
        <div className="flex flex-col items-center">
          <div className="w-px h-6 bg-gradient-to-b from-rose-500/50 to-emerald-500/80" />
          <div className="text-[9px] text-slate-600 font-bold tracking-widest">surface</div>
          <div className="w-px h-6 bg-gradient-to-b from-emerald-500/80 to-emerald-500/40" />
        </div>

        {/* Node: Artifacts */}
        <div className="px-6 py-4 bg-emerald-950/10 border border-emerald-500/20 rounded-2xl w-72">
          <div className="text-[9px] font-black uppercase tracking-[0.25em] text-emerald-400 mb-3">Artifacts</div>
          {artifactList.length > 0 ? (
            <div className="space-y-1.5">
              {artifactList.map((a, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/70 flex-shrink-0" />
                  <span className="text-xs text-slate-300">{a}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No artifacts yet.</p>
          )}
          {emptyArtifacts.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-800">
              <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-1.5">Pending</div>
              {emptyArtifacts.map((a, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600 flex-shrink-0" />
                  <span className="text-xs text-slate-500">{a}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary legend */}
      <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl">
        <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Projection Integrity</div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Authority Spine: <span className="text-emerald-400 font-bold">OPERATIONAL</span></span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          <span>Data source: <span className="text-indigo-400 font-mono text-[10px]">GET /api/snapshot/:tenantId</span></span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TrustAgent Panel (shared across tabs, always accessible)
// ---------------------------------------------------------------------------
function TrustAgentPanel({ tenantId, snapshot, user }: {
  tenantId: string;
  snapshot: SnapshotData | null;
  user: any;
}) {
  const [question, setQuestion]     = useState('');
  const [answer, setAnswer]         = useState<string | null>(null);
  const [loading, setLoading]       = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const ask = async () => {
    if (!question.trim() || !tenantId) return;
    setLoading(true);
    setAnswer(null);
    try {
      const token = localStorage.getItem('token');
      const roi = snapshot ? estimateROI(
        snapshot.roiBaseline
          ? { ...snapshot.roiBaseline, lifecyclePhase: snapshot.projection.lifecycle.currentPhase }
          : { lifecyclePhase: snapshot.projection.lifecycle.currentPhase }
      ) : undefined;

      const consoleContext = snapshot ? {
        dominantConstraint: deriveConstraint(snapshot),
        lifecyclePhase: PHASE_LABELS[snapshot.projection.lifecycle.currentPhase] ?? snapshot.projection.lifecycle.currentPhase,
        strategicObjective: deriveObjective(snapshot),
        signals: resolveSignals(snapshot),
        strategicNarrative: deriveNarrative(snapshot),
        roi: roi ? {
          revenueUnlock: roi.revenueUnlockRange,
          hoursRecovered: roi.hoursRecoveredRange,
          throughputLift: roi.throughputIncrease,
          speedToValue: roi.speedToValue
        } : undefined
      } : undefined;
      const res = await fetch('/api/agent/query', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tenantId, role: user?.role || 'owner', question: question.trim(), consoleContext }),
      });
      const json = await res.json();
      setAnswer(json.reply || json.error || 'No response.');
    } catch {
      setAnswer('System temporarily unavailable. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-slate-900/60 border border-slate-700/50 rounded-2xl">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-400">Ask the System</h2>
      </div>
      <div className="flex gap-3 mb-4">
        <input
          ref={inputRef}
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && ask()}
          placeholder='e.g. "What is constraining the operation right now?"'
          className="flex-1 bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
        />
        <button
          onClick={ask}
          disabled={loading || !question.trim()}
          className="px-6 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[10px] font-black uppercase tracking-[0.15em] rounded-xl transition-all"
        >
          {loading ? '…' : 'Query'}
        </button>
      </div>
      {answer && (
        <div className="p-4 bg-violet-950/20 border border-violet-500/20 rounded-xl">
          <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{answer}</p>
        </div>
      )}
      {!answer && !loading && (
        <div className="flex flex-wrap gap-2">
          {['What is the dominant constraint?', 'What should I review first?', 'What risk is emerging?'].map(p => (
            <button key={p} onClick={() => { setQuestion(p); inputRef.current?.focus(); }}
              className="text-[11px] px-3 py-1.5 bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-violet-500/30 rounded-lg transition-all">
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page — META-TICKET-074 execution surface
// ---------------------------------------------------------------------------
export default function ExecConsolePage() {
  const { tenant: authTenant, user } = useAuth();
  const { tenant: contextTenant } = useTenant();
  const { tenantId: urlTenantId } = useParams();
  
  // TICKET-075-A: Tenant Browser State
  const [activeTenantId, setActiveTenantId] = useState<string | undefined>(urlTenantId);
  const [firms, setFirms] = useState<Firm[]>([]);

  const [snapshot, setSnapshot] = useState<SnapshotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // TrustAgent local state
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isSA = user?.role === 'superadmin';

  // Load Firms for SA browser
  useEffect(() => {
    if (isSA) {
      const token = localStorage.getItem('token');
      fetch('/api/firms', { 
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
        .then(res => res.json())
        .then(json => {
          if (json.success && Array.isArray(json.data)) {
            setFirms(json.data);
            // Auto-select first firm if no context exists
            if (!activeTenantId && !urlTenantId && json.data.length > 0) {
              setActiveTenantId(json.data[0].id);
            }
          }
        })
        .catch(err => console.error('Failed to load firms', err));
    }
  }, [isSA]);

  useEffect(() => {
    async function load() {
      // Priority: 1. Manual selection 2. URL param 3. Auth tenant 4. Context tenant
      const targetId = activeTenantId || urlTenantId || authTenant?.id || contextTenant?.id;
      if (!targetId) {
        if (!isSA) {
          setError('No tenant context identified.');
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/snapshot/${targetId}`, { 
          credentials: 'include',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const json = await res.json();

        if (res.status === 403) {
          setError('Snapshot returned 403 — authority gate rejected request.');
          return;
        }

        if (json.success) {
          // EXEC-TICKET-075-B: Enforce Contract Guardrail
          const validated = validateSnapshot(json.data);
          setSnapshot(validated);
        } else {
          setError(json.error || 'Failed to resolve projection.');
        }
      } catch (err) {
        setError('System error: could not connect to projection service.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [activeTenantId, urlTenantId, authTenant]);

  const renderTab = () => {
    if (!snapshot) return null;
    switch (activeTab) {
      case 'overview':  return <OverviewTab s={snapshot} />;
      case 'lifecycle': return <LifecycleTab s={snapshot} />;
      case 'signals':   return <SignalsTab s={snapshot} />;
      case 'findings':  return <FindingsTab s={snapshot} />;
      case 'graph':     return <GraphTab s={snapshot} />;
      case 'tre':       return <TreDashboard snapshot={snapshot} />;
      case 'hootie':    return <HootieDashboard snapshot={snapshot} />;
      case 'kaitlin':   return <KaitlinDashboard snapshot={snapshot} />;
      default:          return <OverviewTab s={snapshot} />;
    }
  };

  const handleTenantChange = (id: string) => {
    setActiveTenantId(id);
    setResponse(null); // Clear agent session on context shift
    // Update URL without full reload if using wouter but for this surface
    // we just let the local state drive the snapshot refetch.
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-px h-16 bg-gradient-to-b from-transparent via-indigo-500 to-transparent mx-auto animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">
            Resolving Operational State
          </p>
        </div>
      </div>
    );
  }

  const currentTenantId = activeTenantId || urlTenantId || authTenant?.id || '';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <header className="border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Strategic AI</span>
            </div>
            <h1 className="text-xl font-black text-slate-100 tracking-tight">
              {snapshot?.tenant?.name || 
               firms.find(f => f.id === (activeTenantId || urlTenantId))?.name || 
               'Executive Console'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {isSA && (
              <select 
                title="Select Tenant"
                className="bg-slate-900 border border-slate-700 text-xs font-bold text-slate-300 px-3 py-1.5 rounded-lg focus:outline-none focus:border-indigo-500"
                value={activeTenantId || urlTenantId || ''}
                onChange={(e) => handleTenantChange(e.target.value)}
              >
                <option value="">{firms.length === 0 ? 'Loading firms...' : 'Select a firm...'}</option>
                {firms.map((f: Firm) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            )}
            <div className="px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Executive Console</span>
            </div>
          </div>
        </div>

        {/* ── TAB BAR ───────────────────────────────────────────── */}
        <div className="max-w-5xl mx-auto px-6 flex gap-1 pb-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── CONTENT ─────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {error && (
          <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl text-xs text-amber-400/80">
            ⚠ {error} — panels rendering from cached state.
          </div>
        )}

        {/* Tab panels */}
        {snapshot ? (
          renderTab()
        ) : (
          // No snapshot — still render seeded overview so screen is never blank
          <OverviewTab s={{
            projection: {
              lifecycle: { currentPhase: 'DISCOVERY', intakeWindowState: 'OPEN', intakeVersion: 1 },
              analytics: { frictionMap: { totalTickets: 0, rejectedTickets: 0, manualWorkflowsIdentified: 0, strategicMisalignmentScore: 0, highPriorityBottlenecks: 0 }, capacityROI: { projectedHoursSavedWeekly: 0, speedToValue: 'LOW' } },
              artifacts: { hasRoadmap: false, hasExecutiveBrief: false, hasCanonicalFindings: false, diagnostic: { exists: false } },
              stages: { intake: 'ACTIVE', executiveBrief: 'LOCKED', diagnostic: 'LOCKED', discovery: 'LOCKED', synthesis: 'LOCKED', moderation: 'LOCKED', roadmap: 'LOCKED' },
              workflow: { discoveryComplete: false, roadmapComplete: false, knowledgeBaseReady: false },
              stageState: { stage6ModerationReady: false, stage7SynthesisReady: false, stage7TicketsExist: false },
              identity: { tenantName: 'Strategic AI Console' },
            },
            tenant: null,
            signals: [],
            diagnostics: null,
          }} />
        )}

        {/* TrustAgent always rendered at bottom */}
        <TrustAgentPanel tenantId={currentTenantId} snapshot={snapshot} user={user} />
      </main>
    </div>
  );
}
