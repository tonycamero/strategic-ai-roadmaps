type Status =
  | 'draft'
  | 'live'
  | 'delivered'
  | 'in_progress'
  | 'completed'
  | 'blocked'
  | 'not_started'
  | 'pending'
  | 'active'
  | 'paused';

type BadgeSize = 'sm' | 'md' | 'lg';

interface StatusBadgeProps {
  status: Status;
  size?: BadgeSize;
  className?: string;
}

const statusConfig: Record<
  Status,
  { label: string; color: string }
> = {
  draft: {
    label: 'Draft',
    color: 'bg-slate-700 text-slate-200 border-slate-600',
  },
  live: {
    label: 'Live',
    color: 'bg-emerald-900/40 text-emerald-200 border-emerald-600/60',
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-emerald-900/40 text-emerald-200 border-emerald-600/60',
  },
  in_progress: {
    label: 'In Progress',
    color: 'bg-blue-900/40 text-blue-200 border-blue-600/60',
  },
  completed: {
    label: 'Completed',
    color: 'bg-emerald-900/40 text-emerald-200 border-emerald-600/60',
  },
  blocked: {
    label: 'Blocked',
    color: 'bg-red-900/40 text-red-200 border-red-600/60',
  },
  not_started: {
    label: 'Not Started',
    color: 'bg-slate-700 text-slate-300 border-slate-600',
  },
  pending: {
    label: 'Pending',
    color: 'bg-amber-900/40 text-amber-200 border-amber-600/60',
  },
  active: {
    label: 'Active',
    color: 'bg-emerald-900/40 text-emerald-200 border-emerald-600/60',
  },
  paused: {
    label: 'Paused',
    color: 'bg-slate-700 text-slate-300 border-slate-600',
  },
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-xs px-2 py-1',
  lg: 'text-sm px-3 py-1.5',
};

export function StatusBadge({ status, size = 'md', className = '' }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${config.color} ${sizeClasses[size]} ${className}`}
    >
      {config.label}
    </span>
  );
}
