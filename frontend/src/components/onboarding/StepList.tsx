import { StepItem } from './StepItem';
import { useOnboarding } from '../../context/OnboardingContext';

export function StepList() {
  const { state } = useOnboarding();

  if (!state) return null;

  // Filter out TICKETS_MODERATED from client UI (internal step only)
  const sortedSteps = [...state.steps]
    .filter(step => step.stepId !== 'TICKETS_MODERATED')
    .sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
      {sortedSteps.map(step => (
        <StepItem
          key={step.stepId}
          step={step}
          isNext={step.stepId === state.nextStepId}
        />
      ))}
    </div>
  );
}
