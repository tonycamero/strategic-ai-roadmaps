/**
 * Hootie Revenue Dashboard — EXEC-TICKET-075-D
 * Hootie tracks financial outcome signals and ROI projections.
 * Data source: snapshot.roiBaseline + snapshot.projection.analytics.capacityROI
 */
import type { TenantLifecycleSnapshotContract } from '../../contracts/TenantLifecycleSnapshot';
import { estimateROI } from '../../utils/roiEstimator';

interface Props { snapshot: TenantLifecycleSnapshotContract }

function fmtCurrency(n?: number): string {
  if (!n) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

function fmtPct(n?: number): string {
  if (!n) return '—';
  return `${(n * 100).toFixed(1)}%`;
}

export default function HootieDashboard({ snapshot }: Props) {
  const roi    = snapshot.roiBaseline;
  const capROI = snapshot.projection.analytics.capacityROI;
  const phase  = snapshot.projection.lifecycle.currentPhase;

  // Derive estimated ROI using the estimator (with lifecycle phase context)
  const est = estimateROI(roi ? { ...roi, lifecyclePhase: phase } : { lifecyclePhase: phase });

  // Derived metrics
  const weeklyRevenue   = roi?.monthlyLeadVolume && roi?.closeRate && roi?.avgJobValue
    ? Math.round((roi.monthlyLeadVolume * roi.closeRate * roi.avgJobValue) / 4.33)
    : null;
  const revenuePerLead  = roi?.closeRate && roi?.avgJobValue
    ? Math.round(roi.closeRate * roi.avgJobValue)
    : null;
  const revenuePerRep   = weeklyRevenue && roi?.salesRepCount
    ? Math.round(weeklyRevenue / roi.salesRepCount)
    : null;

  const speedColor: Record<string, string> = {
    HIGH: 'text-emerald-400', MEDIUM: 'text-amber-400', LOW: 'text-rose-400',
  };

  const baselineCards = [
    { label: 'Monthly Lead Volume', value: roi?.monthlyLeadVolume?.toString() ?? '—', sub: 'leads / mo' },
    { label: 'Close Rate',          value: fmtPct(roi?.closeRate),                    sub: 'conversion'  },
    { label: 'Avg Job Value',       value: fmtCurrency(roi?.avgJobValue),             sub: 'per close'   },
    { label: 'Sales Reps',          value: roi?.salesRepCount?.toString() ?? '—',     sub: 'headcount'   },
    { label: 'Ops / Admin',         value: roi?.opsAdminCount?.toString() ?? '—',     sub: 'headcount'   },
    { label: 'Avg Response Time',   value: roi?.avgResponseTime ? `${roi.avgResponseTime}h` : '—', sub: 'hrs to respond' },
  ];

  const derivedCards = [
    { label: 'Weekly Revenue',   value: fmtCurrency(weeklyRevenue ?? undefined) },
    { label: 'Revenue per Lead', value: fmtCurrency(revenuePerLead ?? undefined) },
    { label: 'Revenue per Rep',  value: revenuePerRep ? fmtCurrency(revenuePerRep) : '—' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 px-1">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
        <span className="text-[9px] font-black uppercase tracking-[0.25em] text-emerald-400">Hootie · Revenue View</span>
      </div>

      {/* ROI Estimates */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Revenue Unlock',  value: est.revenueUnlockRange,  c: 'emerald' },
          { label: 'Hours Recovered', value: est.hoursRecoveredRange, c: 'indigo'  },
          { label: 'Throughput Lift', value: est.throughputIncrease,  c: 'amber'   },
          { label: 'Speed to Value',  value: est.speedToValue,        c: 'violet'  },
        ].map(({ label, value, c }) => (
          <div key={label} className={`p-4 border border-${c}-500/20 bg-${c}-950/10 rounded-2xl`}>
            <div className={`text-[9px] font-black uppercase tracking-widest text-${c}-400/80 mb-2`}>{label}</div>
            <div className={`text-base font-black text-${c}-300 leading-tight`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Capacity ROI */}
      <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between">
        <div>
          <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Projected Hours Saved / Week</div>
          <div className="text-3xl font-black text-slate-100">
            {capROI.projectedHoursSavedWeekly}
            <span className="text-sm text-slate-500 ml-1">hrs</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Speed to Value</div>
          <div className={`text-xl font-black ${speedColor[capROI.speedToValue] ?? 'text-slate-400'}`}>
            {capROI.speedToValue}
          </div>
        </div>
      </div>

      {/* Baseline Metrics */}
      <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
          ROI Baseline Inputs
          {!roi && <span className="ml-2 text-amber-500/60 normal-case font-normal">(seeded — no baseline in snapshot)</span>}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {baselineCards.map(({ label, value, sub }) => (
            <div key={label} className="p-3 bg-slate-800/40 border border-slate-700 rounded-xl">
              <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">{label}</div>
              <div className="text-base font-black text-slate-100">{value}</div>
              <div className="text-[9px] text-slate-600">{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Derived Metrics */}
      <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Derived Revenue Metrics</div>
        <div className="grid grid-cols-3 gap-3">
          {derivedCards.map(({ label, value }) => (
            <div key={label} className="p-4 bg-emerald-950/10 border border-emerald-500/15 rounded-xl text-center">
              <div className="text-xl font-black text-emerald-300">{value}</div>
              <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
