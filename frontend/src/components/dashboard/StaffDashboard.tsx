// frontend/src/components/dashboard/StaffDashboard.tsx
import React from 'react';
import type { DashboardData } from './types';

type Props = {
  data: DashboardData;
};

export const StaffDashboard: React.FC<Props> = ({ data }) => {
  const { tenantSummary, owner, teamMembers, roadmapStats, activitySummary } = data;

  const formatDate = (value?: string | null) => {
    if (!value) return '—';
    const d = new Date(value);
    return d.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* READ-ONLY BANNER */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
        <div className="font-semibold text-[11px] tracking-wide uppercase">
          Read-only / Observer Mode
        </div>
        <p className="mt-1 text-[11px]">
          You can see the firm&apos;s roadmap, context, and metrics so you can execute better in your role.
          Only the firm owner can change systems, automations, or official roadmap content.
        </p>
      </div>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {tenantSummary.name}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-400">
            {tenantSummary.cohortLabel && (
              <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
                Cohort: {tenantSummary.cohortLabel}
              </span>
            )}
            {tenantSummary.segment && (
              <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
                Segment: {tenantSummary.segment}
              </span>
            )}
            <span className="inline-flex items-center rounded-full bg-slate-800/40 px-2 py-0.5 text-xs border border-gray-200">
              Status: {tenantSummary.status}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-start md:items-end gap-1 text-xs text-slate-400">
          <div>Owner: {owner?.name ?? 'Owner'}</div>
          <div>Team size: {teamMembers.length + 1}</div>
          <div>Last activity: {formatDate(activitySummary.lastActivityAt)}</div>
        </div>
      </div>

      {/* TOP: YOUR ASSISTANT + FIRM OVERVIEW */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* ASSISTANT */}
        <div className="rounded-xl border bg-slate-900/40 p-4 shadow-sm md:col-span-1">
          <h2 className="text-sm font-semibold mb-1">
            Your Roadmap Assistant (Observer)
          </h2>
          <p className="text-xs text-slate-400 mb-3">
            Ask questions about the firm&apos;s strategy, roadmap, and how it affects your work.
            You can&apos;t trigger automations — this is guidance-only.
          </p>

          <ul className="space-y-2 text-xs">
            <li className="rounded-md border border-slate-700/50 bg-slate-800/40 px-2.5 py-1.5">
              <div className="font-medium text-slate-100">
                Check a workflow
              </div>
              <div className="text-[11px] text-slate-300">
                &quot;Walk me through how new leads are handled right now.&quot;
              </div>
            </li>
            <li className="rounded-md border border-slate-700/50 bg-slate-800/40 px-2.5 py-1.5">
              <div className="font-medium text-slate-100">
                Explain a roadmap item
              </div>
              <div className="text-[11px] text-slate-300">
                &quot;Explain what &apos;Automated lead routing&apos; means for my day-to-day.&quot;
              </div>
            </li>
            <li className="rounded-md border border-slate-700/50 bg-slate-800/40 px-2.5 py-1.5">
              <div className="font-medium text-slate-100">
                Align on priorities
              </div>
              <div className="text-[11px] text-slate-300">
                &quot;What should I focus on this week to support the roadmap?&quot;
              </div>
            </li>
          </ul>

          <button className="mt-3 inline-flex items-center justify-center rounded-md border border-gray-900 px-3 py-1.5 text-[11px] font-medium">
            Ask a question
          </button>
        </div>

        {/* FIRM OVERVIEW */}
        <div className="rounded-xl border bg-slate-900/40 p-4 shadow-sm md:col-span-2">
          <h2 className="text-sm font-semibold mb-1">Firm Overview</h2>
          <p className="text-xs text-slate-400 mb-3">
            Big-picture context so you understand where the firm is going and how the roadmap supports that.
          </p>

          <div className="grid gap-3 sm:grid-cols-3 text-xs">
            <div className="rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2">
              <div className="text-slate-400 mb-0.5">Roadmap status</div>
              <div className="text-sm font-semibold">
                {roadmapStats.total === 0
                  ? 'Not yet generated'
                  : roadmapStats.delivered > 0
                  ? 'Live / Delivering'
                  : 'In build'}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                You&apos;ll see changes as the owner and our team push the roadmap forward.
              </div>
            </div>

            <div className="rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2">
              <div className="text-slate-400 mb-0.5">Team / Clients Impacted</div>
              <div className="text-sm font-semibold">
                {teamMembers.length + 1} team members
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Your workflows and tools will update over time — this dashboard helps you stay in sync.
              </div>
            </div>

            <div className="rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2">
              <div className="text-slate-400 mb-0.5">Top Priority</div>
              <div className="text-sm font-semibold">
                Operational consistency
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Expect changes to how tasks, leads, or client work is tracked and handed off.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ROADMAP + DOCUMENTS + TEAM DIRECTORY */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* ROADMAP SNAPSHOT */}
        <div className="rounded-xl border bg-slate-900/40 p-4 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold mb-1">Roadmap Snapshot</h2>
          <p className="text-xs text-slate-400 mb-3">
            High-level view of the roadmap so you can see where initiatives come from.
            This is read-only — no editing or triggering.
          </p>

          <div className="grid gap-3 md:grid-cols-3 text-xs">
            <div className="rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2">
              <div className="text-slate-400 mb-0.5">Setup</div>
              <div className="text-sm font-semibold">
                {activitySummary.intakeCompleted > 0
                  ? 'Intakes collected'
                  : 'In progress'}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Owner and key roles fill in intake so the roadmap reflects reality.
              </div>
            </div>

            <div className="rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2">
              <div className="text-slate-400 mb-0.5">Roadmap Build</div>
              <div className="text-sm font-semibold">
                {roadmapStats.total > 0 ? 'Draft created' : 'Coming soon'}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Our team uses the diagnostic and discovery call to assemble a prioritized plan.
              </div>
            </div>

            <div className="rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2">
              <div className="text-slate-400 mb-0.5">Implementation</div>
              <div className="text-sm font-semibold">
                {roadmapStats.delivered > 0 ? 'Rolling out' : 'Not yet started'}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                You&apos;ll see new processes, tools, and automations gradually appear in your work.
              </div>
            </div>
          </div>
        </div>

        {/* TEAM DIRECTORY */}
        <div className="rounded-xl border bg-slate-900/40 p-4 shadow-sm lg:col-span-1">
          <h2 className="text-sm font-semibold mb-1">Team Directory</h2>
          <p className="text-xs text-slate-400 mb-3">
            Who is involved in this roadmap and who to talk to.
          </p>

          <ul className="space-y-2 text-xs max-h-64 overflow-y-auto">
            {owner && (
              <li className="flex items-center justify-between rounded-md border border-slate-700/50 bg-slate-800/40 px-2.5 py-1.5">
                <div>
                  <div className="font-medium">{owner.name}</div>
                  <div className="text-[11px] text-slate-400">
                    Owner • {owner.email}
                  </div>
                </div>
                <span className="text-[10px] rounded-full bg-gray-900 text-white px-2 py-0.5">
                  Primary contact
                </span>
              </li>
            )}
            {teamMembers.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-md border border-slate-700/50 px-2.5 py-1.5"
              >
                <div>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-[11px] text-slate-400">
                    {m.role} • {m.email}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
