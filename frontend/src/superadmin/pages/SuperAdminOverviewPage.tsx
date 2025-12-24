import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { superadminApi } from '../api';
import { SuperAdminOverview } from '../types';

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
    return <div className="text-slate-400">Loading command center…</div>;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            SuperAdmin Command Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            High-level control over firms, cohorts, roadmaps, and activity.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-end">
          <MetricPill label="Total Firms" value={data.totalFirms} />
          <MetricPill label="Total Intakes" value={data.totalIntakes} />
          <MetricPill label="Active Cohorts" value={activeCohorts} />
        </div>
      </header>

      {/* Top row: system stats */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <StatusCard
          title="Tenant Status"
          items={tenantStatusCounts}
          tooltip="Where each firm sits in your lifecycle."
        />
        <StatusCard
          title="Roadmap Status"
          items={roadmapStatusCounts}
          tooltip="Delivery status across all client roadmaps."
        />
        <StatusCard
          title="Pilot Stage"
          items={pilotStageCounts}
          tooltip="Pilot funnel across your cohorts."
        />
      </section>

      {/* Bottom row: quick actions */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Quick actions */}
        <div className="border border-slate-800 rounded-2xl bg-slate-950/60 p-4 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Quick Actions
            </h2>
            <p className="text-xs text-slate-400">
              Jump straight into the next best move.
            </p>
          </div>

          <div className="space-y-2">
            <QuickAction
              title="Review new lead requests"
              description="Scan and qualify inbound firms from the landing page."
              onClick={() => setLocation('/superadmin/leads')}
            />
            <QuickAction
              title="Review cohort pipeline"
              description="Fine-tune which firms move toward active pilots."
              onClick={() => setLocation('/superadmin/pipeline')}
            />
            <QuickAction
              title="Browse firms directory"
              description="See all enrolled firms across cohorts in one table."
              onClick={() => setLocation('/superadmin/firms')}
            />
            <QuickAction
              title="Tap into client agents"
              description="Enter Tap-In mode to query a firm's AI Agent as their team."
              onClick={() => setLocation('/superadmin/agent')}
            />
          </div>
        </div>

        {/* Cohorts Overview */}
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
                .map((cohort) => (
                  <div
                    key={cohort.cohortLabel}
                    className="flex items-center justify-between py-2 text-xs border-b border-slate-800 last:border-0"
                  >
                    <div>
                      <div className="font-medium text-slate-100">
                        {cohort.cohortLabel}
                      </div>
                      <div className="text-slate-500">
                        {cohort.count} firm{cohort.count !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLocation('/superadmin/pipeline')}
                      className="text-xs px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-100"
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
  );
}

function MetricPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-slate-800 rounded-xl px-4 py-2.5 bg-slate-950/80">
      <div className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">
        {label}
      </div>
      <div className="text-2xl font-semibold text-slate-50 mt-1">
        {value}
      </div>
    </div>
  );
}

function StatusCard({
  title,
  items,
  tooltip,
}: {
  title: string;
  items: Record<string, number>;
  tooltip?: string;
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
        <div className="text-xs text-slate-500 py-3">No data yet.</div>
      ) : (
        <dl className="space-y-1.5 text-xs">
          {entries.map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <dt className="text-slate-400 capitalize">{key}</dt>
              <dd className="text-slate-100 font-medium">{value}</dd>
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
}: {
  title: string;
  description: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left border border-slate-800 rounded-xl px-3.5 py-2.5 bg-slate-950/70 hover:bg-slate-900 transition-colors"
    >
      <div className="text-xs font-semibold text-slate-100">{title}</div>
      <div className="text-[11px] text-slate-400 mt-0.5">{description}</div>
    </button>
  );
}

