import { useLocation } from 'wouter';
import { TrendingUp, Target, Lightbulb } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface TransformationData {
  hasMetrics: boolean;
  outcome?: {
    id: string;
    netRoiPercent: number | null;
    timeSavingsHours: number | null;
    timeSavingsValue: number | null;
    revenueImpact: number | null;
    costAvoidance: number | null;
  };
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

export function InsightsSidebar() {
  const [, setLocation] = useLocation();
  
  const { data: transformationData } = useQuery<TransformationData>({
    queryKey: ['transformation-metrics'],
    queryFn: fetchTransformationData,
    refetchInterval: 30000,
  });
  
  // Calculate monthly values from annual
  const timeSavingsMonthly = transformationData?.outcome?.timeSavingsValue 
    ? Math.round(transformationData.outcome.timeSavingsValue / 12)
    : 0;
  
  const revenueImpactMonthly = transformationData?.outcome?.revenueImpact
    ? Math.round(transformationData.outcome.revenueImpact / 12)
    : 0;
  
  // Calculate engagement score based on metrics (simplified)
  const engagementScore = transformationData?.outcome?.netRoiPercent
    ? Math.min(100, Math.round(transformationData.outcome.netRoiPercent / 10))
    : 0;
  
  const hasData = transformationData?.hasMetrics && transformationData?.outcome;

  return (
    <aside className="w-80 space-y-6">
      {/* ROI Snapshot - Primary visual hierarchy */}
      <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-400">ROI Snapshot</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <div className="text-xs text-slate-400 mb-1">Time Saved</div>
            <div className="text-2xl font-bold text-white">
              {hasData ? (
                timeSavingsMonthly > 0 ? `$${timeSavingsMonthly.toLocaleString()}/mo` : '$0/mo'
              ) : (
                <span className="text-slate-500">--</span>
              )}
            </div>
          </div>
          
          <div>
            <div className="text-xs text-slate-400 mb-1">Revenue Lift</div>
            <div className="text-2xl font-bold text-white">
              {hasData ? (
                revenueImpactMonthly > 0 
                  ? `$${(revenueImpactMonthly / 1000).toFixed(1)}K/mo` 
                  : '$0/mo'
              ) : (
                <span className="text-slate-500">--</span>
              )}
            </div>
          </div>
          
          <div>
            <div className="text-xs text-slate-400 mb-1">Engagement Score</div>
            <div className="text-2xl font-bold text-white">
              {hasData ? engagementScore : <span className="text-slate-500">--</span>}
            </div>
          </div>
        </div>

        <button
          onClick={() => setLocation('/owner/transformation')}
          className="w-full mt-5 px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-sm font-medium rounded-lg transition-colors border border-emerald-500/30"
        >
          View Full Dashboard
        </button>
      </div>

      {/* This Week's Focus - Secondary hierarchy */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-4 w-4 text-blue-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">This Week's Focus</h3>
        </div>
        
        <ul className="space-y-2.5 mb-4">
          <li className="flex items-start gap-2 text-sm">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
            <span className="text-slate-200">Schedule roadmap call</span>
          </li>
          <li className="flex items-start gap-2 text-sm">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
            <span className="text-slate-200">Review findings</span>
          </li>
          <li className="flex items-start gap-2 text-sm">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
            <span className="text-slate-200">Identify pilot workflows</span>
          </li>
        </ul>

        <button
          onClick={() => setLocation('/roadmap')}
          className="w-full px-4 py-2.5 bg-slate-700/80 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-md transition-colors"
        >
          Open Weekly Plan
        </button>
      </div>

      {/* Need Support - Tertiary hierarchy */}
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-4 w-4 text-amber-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Need Support?</h3>
        </div>
        
        <p className="text-xs text-slate-400 mb-3">
          Schedule a call or send us a message
        </p>

        <div className="flex gap-2">
          <button
            onClick={() => window.location.href = 'mailto:tony@scend.cash?subject=Schedule Discovery Call'}
            className="flex-1 px-3 py-2.5 bg-blue-500/90 hover:bg-blue-500 text-white text-xs font-medium rounded-md transition-colors"
          >
            Schedule Call
          </button>
          <button
            onClick={() => setLocation('/agents/inbox')}
            className="flex-1 px-3 py-2.5 bg-slate-700/80 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-md transition-colors"
          >
            Agent Inbox
          </button>
        </div>
      </div>
    </aside>
  );
}
