import { useState, useEffect } from 'react';
import { SnapshotInputModal } from './SnapshotInputModal';

interface MetricsSnapshot {
  id: string;
  label: string;
  snapshotDate: string;
  source: string;
  metrics: {
    lead_response_minutes?: number;
    lead_to_appt_rate?: number;
    close_rate?: number;
    crm_adoption_rate?: number;
    weekly_ops_hours?: number;
    nps?: number;
  };
}

interface Outcome {
  deltas: {
    lead_response_minutes?: number;
    lead_to_appt_rate?: number;
    close_rate?: number;
    crm_adoption_rate?: number;
    weekly_ops_hours?: number;
    nps?: number;
  };
  realizedRoi?: {
    time_savings_hours_annual?: number;
    time_savings_value_annual?: number;
    revenue_impact_annual?: number;
    cost_avoidance_annual?: number;
    net_roi_percent?: number;
  };
  status: string;
}

interface MetricsData {
  snapshots: MetricsSnapshot[];
  outcome: Outcome | null;
}

export function MetricsCard({ tenantId }: { tenantId: string }) {
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [computing, setComputing] = useState(false);
  const [snapshotModalOpen, setSnapshotModalOpen] = useState(false);

  useEffect(() => {
    fetchMetrics();
  }, [tenantId]);

  async function fetchMetrics() {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/superadmin/firms/${tenantId}/metrics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch metrics');
      const data = await res.json();
      setData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRecompute() {
    setComputing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/superadmin/firms/${tenantId}/metrics/compute-outcome`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      if (!res.ok) throw new Error('Failed to compute outcome');
      await fetchMetrics();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setComputing(false);
    }
  }

  if (loading) {
    return (
      <div className="border border-slate-800 rounded-xl p-4">
        <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">
          Performance Metrics
        </div>
        <div className="text-slate-500 text-sm">Loading metrics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-slate-800 rounded-xl p-4">
        <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">
          Performance Metrics
        </div>
        <div className="text-red-400 text-sm">Error: {error}</div>
      </div>
    );
  }

  if (!data) return null;

  const { snapshots, outcome } = data;
  const baseline = snapshots.find(s => s.label === 'baseline');
  const snapshot30 = snapshots.find(s => s.label === '30d');
  const snapshot60 = snapshots.find(s => s.label === '60d');
  const snapshot90 = snapshots.find(s => s.label === '90d');

  return (
    <>
      <div className="border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs uppercase tracking-wide text-slate-400">
            Performance Metrics & ROI
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSnapshotModalOpen(true)}
              className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Add Snapshot
            </button>
            <button
              onClick={handleRecompute}
              disabled={computing || !baseline}
              className="px-3 py-1.5 text-xs font-medium bg-slate-700 hover:bg-slate-600 disabled:bg-slate-900 disabled:text-slate-600 text-slate-200 rounded-lg transition-colors"
            >
              {computing ? 'Computing...' : 'Recompute Outcome'}
            </button>
          </div>
        </div>

        {snapshots.length === 0 ? (
          <div className="text-slate-500 text-sm">
            No metrics captured yet. Click "Add Snapshot" to create a baseline.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: Metrics Tables */}
            <div className="lg:col-span-2 space-y-4">
              <div className="border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-900/50">
                    <tr className="border-b border-slate-800">
                      <th className="text-left px-3 py-2 font-medium text-slate-300">Metric</th>
                      <th className="text-right px-3 py-2 font-medium text-slate-300">Baseline</th>
                      <th className="text-right px-3 py-2 font-medium text-slate-300">30d</th>
                      <th className="text-right px-3 py-2 font-medium text-slate-300">60d</th>
                      <th className="text-right px-3 py-2 font-medium text-slate-300">90d</th>
                      <th className="text-right px-3 py-2 font-medium text-slate-300">Δ</th>
                    </tr>
                  </thead>
                  <tbody>
                    <MetricRow
                      label="Lead Response (min)"
                      baseline={baseline?.metrics.lead_response_minutes}
                      d30={snapshot30?.metrics.lead_response_minutes}
                      d60={snapshot60?.metrics.lead_response_minutes}
                      d90={snapshot90?.metrics.lead_response_minutes}
                      delta={outcome?.deltas.lead_response_minutes}
                      inverted={true}
                    />
                    <MetricRow
                      label="Lead→Appt Rate (%)"
                      baseline={baseline?.metrics.lead_to_appt_rate}
                      d30={snapshot30?.metrics.lead_to_appt_rate}
                      d60={snapshot60?.metrics.lead_to_appt_rate}
                      d90={snapshot90?.metrics.lead_to_appt_rate}
                      delta={outcome?.deltas.lead_to_appt_rate}
                    />
                    <MetricRow
                      label="Close Rate (%)"
                      baseline={baseline?.metrics.close_rate}
                      d30={snapshot30?.metrics.close_rate}
                      d60={snapshot60?.metrics.close_rate}
                      d90={snapshot90?.metrics.close_rate}
                      delta={outcome?.deltas.close_rate}
                    />
                    <MetricRow
                      label="CRM Adoption (%)"
                      baseline={baseline?.metrics.crm_adoption_rate}
                      d30={snapshot30?.metrics.crm_adoption_rate}
                      d60={snapshot60?.metrics.crm_adoption_rate}
                      d90={snapshot90?.metrics.crm_adoption_rate}
                      delta={outcome?.deltas.crm_adoption_rate}
                    />
                    <MetricRow
                      label="Weekly Ops Hours"
                      baseline={baseline?.metrics.weekly_ops_hours}
                      d30={snapshot30?.metrics.weekly_ops_hours}
                      d60={snapshot60?.metrics.weekly_ops_hours}
                      d90={snapshot90?.metrics.weekly_ops_hours}
                      delta={outcome?.deltas.weekly_ops_hours}
                      inverted={true}
                    />
                    <MetricRow
                      label="NPS Score"
                      baseline={baseline?.metrics.nps}
                      d30={snapshot30?.metrics.nps}
                      d60={snapshot60?.metrics.nps}
                      d90={snapshot90?.metrics.nps}
                      delta={outcome?.deltas.nps}
                    />
                  </tbody>
                </table>
              </div>

              {/* Timeline Visualization */}
              {baseline && (
                <div className="border border-slate-800 rounded-lg p-4">
                  <div className="text-xs font-medium text-slate-300 mb-3">Timeline</div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`flex-1 text-center py-2 rounded ${baseline ? 'bg-blue-900/30 text-blue-300' : 'bg-slate-900 text-slate-600'}`}>
                      Baseline
                      {baseline && <div className="text-[10px] text-slate-500 mt-1">{new Date(baseline.snapshotDate).toLocaleDateString()}</div>}
                    </div>
                    <div className="text-slate-600">→</div>
                    <div className={`flex-1 text-center py-2 rounded ${snapshot30 ? 'bg-green-900/30 text-green-300' : 'bg-slate-900 text-slate-600'}`}>
                      30 Days
                      {snapshot30 && <div className="text-[10px] text-slate-500 mt-1">{new Date(snapshot30.snapshotDate).toLocaleDateString()}</div>}
                    </div>
                    <div className="text-slate-600">→</div>
                    <div className={`flex-1 text-center py-2 rounded ${snapshot60 ? 'bg-green-900/30 text-green-300' : 'bg-slate-900 text-slate-600'}`}>
                      60 Days
                      {snapshot60 && <div className="text-[10px] text-slate-500 mt-1">{new Date(snapshot60.snapshotDate).toLocaleDateString()}</div>}
                    </div>
                    <div className="text-slate-600">→</div>
                    <div className={`flex-1 text-center py-2 rounded ${snapshot90 ? 'bg-green-900/30 text-green-300' : 'bg-slate-900 text-slate-600'}`}>
                      90 Days
                      {snapshot90 && <div className="text-[10px] text-slate-500 mt-1">{new Date(snapshot90.snapshotDate).toLocaleDateString()}</div>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: ROI Summary */}
            <div className="space-y-4">
              {outcome?.realizedRoi ? (
                <div className="border border-slate-800 rounded-lg p-4">
                  <div className="text-xs font-medium text-slate-300 mb-3">Realized ROI</div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-[11px] text-slate-500">Time Savings</div>
                      <div className="text-sm font-medium text-slate-200">
                        {outcome.realizedRoi.time_savings_hours_annual?.toFixed(0) || 0} hrs/year
                      </div>
                      <div className="text-xs text-slate-400">
                        ${outcome.realizedRoi.time_savings_value_annual?.toLocaleString() || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500">Revenue Impact</div>
                      <div className="text-sm font-medium text-green-400">
                        ${outcome.realizedRoi.revenue_impact_annual?.toLocaleString() || 0}/year
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500">Cost Avoidance</div>
                      <div className="text-sm font-medium text-slate-200">
                        ${outcome.realizedRoi.cost_avoidance_annual?.toLocaleString() || 0}/year
                      </div>
                    </div>
                    <div className="pt-3 border-t border-slate-800">
                      <div className="text-[11px] text-slate-500">Net ROI</div>
                      <div className={`text-2xl font-bold ${(outcome.realizedRoi.net_roi_percent || 0) >= 100 ? 'text-green-400' : (outcome.realizedRoi.net_roi_percent || 0) >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {outcome.realizedRoi.net_roi_percent?.toFixed(0) || 0}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500">Status</div>
                      <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        outcome.status === 'on_track' ? 'bg-green-900/30 text-green-300' :
                        outcome.status === 'at_risk' ? 'bg-yellow-900/30 text-yellow-300' :
                        'bg-red-900/30 text-red-300'
                      }`}>
                        {outcome.status.replace('_', ' ').toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-slate-800 rounded-lg p-4">
                  <div className="text-xs font-medium text-slate-300 mb-2">ROI Analysis</div>
                  <div className="text-xs text-slate-500">
                    {baseline ? 'Click "Recompute Outcome" to calculate ROI' : 'Add baseline snapshot to enable ROI calculations'}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {snapshotModalOpen && (
        <SnapshotInputModal
          tenantId={tenantId}
          onClose={() => setSnapshotModalOpen(false)}
          onSuccess={() => {
            fetchMetrics();
            setSnapshotModalOpen(false);
          }}
        />
      )}
    </>
  );
}

function MetricRow({
  label,
  baseline,
  d30,
  d60,
  d90,
  delta,
  inverted = false
}: {
  label: string;
  baseline?: number;
  d30?: number;
  d60?: number;
  d90?: number;
  delta?: number;
  inverted?: boolean;
}) {
  const formatValue = (val?: number) => val !== undefined ? val.toFixed(1) : '—';
  
  const isPositive = delta !== undefined && delta !== 0 ? (inverted ? delta < 0 : delta > 0) : null;
  const deltaColor = isPositive === null ? 'text-slate-500' : isPositive ? 'text-green-400' : 'text-red-400';
  // For inverted metrics, show up arrow when improving (even though value decreased)
  const deltaArrow = isPositive === null ? '' : isPositive ? '↑' : '↓';

  return (
    <tr className="border-b border-slate-800 last:border-0">
      <td className="px-3 py-2 text-slate-300">{label}</td>
      <td className="px-3 py-2 text-right text-slate-400">{formatValue(baseline)}</td>
      <td className="px-3 py-2 text-right text-slate-400">{formatValue(d30)}</td>
      <td className="px-3 py-2 text-right text-slate-400">{formatValue(d60)}</td>
      <td className="px-3 py-2 text-right text-slate-400">{formatValue(d90)}</td>
      <td className={`px-3 py-2 text-right font-medium ${deltaColor}`}>
        {delta !== undefined ? `${deltaArrow} ${Math.abs(delta).toFixed(1)}` : '—'}
      </td>
    </tr>
  );
}
