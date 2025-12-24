// frontend/src/components/dashboard/OwnerDashboard.tsx
import React from 'react';
import type { DashboardData } from './types';

type Props = {
  data: DashboardData;
};

export const OwnerDashboard: React.FC<Props> = ({ data }) => {
  const {
    tenantSummary,
    owner,
    teamMembers,
    onboardingSummary,
    activitySummary,
    roadmapStats,
    documentSummary,
    recentActivity,
  } = data;

  const roadmapDeliveredPct =
    roadmapStats.total > 0
      ? Math.round((roadmapStats.delivered / roadmapStats.total) * 100)
      : 0;

  const onboardingPct = onboardingSummary?.percentComplete ?? 0;

  const formatDate = (value?: string | null) => {
    if (!value) return '—';
    const d = new Date(value);
    return d.toLocaleDateString();
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">
            {tenantSummary.name}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-400">
            {tenantSummary.cohortLabel && (
              <span className="inline-flex items-center rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-300">
                Cohort: {tenantSummary.cohortLabel}
              </span>
            )}
            {tenantSummary.segment && (
              <span className="inline-flex items-center rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-300">
                Segment: {tenantSummary.segment}
              </span>
            )}
            {tenantSummary.region && (
              <span className="inline-flex items-center rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-300">
                Region: {tenantSummary.region}
              </span>
            )}
            <span className="inline-flex items-center rounded-full bg-emerald-900/30 px-2 py-0.5 text-xs text-emerald-300 border border-emerald-700/50">
              Status: {tenantSummary.status}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-start md:items-end gap-1 text-sm">
          <div className="font-medium text-slate-200">
            Owner: {owner?.name ?? 'Owner'}
          </div>
          <div className="text-slate-400">
            Joined: {formatDate(owner?.createdAt)}
          </div>
          <div className="text-slate-400">
            Team: {teamMembers.length + 1} members
          </div>
        </div>
      </div>

      {/* TOP ROW: ROADMAP + ASSISTANTS + METRICS */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* ROADMAP PROGRESS CARD */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-200">Roadmap Progress</h2>
            <span className="text-xs text-slate-400">
              {roadmapStats.delivered}/{roadmapStats.total} delivered
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            High-level view of where your Strategic AI Roadmap is in the lifecycle.
          </p>
          <div className="space-y-3">
            {/* Setup */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Setup (Intakes + Diagnostic)</span>
                <span className="text-slate-400">
                  {activitySummary.intakeCompleted} completed
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{
                    width: `${Math.min(
                      100,
                      activitySummary.intakeCompleted > 0 ? 100 : 25
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Roadmap Build */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Roadmap Build</span>
                <span className="text-slate-400">
                  {roadmapStats.total > 0 ? 'In progress / ready' : 'Not started'}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{
                    width: `${roadmapStats.total > 0 ? 70 : 20}%`,
                  }}
                />
              </div>
            </div>

            {/* Implementation */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Implementation</span>
                <span className="text-slate-400">
                  {roadmapDeliveredPct}% delivered
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${roadmapDeliveredPct}%` }}
                />
              </div>
            </div>

            {/* Wins & KPIs */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Wins & KPIs</span>
                <span className="text-slate-400">
                  Snapshots coming from metrics
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{
                    width: `${
                      activitySummary.roadmapDelivered > 0
                        ? 60
                        : activitySummary.roadmapCreated > 0
                        ? 35
                        : 10
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* AI ASSISTANTS CARD */}
        <div className="rounded-xl border bg-slate-900/40 p-4 shadow-sm">
          <h2 className="text-sm font-semibold mb-1">Your AI Assistants</h2>
          <p className="text-xs text-slate-400 mb-3">
            Operator-grade assistants trained on your roadmap, SOPs, and firm context.
          </p>

          <div className="space-y-3">
            {[
              {
                label: 'Owner Assistant',
                desc: 'Strategic partner for decisions, priorities, and delegations.',
              },
              {
                label: 'Ops Assistant',
                desc: 'Helps design and refine workflows, automations, and SOPs.',
              },
              {
                label: 'Sales Assistant',
                desc: 'Optimizes lead handling, follow-up cadence, and pipeline hygiene.',
              },
            ].map((a) => (
              <div
                key={a.label}
                className="rounded-lg border border-slate-700/50 bg-slate-800/40 p-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">{a.label}</span>
                  <span className="text-[10px] rounded-full bg-gray-900 text-white px-2 py-0.5">
                    Full edit mode
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 mb-2">{a.desc}</p>
                <div className="flex gap-2">
                  <button className="inline-flex items-center justify-center rounded-md border border-gray-900 px-2.5 py-1 text-[11px] font-medium">
                    Open Chat
                  </button>
                  <button className="inline-flex items-center justify-center rounded-md border border-gray-200 px-2.5 py-1 text-[11px] text-gray-600">
                    View Tools
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* METRICS CARD */}
        <div className="rounded-xl border bg-slate-900/40 p-4 shadow-sm">
          <h2 className="text-sm font-semibold mb-1">Key Metrics</h2>
          <p className="text-xs text-slate-400 mb-3">
            Early indicators of your roadmap&apos;s impact. These will become real numbers as implementation proceeds.
          </p>

          <dl className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <dt className="text-slate-400">Intakes completed</dt>
              <dd className="font-medium">
                {activitySummary.intakeCompleted}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-400">Roadmaps created</dt>
              <dd className="font-medium">
                {activitySummary.roadmapCreated}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-400">Roadmaps delivered</dt>
              <dd className="font-medium">
                {activitySummary.roadmapDelivered}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-400">Onboarding completion</dt>
              <dd className="font-medium">
                {onboardingPct}%
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-400">Last activity</dt>
              <dd className="font-medium">
                {formatDate(activitySummary.lastActivityAt)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* SECOND ROW: DOCUMENTS + TEAM + ACTIVITY */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* DOCUMENTS */}
        <div className="rounded-xl border bg-slate-900/40 p-4 shadow-sm lg:col-span-1">
          <h2 className="text-sm font-semibold mb-1">Key Documents</h2>
          <p className="text-xs text-slate-400 mb-3">
            Single source of truth for your roadmap and supporting materials.
          </p>

          <ul className="space-y-2 text-xs">
            {Object.keys(documentSummary).length === 0 && (
              <li className="text-gray-400">
                No documents uploaded yet.
              </li>
            )}
            {Object.entries(documentSummary).map(([category, count]) => (
              <li
                key={category}
                className="flex items-center justify-between rounded-md border border-gray-100 px-2.5 py-1.5"
              >
                <span className="capitalize text-gray-600">
                  {category.replace(/_/g, ' ')}
                </span>
                <span className="text-slate-100 font-medium">{count}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* TEAM PARTICIPATION */}
        <div className="rounded-xl border bg-slate-900/40 p-4 shadow-sm lg:col-span-1">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold">Team Participation</h2>
            <button className="text-[11px] text-gray-600 underline-offset-2 hover:underline">
              Invite teammate
            </button>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Who has completed their intake and is contributing to the roadmap.
          </p>

          <ul className="space-y-2 text-xs">
            {owner && (
              <li className="flex items-center justify-between border border-gray-100 rounded-md px-2.5 py-1.5 bg-gray-50">
                <div>
                  <div className="font-medium">{owner.name}</div>
                  <div className="text-[11px] text-slate-400">
                    Owner • {owner.email}
                  </div>
                </div>
                <span className="text-[10px] rounded-full bg-gray-900 text-white px-2 py-0.5">
                  Primary
                </span>
              </li>
            )}
            {teamMembers.map((m) => {
              const hasIntake = data.intakes.some(
                (i) => i.userEmail === m.email && i.completedAt
              );
              return (
                <li
                  key={m.id}
                  className="flex items-center justify-between border border-gray-100 rounded-md px-2.5 py-1.5"
                >
                  <div>
                    <div className="font-medium">{m.name}</div>
                    <div className="text-[11px] text-slate-400">
                      {m.role} • {m.email}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] rounded-full px-2 py-0.5 ${
                      hasIntake
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : 'bg-gray-50 text-slate-400 border border-gray-100'
                    }`}
                  >
                    {hasIntake ? 'Intake complete' : 'Pending intake'}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* RECENT ACTIVITY */}
        <div className="rounded-xl border bg-slate-900/40 p-4 shadow-sm lg:col-span-1">
          <h2 className="text-sm font-semibold mb-1">Recent Activity</h2>
          <p className="text-xs text-slate-400 mb-3">
            System events and key actions taken on your account.
          </p>

          <div className="space-y-2 max-h-64 overflow-y-auto text-xs">
            {recentActivity.length === 0 && (
              <div className="text-gray-400">
                No recent activity yet.
              </div>
            )}
            {recentActivity.map((event) => (
              <div
                key={event.id}
                className="border border-gray-100 rounded-md px-2.5 py-1.5"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-medium text-gray-800">
                    {event.eventType}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {formatDate(event.createdAt)}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {event.actorName} • {event.actorRole ?? 'System'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
