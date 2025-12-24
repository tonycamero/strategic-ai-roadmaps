import { useOnboarding } from '../../context/OnboardingContext';
import { useLocation } from 'wouter';
import type { OnboardingStepId } from '../../types/onboarding';

interface ProgressHeroCardProps {
  teamStatus?: Array<{
    role: string;
    intakeComplete: boolean;
  }>;
}

const STEP_GROUPS = [
  {
    id: 'setup',
    label: 'Setup',
    stepIds: ['ORGANIZATION_TYPE', 'BUSINESS_PROFILE', 'OWNER_INTAKE'] as OnboardingStepId[],
  },
  {
    id: 'team',
    label: 'Team Input',
    stepIds: ['INVITE_TEAM', 'TEAM_INTAKES'] as OnboardingStepId[],
  },
  {
    id: 'roadmap',
    label: 'Roadmap',
    stepIds: ['DIAGNOSTIC_GENERATED', 'DISCOVERY_CALL', 'ROADMAP_REVIEWED'] as OnboardingStepId[],
  },
] as const;

export function ProgressHeroCard({ teamStatus = [] }: ProgressHeroCardProps) {
  const { state } = useOnboarding();
  const [, setLocation] = useLocation();

  if (!state) return null;

  const completedSteps = state.steps?.filter(s => s.status === 'COMPLETED').length || 0;
  const totalSteps = state.steps?.length || 1;
  const progressPercent = Math.round((completedSteps / totalSteps) * 100);

  // Calculate group progress
  const groupProgress = STEP_GROUPS.map(group => {
    const steps = (state.steps || []).filter(s => group.stepIds.includes(s.stepId as OnboardingStepId));
    let completed = steps.filter(s => s.status === 'COMPLETED').length;
    let total = steps.length;

    // Setup phase includes account creation (always completed)
    if (group.id === 'setup') {
      total += 1; // Add account creation step
      completed += 1; // It's always completed if user is logged in
    }

    return {
      ...group,
      completed,
      total,
      done: total > 0 && completed === total,
      percent: total === 0 ? 0 : Math.round((completed / total) * 100),
    };
  });

  // Determine next action
  const nextIncompleteStep = state.steps?.find(s => s.status !== 'COMPLETED');
  const getNextActionLabel = () => {
    if (!nextIncompleteStep) return 'All steps complete!';
    
    const stepLabels: Record<string, string> = {
      ORGANIZATION_TYPE: 'Set your organization type',
      BUSINESS_PROFILE: 'Complete business profile',
      OWNER_INTAKE: 'Complete owner intake',
      INVITE_TEAM: 'Invite your team',
      TEAM_INTAKES: 'Wait for team intakes',
      DIAGNOSTIC_GENERATED: 'Review your diagnostic',
      DISCOVERY_CALL: 'Schedule discovery call',
      ROADMAP_GENERATED: 'Review your roadmap',
    };
    
    return stepLabels[nextIncompleteStep.stepId] || 'Continue onboarding';
  };

  const getNextActionPath = () => {
    if (!nextIncompleteStep) return '/dashboard';
    
    const stepPaths: Record<string, string> = {
      ORGANIZATION_TYPE: '/organization-type',
      BUSINESS_PROFILE: '/business-profile',
      OWNER_INTAKE: '/intake/owner',
      INVITE_TEAM: '/invite-team',
      TEAM_INTAKES: '/dashboard#team',
      DIAGNOSTIC_GENERATED: '/dashboard#diagnostic',
      DISCOVERY_CALL: '/dashboard#discovery',
      ROADMAP_GENERATED: '/roadmap',
    };
    
    return stepPaths[nextIncompleteStep.stepId] || '/dashboard';
  };

  return (
    <div className="bg-gradient-to-r from-blue-900/20 to-slate-900/40 rounded-xl border border-slate-800 p-6">
      {/* Header with progress */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-slate-100">
            Your Roadmap Progress ({progressPercent}%)
          </h2>
          {nextIncompleteStep && (
            <button
              onClick={() => setLocation(getNextActionPath())}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Continue onboarding
            </button>
          )}
        </div>
        <p className="text-xs text-slate-400 mb-3">
          You're almost there. Finish the remaining steps to lock in your roadmap.
        </p>
        <div className="w-full bg-slate-800 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-400">
          <span>Next step → {getNextActionLabel()}</span>
          <span>{progressPercent}% complete</span>
        </div>
      </div>

      {/* Grouped Progress Summary - 3 buckets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {groupProgress.map(group => (
          <div
            key={group.id}
            className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-100 uppercase tracking-wide">
                {group.label}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  group.done
                    ? 'bg-emerald-500/10 text-emerald-300'
                    : 'bg-slate-800 text-slate-200'
                }`}
              >
                {group.completed}/{group.total}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  group.done ? 'bg-emerald-400' : 'bg-blue-500'
                }`}
                style={{ width: `${group.percent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              {group.done
                ? 'Complete'
                : group.completed === 0
                ? 'Not started yet'
                : 'In progress'}
            </p>
          </div>
        ))}
      </div>

      {/* Team status */}
      {teamStatus.length > 0 && (
        <div className="border-t border-slate-800 pt-4 mt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Leadership Team Status</h3>
          <div className="flex flex-wrap gap-2">
            {teamStatus.map((member) => (
              <div
                key={member.role}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 text-slate-100"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-xs uppercase tracking-wide text-slate-300">{member.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
