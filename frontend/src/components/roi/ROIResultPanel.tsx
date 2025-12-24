interface ROIResultPanelProps {
  outcome: {
    netRoiPercent: number | null;
    timeSavingsHours: number | null;
    timeSavingsValue: number | null;
    revenueImpact: number | null;
    costAvoidance: number | null;
  };
  onRecalculate: () => void;
}

export function ROIResultPanel({ outcome, onRecalculate }: ROIResultPanelProps) {
  const netRoi = outcome.netRoiPercent || 0;
  const timeSavings = outcome.timeSavingsValue || 0;
  const revenue = outcome.revenueImpact || 0;
  const costAvoidance = outcome.costAvoidance || 0;
  const totalImpact = timeSavings + revenue + costAvoidance;
  
  // Estimate payback period (assume $50k investment baseline)
  const assumedInvestment = 50000;
  const paybackMonths = totalImpact > 0 ? Math.ceil((assumedInvestment / totalImpact) * 12) : 0;

  // ROI status color
  const getRoiColor = () => {
    if (netRoi >= 100) return 'text-green-400';
    if (netRoi >= 50) return 'text-blue-400';
    return 'text-yellow-400';
  };

  return (
    <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-xl border border-purple-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-purple-100">
            Your ROI Projection
          </h2>
          <p className="text-sm text-purple-200/70 mt-1">
            Based on your business numbers
          </p>
        </div>
        <span className="text-3xl">💰</span>
      </div>

      {/* Net ROI */}
      <div className="bg-slate-900/60 rounded-lg p-6 mb-4 text-center">
        <div className="text-sm text-slate-400 mb-2">Net ROI (Annual)</div>
        <div className={`text-5xl font-bold ${getRoiColor()}`}>
          {netRoi.toFixed(0)}%
        </div>
        <div className="text-xs text-slate-400 mt-2">
          {netRoi >= 100 ? 'Exceptional' : netRoi >= 50 ? 'Strong' : 'Positive'} Return
        </div>
      </div>

      {/* Impact Breakdown */}
      <div className="grid grid-cols-1 gap-3 mb-4">
        {/* Time Savings */}
        <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Time Savings Value</div>
              <div className="text-xl font-bold text-green-400">
                ${timeSavings.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {outcome.timeSavingsHours?.toFixed(0)} hours/year
              </div>
            </div>
            <span className="text-2xl">⏱️</span>
          </div>
        </div>

        {/* Revenue Impact */}
        <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Revenue Impact</div>
              <div className="text-xl font-bold text-blue-400">
                ${revenue.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                From improved close rate
              </div>
            </div>
            <span className="text-2xl">📈</span>
          </div>
        </div>

        {/* Cost Avoidance */}
        <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Cost Avoidance</div>
              <div className="text-xl font-bold text-purple-400">
                ${costAvoidance.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                From efficiency gains
              </div>
            </div>
            <span className="text-2xl">💎</span>
          </div>
        </div>
      </div>

      {/* Payback Period */}
      {paybackMonths > 0 && (
        <div className="bg-slate-900/60 rounded-lg p-4 mb-4 border border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Estimated Payback Period</div>
              <div className="text-lg font-bold text-slate-100">
                {paybackMonths} {paybackMonths === 1 ? 'month' : 'months'}
              </div>
            </div>
            <span className="text-2xl">⏳</span>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4 mb-4">
        <p className="text-xs text-blue-200 leading-relaxed">
          These projections are based on industry benchmarks and your provided business metrics. 
          Actual results will vary based on implementation and adoption.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onRecalculate}
          className="flex-1 px-4 py-2 border border-purple-700 text-purple-300 hover:bg-purple-900/40 rounded-lg transition-colors text-sm font-medium"
        >
          Recalculate
        </button>
        <button
          onClick={() => window.location.href = '/owner/transformation'}
          className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          View Full Dashboard
        </button>
      </div>
    </div>
  );
}
