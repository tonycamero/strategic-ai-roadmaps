import { X, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';

type AlertType = 'info' | 'warning' | 'error' | 'success';

interface AlertBannerProps {
  type: AlertType;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const alertConfig: Record<
  AlertType,
  { icon: React.ElementType; bgColor: string; borderColor: string; textColor: string; iconColor: string }
> = {
  info: {
    icon: Info,
    bgColor: 'bg-blue-900/20',
    borderColor: 'border-blue-600/40',
    textColor: 'text-blue-100',
    iconColor: 'text-blue-400',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-amber-900/20',
    borderColor: 'border-amber-600/40',
    textColor: 'text-amber-100',
    iconColor: 'text-amber-400',
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-red-900/20',
    borderColor: 'border-red-600/40',
    textColor: 'text-red-100',
    iconColor: 'text-red-400',
  },
  success: {
    icon: CheckCircle,
    bgColor: 'bg-emerald-900/20',
    borderColor: 'border-emerald-600/40',
    textColor: 'text-emerald-100',
    iconColor: 'text-emerald-400',
  },
};

export function AlertBanner({
  type,
  message,
  dismissible = false,
  onDismiss,
  className = '',
}: AlertBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const config = alertConfig[type];
  const Icon = config.icon;

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${config.bgColor} ${config.borderColor} ${className}`}
    >
      <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
      <p className={`flex-1 text-sm ${config.textColor}`}>{message}</p>
      {dismissible && (
        <button
          onClick={handleDismiss}
          className={`flex-shrink-0 ${config.textColor} hover:opacity-70 transition`}
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
