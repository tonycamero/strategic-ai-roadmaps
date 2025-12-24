import { SuperAdminFirmRow } from '../types';
import { OrgChart } from './OrgChart';
import type { FirmDetailResponse } from '../api';

type StatusColumn =
  | 'prospect'
  | 'engaged'
  | 'qualified'
  | 'pilot_candidate'
  | 'pilot_active'
  | 'no_fit';

const STATUS_CONFIG: Record<
  StatusColumn,
  { label: string; color: string }
> = {
  prospect: { label: 'Prospect', color: 'bg-slate-700' },
  engaged: { label: 'Engaged', color: 'bg-blue-700' },
  qualified: { label: 'Qualified', color: 'bg-green-700' },
  pilot_candidate: { label: 'Pilot Candidate', color: 'bg-yellow-700' },
  pilot_active: { label: 'Pilot Active', color: 'bg-purple-700' },
  no_fit: { label: 'No Fit', color: 'bg-red-700' },
};

interface CohortFirmModalProps {
  firm: SuperAdminFirmRow;
  orgChartData: { owner: any; teamMembers: any[] } | null;
  detail: FirmDetailResponse | null;
  onClose: () => void;
  onStatusChange: (newStatus: StatusColumn) => void;
}

export function CohortFirmModal({
  firm,
  orgChartData,
  detail,
  onClose,
  onStatusChange,
}: CohortFirmModalProps) {
  const tenant = detail?.tenantSummary;
  const onboarding = detail?.onboardingSummary;
  const activity = detail?.activitySummary;
  const roadmapStats = detail?.roadmapStats;
  const documents = detail?.documentSummary ?? {};

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-slate-100">
                {firm.name}
              </h2>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white ${STATUS_CONFIG[firm.status as StatusColumn]?.color || 'bg-slate-700'}`}>
                {STATUS_CONFIG[firm.status as StatusColumn]?.label || firm.status}
              </span>
              {tenant?.businessType === 'chamber' && (
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-900/40 text-blue-200 border border-blue-700">
                  Chamber Edition
                </span>
              )}
            </div>
            <div className="mt-2 flex gap-3 text-xs text-slate-400">
              <span><span className="font-medium text-slate-300">Cohort:</span> {tenant?.cohortLabel || firm.cohortLabel || 'Unassigned'}</span>
              {(tenant?.segment || firm.segment) && (
                <span><span className="font-medium text-slate-300">Segment:</span> {tenant?.segment || firm.segment}</span>
              )}
              {(tenant?.region || firm.region) && (
                <span><span className="font-medium text-slate-300">Region:</span> {tenant?.region || firm.region}</span>
              )}
              <span><span className="font-medium text-slate-300">Owner:</span> {detail?.owner?.name || firm.ownerEmail}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-2xl leading-none ml-4"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Top row: Overview + Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Firm Overview */}
            <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/60">
              <div className="text-xs font-semibold text-slate-400 mb-3">
                Firm Overview
              </div>
              <dl className="text-xs text-slate-300 space-y-2">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Business Type</dt>
                  <dd className="text-right">
                    {tenant?.businessType === 'chamber' ? 'Chamber of Commerce' : 'Professional Services'}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Firm Size</dt>
                  <dd className="text-right capitalize">
                    {tenant?.firmSizeTier || '—'}
                    {tenant?.teamHeadcount ? ` • ${tenant.teamHeadcount} staff` : ''}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Baseline Leads / Month</dt>
                  <dd className="text-right">{tenant?.baselineMonthlyLeads ?? '—'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Onboarded</dt>
                  <dd className="text-right">
                    {tenant?.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : '—'}
                  </dd>
                </div>
              </dl>
              {tenant?.notes && (
                <div className="mt-3 text-xs text-slate-400 border-t border-slate-800 pt-3">
                  <div className="font-medium text-slate-300 mb-1">Internal Notes</div>
                  <p className="line-clamp-3">{tenant.notes}</p>
                </div>
              )}
            </div>

            {/* Activity & Progress */}
            <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/60">
              <div className="text-xs font-semibold text-slate-400 mb-3">
                Activity & Progress
              </div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-slate-400">Onboarding Progress</div>
                {onboarding ? (
                  <div className="text-sm font-semibold text-slate-100">
                    {onboarding.percentComplete}% complete
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">Not started</div>
                )}
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-300">
                <div>
                  <dt className="text-slate-500">Intakes Completed</dt>
                  <dd className="font-medium">{activity?.intakeCompleted ?? 0}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Roadmaps Delivered</dt>
                  <dd className="font-medium">{activity?.roadmapDelivered ?? 0}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Roadmaps (Total)</dt>
                  <dd className="font-medium">{roadmapStats?.total ?? 0}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Last Activity</dt>
                  <dd className="font-medium">
                    {activity?.lastActivityAt
                      ? new Date(activity.lastActivityAt).toLocaleDateString()
                      : '—'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Documents Summary */}
          <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/60">
            <div className="text-xs font-semibold text-slate-400 mb-3">
              Documents
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">SOP Outputs</span>
                <span className="font-medium">{documents['sop_output'] ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Roadmaps</span>
                <span className="font-medium">{documents['roadmap'] ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reports</span>
                <span className="font-medium">{documents['report'] ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Org Chart */}
          {orgChartData && (
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-3">
                Organization
              </div>
              <div className="border border-slate-800 rounded-lg p-4 bg-slate-950/30">
                <OrgChart
                  owner={orgChartData.owner}
                  teamMembers={orgChartData.teamMembers}
                />
              </div>
            </div>
          )}

          {/* Status Change */}
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400 font-medium block mb-2">
              Pipeline Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(STATUS_CONFIG) as StatusColumn[]).map((status) => (
                <button
                  key={status}
                  onClick={() => onStatusChange(status)}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    firm.status === status
                      ? `${STATUS_CONFIG[status].color} text-white border-white/30`
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="text-sm font-medium">
                    {STATUS_CONFIG[status].label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
