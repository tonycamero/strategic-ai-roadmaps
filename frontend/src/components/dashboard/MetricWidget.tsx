import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type TrendDirection = 'up' | 'down' | 'flat';

interface MetricWidgetProps {
  label: string;
  value: string | number;
  trend?: string;
  trendDirection?: TrendDirection;
  unit?: string;
  className?: string;
}

export function MetricWidget({
  label,
  value,
  trend,
  trendDirection,
  unit,
  className = '',
}: MetricWidgetProps) {
  const getTrendIcon = () => {
    switch (trendDirection) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-emerald-400" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-400" />;
      case 'flat':
        return <Minus className="h-4 w-4 text-slate-400" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (trendDirection) {
      case 'up':
        return 'text-emerald-400';
      case 'down':
        return 'text-red-400';
      case 'flat':
        return 'text-slate-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div
      className={`border border-slate-800 rounded-xl p-4 bg-slate-950/60 ${className}`}
    >
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm text-slate-400">{label}</p>
        {trendDirection && getTrendIcon()}
      </div>

      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-semibold text-slate-100">
          {value}
          {unit && <span className="text-lg text-slate-400 ml-1">{unit}</span>}
        </p>
      </div>

      {trend && (
        <p className={`text-xs mt-2 ${getTrendColor()}`}>
          {trend}
        </p>
      )}
    </div>
  );
}
