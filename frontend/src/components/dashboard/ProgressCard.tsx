import { ArrowRight } from 'lucide-react';

interface ProgressCardProps {
  title: string;
  percent: number;
  nextAction?: {
    label: string;
    onClick: () => void;
  };
  lastActivity?: Date | string;
  onClick?: () => void;
  className?: string;
}

export function ProgressCard({
  title,
  percent,
  nextAction,
  lastActivity,
  onClick,
  className = '',
}: ProgressCardProps) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className={`group border border-slate-800 rounded-xl p-4 bg-slate-950/60 hover:bg-slate-900/40 hover:border-slate-700 transition ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        {/* Circular Progress */}
        <div className="relative flex-shrink-0">
          <svg width="80" height="80" className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              className="text-slate-800"
            />
            {/* Progress circle */}
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="text-sky-500 transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-semibold text-slate-100">{percent}%</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-100 mb-2">{title}</h3>

          {lastActivity && (
            <p className="text-xs text-slate-500 mb-3">
              Last activity: {formatDate(lastActivity)}
            </p>
          )}

          {nextAction && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextAction.onClick();
              }}
              className="inline-flex items-center gap-1 text-sm text-sky-400 hover:text-sky-300 transition"
            >
              {nextAction.label}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
