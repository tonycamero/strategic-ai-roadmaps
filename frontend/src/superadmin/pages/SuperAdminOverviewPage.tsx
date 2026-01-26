import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { superadminApi } from '../api';
import { SuperAdminOverview } from '../types';
import { StrategyActivityFeed } from '../components/strategy/StrategyActivityFeed';

export default function SuperAdminOverviewPage() {
  const [data, setData] = useState<SuperAdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    superadminApi
      .getOverview()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <div className="text-slate-400">Loading strategy overview…</div>;
  if (error)
    return (
      <div className="text-red-400">Failed to load overview: {error}</div>
    );
  if (!data) return <div className="text-slate-400">No data available yet.</div>;

  const tenantStatusCounts = data.statusStats.reduce((acc, s) => {
    acc[s.status || 'unknown'] = s.count;
    return acc;
  }, {} as Record<string, number>);

  const roadmapStatusCounts = data.roadmapStats.reduce((acc, s) => {
    acc[s.status || 'unknown'] = s.count;
    return acc;
  }, {} as Record<string, number>);

  const pilotStageCounts = data.pilotStats.reduce((acc, s) => {
    acc[s.pilotStage || 'none'] = s.count;
    return acc;
  }, {} as Record<string, number>);

  const activeCohorts = data.cohortStats.filter((c) => c.cohortLabel).length;
  const activeFirms = tenantStatusCounts['active'] || 0;
  const draftRoadmaps = roadmapStatusCounts['draft'] || 0;
  const deliveredRoadmaps = roadmapStatusCounts['delivered'] || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Strategy
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Portfolio intelligence & decision surface
        </p>
      </header>

      {/* Portfolio Snapshot - Executive Strip */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <MetricCard label="Total Firms" value={data.totalFirms} />
        <MetricCard label="Active Firms" value={activeFirms} />
        <MetricCard label="Total Intakes" value={data.totalIntakes} />
        <MetricCard label="Active Cohorts" value={activeCohorts} />
        <MetricCard
          label="Roadmaps"
          value={`${draftRoadmaps} / ${deliveredRoadmaps}`}
          sublabel="Draft / Delivered"
        />
      </section>

      {/* Main Content Grid: Left Column (Cards + Actions) + Right Column (Activity Feed) */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Left Column: Decision Cards + Quick Actions + Cohorts */}
        <div className="xl:col-span-3 space-y-4">
          {/* Decision Entry Cards */}
          <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <StatusCard
              title="Firm Lifecycle"
              items={tenantStatusCounts}
              tooltip="Where each firm sits in your lifecycle."
              onClick={(status) => setLocation(`/superadmin/firms?status=${status}`)}
            />
            <StatusCard
              title="Roadmap Status"
              items={{
                draft: roadmapStatusCounts['draft'] || 0,
                delivered: roadmapStatusCounts['delivered'] || 0
              }}
              tooltip="Delivery status across all client roadmaps."
              onClick={(status) => setLocation(`/superadmin/execute?roadmapStatus=${status}`)}
            />
            <StatusCard
              title="Pilot Stage"
              items={pilotStageCounts}
              tooltip="Pilot funnel across your cohorts."
              emptyMessage="No pilots currently progressing"
              onClick={(stage) => setLocation('/superadmin/pipeline')}
            />
          </section>

          {/* Quick Actions + Active Cohorts */}
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Quick Actions */}
            <div className="border border-slate-800 rounded-2xl bg-slate-950/60 p-4 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">
                  Quick Actions
                </h2>
                <p className="text-xs text-slate-400">
                  Navigate to key decision points
                </p>
              </div>

              <div className="space-y-2">
                <QuickAction
                  title="Review new lead requests"
                  description="Scan and qualify inbound firms from the landing page"
                  onClick={() => setLocation('/superadmin/leads')}
                />
                <QuickAction
                  title="Review cohort pipeline"
                  description="Fine-tune which firms move toward active pilots"
                  onClick={() => setLocation('/superadmin/pipeline')}
                />
                <QuickAction
                  title="Browse firms directory"
                  description="See all enrolled firms across cohorts"
                  onClick={() => setLocation('/superadmin/firms')}
                />
                <QuickAction
                  title="Tap into client agents"
                  description="Query a firm's AI Agent as their team"
                  onClick={() => setLocation('/superadmin/agent')}
                  disabled
                />
              </div>
            </div>

            {/* Active Cohorts */}
            <div className="border border-slate-800 rounded-2xl bg-slate-950/60 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">
                    Active Cohorts
                  </h2>
                  <p className="text-xs text-slate-400">
                    {activeCohorts} cohort{activeCohorts !== 1 ? 's' : ''} in progress
                  </p>
                </div>
              </div>

              {data.cohortStats.length === 0 ? (
                <div className="text-xs text-slate-500 py-4">
                  No active cohorts yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {data.cohortStats
                    .filter((c) => c.cohortLabel)
                    // Deduplicate by cohort label (case-insensitive)
                    .filter((cohort, index, self) =>
                      index === self.findIndex(c =>
                        c.cohortLabel.toLowerCase() === cohort.cohortLabel.toLowerCase()
                      )
                    )
                    .map((cohort) => (
                      <div
                        key={cohort.cohortLabel}
                        className="flex items-center justify-between py-2 text-xs border-b border-slate-800 last:border-0"
                      >
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium text-slate-100">
                              {cohort.cohortLabel}
                            </div>
                            <div className="text-slate-500">
                              {cohort.count} firm{cohort.count !== 1 ? 's' : ''}
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium uppercase tracking-wider">
                            Active
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setLocation(`/superadmin/pipeline/${cohort.cohortLabel}`)}
                          className="text-xs px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-100 transition-colors"
                        >
                          View Board
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Activity Feed - Full Height */}
        <div className="xl:col-span-1">
          <div className="sticky top-4 h-[calc(100vh-8rem)]">
            <StrategyActivityFeed />
          </div>
        </div>
      </div>
    </div>
  );
}


function MetricCard({
  label,
  value,
  sublabel
}: {
  label: string;
  value: number | string;
  sublabel?: string;
}) {
  return (
    <div className="border border-slate-800 rounded-xl px-4 py-3 bg-slate-950/80">
      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
        {label}
      </div>
      <div className="text-xl font-semibold text-slate-50 mt-1">
        {value}
      </div>
      {sublabel && (
        <div className="text-[9px] text-slate-500 mt-0.5">
          {sublabel}
        </div>
      )}
    </div>
  );
}

function StatusCard({
  title,
  items,
  tooltip,
  emptyMessage = "No data yet",
  onClick,
}: {
  title: string;
  items: Record<string, number>;
  tooltip?: string;
  emptyMessage?: string;
  onClick?: (key: string) => void;
}) {
  const entries = Object.entries(items || {});

  return (
    <div className="border border-slate-800 rounded-2xl bg-slate-950/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
          {tooltip && (
            <p className="text-xs text-slate-400 mt-0.5">{tooltip}</p>
          )}
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="text-xs text-slate-500 py-3">{emptyMessage}</div>
      ) : (
        <dl className="space-y-2 text-xs">
          {entries.map(([key, value]) => (
            <div
              key={key}
              className={`flex items-center justify-between ${onClick ? 'cursor-pointer hover:bg-slate-900/50 -mx-2 px-2 py-1.5 rounded transition-colors' : ''}`}
              onClick={() => onClick?.(key)}
            >
              <dt className="text-slate-400 capitalize">{key}</dt>
              <dd className="text-sm font-semibold text-slate-100">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

function QuickAction({
  title,
  description,
  onClick,
  disabled = false,
}: {
  title: string;
  description: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left border border-slate-800 rounded-xl px-3.5 py-2.5 transition-colors ${disabled
        ? 'bg-slate-950/30 opacity-50 cursor-not-allowed'
        : 'bg-slate-950/70 hover:bg-slate-900'
        }`}
    >
      <div className="text-xs font-semibold text-slate-100">
        {title}
        {disabled && <span className="ml-2 text-[10px] text-slate-500">(coming soon)</span>}
      </div>
      <div className="text-[11px] text-slate-400 mt-0.5">{description}</div>
    </button>
  );
}

