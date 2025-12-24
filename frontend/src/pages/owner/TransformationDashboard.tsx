import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'wouter';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MetricSnapshot {
  id: string;
  label: string;
  metrics: {
    lead_response_minutes: number | null;
    lead_to_appt_rate: number | null;
    close_rate: number | null;
    crm_adoption_rate: number | null;
    weekly_ops_hours: number | null;
    nps: number | null;
  };
  snapshotDate: string;
}

interface TransformationData {
  tenant: { id: string; name: string };
  roadmap: { id: string };
  hasMetrics: boolean;
  message?: string;
  outcome?: {
    id: string;
    netRoiPercent: number | null;
    timeSavingsHours: number | null;
    timeSavingsValue: number | null;
    revenueImpact: number | null;
    costAvoidance: number | null;
    createdAt: string;
  };
  snapshots?: {
    baseline: MetricSnapshot | null;
    at30d: MetricSnapshot | null;
    at60d: MetricSnapshot | null;
    at90d: MetricSnapshot | null;
  };
  timeSeries?: Array<{
    day: number;
    label: string;
    snapshot: MetricSnapshot;
  }>;
}

async function fetchTransformationData(): Promise<TransformationData> {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/dashboard/owner/transformation', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch transformation data');
  }
  return response.json();
}

