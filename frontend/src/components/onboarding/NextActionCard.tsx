import { ArrowRight, Clock } from 'lucide-react';
import { useLocation } from 'wouter';
import { useOnboarding } from '../../context/OnboardingContext';
import { getRouteForStep } from '../../utils/onboardingRoutes';

export function NextActionCard() {
  const { state } = useOnboarding();
  const [, setLocation] = useLocation();

  if (!state?.nextStepId) return null;

  const handleClick = () => {
    const route = getRouteForStep(state.nextStepId!);
    setLocation(route);
  };

  return (
    <div className="mx-3 my-4 p-4 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-blue-500/30 shadow-lg">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-blue-400">Next Step</span>
        {state.nextStepEstimatedMinutes && (
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            <Clock className="h-3 w-3" />
            ~{state.nextStepEstimatedMinutes} min
          </span>
        )}
      </div>
      
      <h4 className="text-sm font-semibold text-slate-100 mb-3">
        {state.nextStepLabel}
      </h4>
      
      <button
        onClick={handleClick}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
      >
        Continue
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
