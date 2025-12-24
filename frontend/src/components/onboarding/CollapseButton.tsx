import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CollapseButtonProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function CollapseButton({ collapsed, onToggle }: CollapseButtonProps) {
  return (
    <button
      onClick={onToggle}
      className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
      aria-label={collapsed ? 'Expand onboarding' : 'Collapse onboarding'}
    >
      {collapsed ? (
        <ChevronRight className="h-4 w-4" />
      ) : (
        <ChevronLeft className="h-4 w-4" />
      )}
    </button>
  );
}
