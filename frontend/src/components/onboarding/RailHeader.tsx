import { ProgressRing } from './ProgressRing';
import { CollapseButton } from './CollapseButton';
import { useOnboarding } from '../../context/OnboardingContext';

interface RailHeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function RailHeader({ collapsed, onToggle }: RailHeaderProps) {
  const { state } = useOnboarding();

  if (!state) return null;

  return (
    <div className="flex items-center gap-3 p-4 border-b border-slate-800">
      <ProgressRing percent={state.percentComplete} />
      
      {!collapsed && (
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-200">
            Your Roadmap Journey
          </h3>
          <p className="text-xs text-slate-400">
            {state.totalPoints} of {state.maxPoints} points
          </p>
        </div>
      )}
      
      <CollapseButton collapsed={collapsed} onToggle={onToggle} />
    </div>
  );
}
