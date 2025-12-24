import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DailyMetric {
  date: string;
  intakeStarted: number;
  intakeCompleted: number;
  roadmapCreated: number;
  roadmapDelivered: number;
  pilotOpen: number;
  pilotWon: number;
}

interface DailyMetricsData {
  days: number;
  startDate: string;
  endDate: string;
  timeSeries: DailyMetric[];
}

async function fetchDailyMetrics(days: number = 30): Promise<DailyMetricsData> {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/superadmin/metrics/daily-rollup?days=${days}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch daily metrics');
  }
  return response.json();
}

export function DailyMetricsChart() {
  const [data, setData] = useState<DailyMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchDailyMetrics(days)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return (
      <div className="border border-slate-800 rounded-xl p-6">
        <div className="text-slate-400">Loading metrics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-slate-800 rounded-xl p-6">
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  if (!data || data.timeSeries.length === 0) {
    return (
      <div className="border border-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-200 mb-4">30-Day Activity Trends</h3>
        <div className="text-slate-400 text-sm">No metrics data available yet.</div>
      </div>
    );
  }

  // Format dates for display (MM/DD)
  const chartData = data.timeSeries.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    'Intakes Started': d.intakeStarted,
    'Intakes Completed': d.intakeCompleted,
    'Roadmaps Created': d.roadmapCreated,
    'Roadmaps Delivered': d.roadmapDelivered,
    'Pilots Opened': d.pilotOpen,
    'Pilots Won': d.pilotWon,
  }));

  return (
    <div className="border border-slate-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-200">Activity Trends</h3>
          <p className="text-xs text-slate-400 mt-1">
            {data.startDate} to {data.endDate}
          </p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={7}>7 days</option>
          <option value={14}>14 days</option>
          <option value={30}>30 days</option>
          <option value={60}>60 days</option>
          <option value={90}>90 days</option>
        </select>
      </div>

      {/* Intakes & Roadmaps Chart */}
      <div className="mb-8">
        <h4 className="text-sm font-medium text-slate-300 mb-3">Intakes & Roadmaps</h4>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '11px' }} />
            <YAxis stroke="#94a3b8" style={{ fontSize: '11px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#e2e8f0',
                fontSize: '12px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
            <Line type="monotone" dataKey="Intakes Started" stroke="#3b82f6" strokeWidth={2} />
            <Line type="monotone" dataKey="Intakes Completed" stroke="#10b981" strokeWidth={2} />
            <Line type="monotone" dataKey="Roadmaps Created" stroke="#f59e0b" strokeWidth={2} />
            <Line type="monotone" dataKey="Roadmaps Delivered" stroke="#8b5cf6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pilots Chart */}
      <div>
        <h4 className="text-sm font-medium text-slate-300 mb-3">Pilot Activity</h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '11px' }} />
            <YAxis stroke="#94a3b8" style={{ fontSize: '11px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#e2e8f0',
                fontSize: '12px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
            <Line type="monotone" dataKey="Pilots Opened" stroke="#ec4899" strokeWidth={2} />
            <Line type="monotone" dataKey="Pilots Won" stroke="#14b8a6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