export default function TransformationDashboard() {
  const { logout } = useAuth();
  const [, setLocation] = useLocation();

  const { data, isLoading, error } = useQuery<TransformationData>({
    queryKey: ['transformation-metrics'],
    queryFn: fetchTransformationData,
    refetchInterval: 30000,
  });

  const handleLogout = () => {
    logout();
    setLocation('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-slate-400">Loading transformation metrics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-red-400">Failed to load transformation metrics</div>
      </div>
    );
  }

  if (!data?.hasMetrics) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        {/* Header */}
        <div className="bg-slate-900 border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-100">Transformation Dashboard</h1>
              <p className="text-sm text-slate-400 mt-1">{data?.tenant?.name || 'Your Company'}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLocation('/dashboard')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors"
              >
                Back to Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-semibold text-slate-200 mb-2">No Metrics Data Yet</h2>
          <p className="text-slate-400 max-w-md mx-auto">
            {data?.message || 'Metrics will appear here once baseline and progress snapshots are recorded.'}
          </p>
        </div>
      </div>
    );
  }

  // Calculate deltas
  const { snapshots, outcome } = data;
  const baseline = snapshots?.baseline;
  const latest = snapshots?.at90d || snapshots?.at60d || snapshots?.at30d;

  const calculateDelta = (baselineVal: number | null, currentVal: number | null, inverted = false) => {
    if (baselineVal === null || currentVal === null) return null;
    const delta = currentVal - baselineVal;
    const isPositive = inverted ? delta < 0 : delta > 0;
    return { delta, isPositive };
  };

  const leadResponseDelta = calculateDelta(baseline?.metrics?.lead_response_minutes ?? null, latest?.metrics?.lead_response_minutes ?? null, true);
  console.log('Lead Response Debug:', {
    baseline: baseline?.metrics?.lead_response_minutes,
    latest: latest?.metrics?.lead_response_minutes,
    delta: leadResponseDelta
  });
  const leadToApptDelta = calculateDelta(baseline?.metrics?.lead_to_appt_rate ?? null, latest?.metrics?.lead_to_appt_rate ?? null);
  const closeDelta = calculateDelta(baseline?.metrics?.close_rate ?? null, latest?.metrics?.close_rate ?? null);
  const crmDelta = calculateDelta(baseline?.metrics?.crm_adoption_rate ?? null, latest?.metrics?.crm_adoption_rate ?? null);
  const opsHoursDelta = calculateDelta(baseline?.metrics?.weekly_ops_hours ?? null, latest?.metrics?.weekly_ops_hours ?? null, true);

  // Prepare chart data
  const chartData = (data.timeSeries || []).map(ts => ({
    day: ts.day,
    label: ts.label,
    'Lead Response (min)': ts.snapshot.metrics?.lead_response_minutes,
    'Lead→Appt (%)': ts.snapshot.metrics?.lead_to_appt_rate,
    'Close Rate (%)': ts.snapshot.metrics?.close_rate,
    'CRM Adoption (%)': ts.snapshot.metrics?.crm_adoption_rate,
    'Ops Hours (weekly)': ts.snapshot.metrics?.weekly_ops_hours,
    'NPS': ts.snapshot.metrics?.nps,
  }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-100">Transformation Dashboard</h1>
            <p className="text-sm text-slate-400 mt-1">{data.tenant.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation('/dashboard')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ROI Summary Block */}
        <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-blue-800 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-blue-100">Total ROI Impact</h2>
              <p className="text-sm text-blue-200/70 mt-1">Based on {latest?.label} metrics snapshot</p>
            </div>
            <div className="text-5xl font-bold text-blue-100">
              {outcome?.netRoiPercent !== null && outcome?.netRoiPercent !== undefined
                ? `${outcome.netRoiPercent.toFixed(0)}%`
                : 'N/A'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">Time Savings Value</div>
              <div className="text-2xl font-bold text-green-400">
                ${outcome?.timeSavingsValue?.toLocaleString() || '0'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {outcome?.timeSavingsHours?.toFixed(0) || '0'} hours saved
              </div>
            </div>

            <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">Revenue Impact</div>
              <div className="text-2xl font-bold text-blue-400">
                ${outcome?.revenueImpact?.toLocaleString() || '0'}
              </div>
              <div className="text-xs text-slate-400 mt-1">From improved close rate</div>
            </div>

            <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">Cost Avoidance</div>
              <div className="text-2xl font-bold text-purple-400">
                ${outcome?.costAvoidance?.toLocaleString() || '0'}
              </div>
              <div className="text-xs text-slate-400 mt-1">From efficiency gains</div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {/* Lead Response Time */}
          <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-4">
            <div className="text-xs font-medium text-slate-400 mb-2">Lead Response Time</div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-slate-100">
                {latest?.metrics?.lead_response_minutes?.toFixed(0) ?? 'N/A'}
              </div>
              <div className="text-xs text-slate-400">min</div>
            </div>
            {leadResponseDelta && (
              <div className={`text-sm font-medium mt-1 ${leadResponseDelta.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {leadResponseDelta.isPositive ? '↑' : '↓'} {Math.abs(leadResponseDelta.delta).toFixed(0)} min faster
              </div>
            )}
          </div>

          {/* Lead to Appt Rate */}
          <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-4">
            <div className="text-xs font-medium text-slate-400 mb-2">Lead → Appt Rate</div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-slate-100">
                {latest?.metrics?.lead_to_appt_rate?.toFixed(0) ?? 'N/A'}
              </div>
              <div className="text-xs text-slate-400">%</div>
            </div>
            {leadToApptDelta && (
              <div className={`text-sm font-medium mt-1 ${leadToApptDelta.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {leadToApptDelta.isPositive ? '↑' : '↓'} {Math.abs(leadToApptDelta.delta).toFixed(0)}%
              </div>
            )}
          </div>

          {/* Close Rate */}
          <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-4">
            <div className="text-xs font-medium text-slate-400 mb-2">Close Rate</div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-slate-100">
                {latest?.metrics?.close_rate?.toFixed(0) ?? 'N/A'}
              </div>
              <div className="text-xs text-slate-400">%</div>
            </div>
            {closeDelta && (
              <div className={`text-sm font-medium mt-1 ${closeDelta.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {closeDelta.isPositive ? '↑' : '↓'} {Math.abs(closeDelta.delta).toFixed(0)}%
              </div>
            )}
          </div>

          {/* CRM Adoption */}
          <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-4">
            <div className="text-xs font-medium text-slate-400 mb-2">CRM Adoption</div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-slate-100">
                {latest?.metrics?.crm_adoption_rate?.toFixed(0) ?? 'N/A'}
              </div>
              <div className="text-xs text-slate-400">%</div>
            </div>
            {crmDelta && (
              <div className={`text-sm font-medium mt-1 ${crmDelta.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {crmDelta.isPositive ? '↑' : '↓'} {Math.abs(crmDelta.delta).toFixed(0)}%
              </div>
            )}
          </div>

          {/* Weekly Ops Hours */}
          <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-4">
            <div className="text-xs font-medium text-slate-400 mb-2">Weekly Ops Hours</div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-slate-100">
                {latest?.metrics?.weekly_ops_hours?.toFixed(0) ?? 'N/A'}
              </div>
              <div className="text-xs text-slate-400">hrs</div>
            </div>
            {opsHoursDelta && (
              <div className={`text-sm font-medium mt-1 ${opsHoursDelta.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {opsHoursDelta.isPositive ? '↑' : '↓'} {Math.abs(opsHoursDelta.delta).toFixed(0)} hrs saved
              </div>
            )}
          </div>
        </div>

        {/* Trend Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Sales Metrics Chart */}
          <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-slate-200 mb-4">Sales Performance</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="label" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                <Line type="monotone" dataKey="Lead→Appt (%)" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="Close Rate (%)" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Operations Metrics Chart */}
          <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-slate-200 mb-4">Operations Efficiency</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="label" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                <Line type="monotone" dataKey="Lead Response (min)" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="Ops Hours (weekly)" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Adoption & Satisfaction Chart */}
          <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-slate-200 mb-4">Adoption & Customer Satisfaction</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="label" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                <Line type="monotone" dataKey="CRM Adoption (%)" stroke="#8b5cf6" strokeWidth={2} />
                <Line type="monotone" dataKey="NPS" stroke="#06b6d4" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Coaching Insights */}
        <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">💡</span>
            <h3 className="text-lg font-semibold text-slate-200">AI Performance Insights</h3>
          </div>
          <div className="space-y-3 text-sm text-slate-300">
            {leadResponseDelta && leadResponseDelta.isPositive && (
              <p>
                ✓ <span className="font-medium text-green-400">Strong progress</span> on lead response time — down {Math.abs(leadResponseDelta.delta).toFixed(0)} minutes. Keep leveraging automation.
              </p>
            )}
            {leadToApptDelta && leadToApptDelta.isPositive && (
              <p>
                ✓ <span className="font-medium text-green-400">Excellent improvement</span> in lead-to-appointment conversion — up {Math.abs(leadToApptDelta.delta).toFixed(0)}%. This directly impacts pipeline quality.
              </p>
            )}
            {closeDelta && closeDelta.isPositive && (
              <p>
                ✓ <span className="font-medium text-green-400">Revenue acceleration</span> detected — close rate improved by {Math.abs(closeDelta.delta).toFixed(0)}%. High-value indicator.
              </p>
            )}
            {crmDelta && crmDelta.isPositive && (
              <p>
                ✓ <span className="font-medium text-green-400">Team adoption</span> is trending up — CRM usage increased by {Math.abs(crmDelta.delta).toFixed(0)}%. Consistency matters.
              </p>
            )}
            {opsHoursDelta && opsHoursDelta.isPositive && (
              <p>
                ✓ <span className="font-medium text-green-400">Time reclaimed</span> — weekly ops hours reduced by {Math.abs(opsHoursDelta.delta).toFixed(0)}. Reinvest in growth activities.
              </p>
            )}
            {(!leadResponseDelta?.isPositive && !leadToApptDelta?.isPositive && !closeDelta?.isPositive) && (
              <p className="text-slate-400">
                Continue tracking progress. Insights will appear as metrics improve across baseline.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
