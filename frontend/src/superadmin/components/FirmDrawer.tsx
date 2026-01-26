import { ReactNode } from 'react';
import { FirmDetailResponseV2 } from '../api';
import { X } from 'lucide-react';

interface FirmDrawerProps {
  open: boolean;
  onClose: () => void;
  detail: FirmDetailResponseV2 | null;
  loading?: boolean;
  onStatusChange?: (
    tenantId: string,
    newStatus: FirmDetailResponseV2['tenant']['status']
  ) => void;
}

export function FirmDrawer({ open, onClose, detail, loading, onStatusChange }: FirmDrawerProps) {
  if (!open) return null;

  const statusOptions: FirmDetailResponseV2['tenant']['status'][] = [
    'prospect',
    'engaged',
    'qualified',
    'pilot_candidate',
    'pilot_active',
    'no_fit',
  ];

  // Loading state
  if (loading || !detail) {
    return (
      <div className="fixed inset-0 z-40 flex justify-end bg-black/40">
        <div className="h-full w-full max-w-5xl bg-slate-950 border-l border-slate-800 shadow-2xl flex items-center justify-center">
          <div className="text-slate-400">Loading firm details...</div>
        </div>
      </div>
    );
  }

  const { tenant, owner, onboarding, engagementSummary, intakes, discovery, diagnostics, roadmaps, tickets, documents, agents, outcomes } = detail;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="h-full w-full max-w-5xl bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-50">{tenant.name}</h2>
              {tenant.businessType === 'chamber' && (
                <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-300 border border-emerald-700/60">
                  Chamber
                </span>
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                {tenant.status.replace('_', ' ')}
              </span>
              {tenant.cohortLabel && (
                <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700">
                  Cohort: {tenant.cohortLabel}
                </span>
              )}
              {tenant.region && (
                <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700">
                  Region: {tenant.region}
                </span>
              )}
              {tenant.firmSizeTier && (
                <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700">
                  Size: {tenant.firmSizeTier}
                </span>
              )}
            </div>

            {owner && (
              <div className="mt-2 text-xs text-slate-500">
                Owner: <span className="text-slate-300">{owner.name}</span>{' '}
                <span className="text-slate-500">({owner.email})</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {onStatusChange && (
              <select
                className="text-xs bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-slate-100"
                value={tenant.status}
                onChange={(e) => onStatusChange(tenant.id, e.target.value as FirmDetailResponseV2['tenant']['status'])}
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content - 3 Column Layout */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

            {/* Column 1: Profile & Pipeline */}
            <div className="md:col-span-4 space-y-4">
              <SectionCard title="Firm Profile">
                {/* TODO: Populate with tenant data */}
                <p className="text-xs text-slate-400">Business Type: {tenant.businessType}</p>
                <p className="text-xs text-slate-400">Team Headcount: {tenant.teamHeadcount ?? '—'}</p>
              </SectionCard>

              <SectionCard title="Onboarding Progress">
                {onboarding ? (
                  <div className="space-y-2">
                    <div className="text-3xl font-semibold text-slate-50">{onboarding.percentComplete}%</div>
                    <div className="text-xs text-slate-400">
                      {onboarding.totalPoints} / {onboarding.maxPoints} pts
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No onboarding data</p>
                )}
              </SectionCard>

              <SectionCard title="Engagement (Last 30d)">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-slate-500">Intakes</p>
                    <p className="text-slate-100">{engagementSummary.last30d.intakeCompleted}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Roadmaps</p>
                    <p className="text-slate-100">{engagementSummary.last30d.roadmapsDelivered}</p>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Column 2: Roadmap Lifecycle */}
            <div className="md:col-span-4 space-y-4">
              <SectionCard title="Intake Status">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {(['owner', 'sales', 'ops', 'delivery'] as const).map((role) => {
                    const entry = intakes.byRole[role];
                    const status = entry?.status ?? 'not_started';
                    const label = role.charAt(0).toUpperCase() + role.slice(1);

                    const color = status === 'completed'
                      ? 'bg-emerald-900/40 text-emerald-200 border-emerald-600/60'
                      : status === 'in_progress'
                        ? 'bg-amber-900/30 text-amber-200 border-amber-600/60'
                        : 'bg-slate-900 text-slate-400 border-slate-700';

                    return (
                      <div key={role} className={`border rounded-lg px-2 py-1.5 ${color}`}>
                        <p className="font-medium">{label}</p>
                        <p className="text-[10px] capitalize">{status.replace('_', ' ')}</p>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>

              <SectionCard title="Discovery">
                {discovery.hasDiscoveryNotes ? (
                  <p className="text-xs text-slate-300">{discovery.summarySnippet}</p>
                ) : (
                  <p className="text-xs text-slate-500">No discovery notes yet</p>
                )}
              </SectionCard>

              <SectionCard title="Diagnostic & Roadmaps">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Diagnostics</span>
                    <span className="text-slate-100">{diagnostics.sopOutputs.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Roadmaps</span>
                    <span className="text-slate-100">{roadmaps.total}</span>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Column 3: Execution & ROI */}
            <div className="md:col-span-4 space-y-4">
              <SectionCard title="Implementation Tickets">
                {tickets.hasTicketPack && tickets.ticketPack ? (
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total</span>
                      <span className="text-slate-100">{tickets.ticketPack.totalTickets}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Done</span>
                      <span className="text-emerald-300">{tickets.ticketPack.totalsByStatus.done}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No ticket pack yet</p>
                )}
              </SectionCard>

              <SectionCard title="ROI Snapshot">
                {outcomes?.realizedRoi ? (
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Net ROI</span>
                      <span className="text-emerald-300">
                        {outcomes.realizedRoi.net_roi_percent?.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No ROI data yet</p>
                )}
              </SectionCard>

              <SectionCard title="Assets & Agents">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Documents</span>
                    <span className="text-slate-100">
                      {Object.values(documents.totalsByCategory).reduce((a, b) => a + b, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Active Agents</span>
                    <span className="text-slate-100">{agents.activeConfigs}</span>
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for section cards
function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border border-slate-800 rounded-xl p-4 bg-slate-950/60">
      <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-3">
        {title}
      </h3>
      {children}
    </section>
  );
}
