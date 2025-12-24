import { Check, Circle, Loader } from 'lucide-react';
import { useLocation } from 'wouter';
import type { OnboardingStep } from '../../types/onboarding';
import { getRouteForStep } from '../../utils/onboardingRoutes';

interface StepItemProps {
  step: OnboardingStep;
  isNext: boolean;
}

export function StepItem({ step, isNext }: StepItemProps) {
  const [, setLocation] = useLocation();

  const handleClick = () => {
    const route = getRouteForStep(step.stepId);
    setLocation(route);
  };

  const getIcon = () => {
    switch (step.status) {
      case 'COMPLETED':
        return <Check className="h-4 w-4 text-green-400" />;
      case 'IN_PROGRESS':
        return <Loader className="h-4 w-4 text-blue-400" />;
      default:
        return <Circle className="h-4 w-4 text-slate-600" />;
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2 rounded-lg
        transition-colors cursor-pointer text-left
        ${isNext 
          ? 'bg-slate-800 border border-blue-500/40' 
          : 'hover:bg-slate-800/60'
        }
      `}
    >
      {getIcon()}
      
      <div className="flex-1 min-w-0">
        <div className="text-sm text-slate-200">{step.label}</div>
        {step.isRequired && (
          <span className="text-xs text-slate-500">Required</span>
        )}
      </div>
      
      <div className="text-xs text-slate-500">
        {step.pointsEarned}/{step.pointsPossible}
      </div>
    </button>
  );
}
