import type { LucideIcon } from 'lucide-react';
import type { UserRole } from '@roadmap/shared';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ActionButtonProps {
  label: string;
  icon?: LucideIcon;
  variant?: ButtonVariant;
  disabled?: boolean;
  requiresRole?: UserRole[];
  userRole?: UserRole;
  onClick: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-sky-600 hover:bg-sky-700 text-white border-sky-500 disabled:bg-slate-700 disabled:border-slate-600 disabled:text-slate-400',
  secondary:
    'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700 disabled:bg-slate-900 disabled:border-slate-800 disabled:text-slate-500',
  danger:
    'bg-red-600 hover:bg-red-700 text-white border-red-500 disabled:bg-slate-700 disabled:border-slate-600 disabled:text-slate-400',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

export function ActionButton({
  label,
  icon: Icon,
  variant = 'primary',
  disabled = false,
  requiresRole,
  userRole,
  onClick,
  className = '',
  size = 'md',
}: ActionButtonProps) {
  // Check if user has required role
  const hasRequiredRole = !requiresRole || !userRole || requiresRole.includes(userRole);
  const isDisabled = disabled || !hasRequiredRole;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`inline-flex items-center gap-2 font-medium rounded-lg border transition ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      title={!hasRequiredRole ? 'You do not have permission to perform this action' : undefined}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {label}
    </button>
  );
}
