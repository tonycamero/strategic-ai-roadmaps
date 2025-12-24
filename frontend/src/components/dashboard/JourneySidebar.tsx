import { useLocation } from 'wouter';
import { useOnboarding } from '../../context/OnboardingContext';
import { useTenant } from '../../context/TenantContext';

interface JourneyStep {
  id: string;
  label: string;
  path: string;
  completed: boolean;
  phase: 'setup' | 'team' | 'roadmap';
}

export function JourneySidebar() {
  const [location, setLocation] = useLocation();
  const { state } = useOnboarding();
  const { tenant } = useTenant();

  if (!state) return null;

  const firmName = tenant?.name || 'Organization';

  // Map onboarding steps to journey items grouped by phase
  const journeySteps: JourneyStep[] = [
    {
      id: 'overview',
      label: 'Create Dashboard',
      path: '/dashboard',
      completed: true,
      phase: 'setup',
    },
    {
      id: 'organization-type',
      label: 'Organization Type',
      path: '/organization-type',
      completed: state.steps?.find(s => s.stepId === 'ORGANIZATION_TYPE')?.status === 'COMPLETED' || false,
      phase: 'setup',
    },
    {
      id: 'business-profile',
      label: 'Business Profile',
      path: '/business-profile',
      completed: state.steps?.find(s => s.stepId === 'BUSINESS_PROFILE')?.status === 'COMPLETED' || false,
      phase: 'setup',
    },
    {
      id: 'owner-intake',
      label: 'Owner Intake',
      path: '/intake/owner',
      completed: state.steps?.find(s => s.stepId === 'OWNER_INTAKE')?.status === 'COMPLETED' || false,
      phase: 'setup',
    },
    {
      id: 'invite-team',
      label: 'Invite Team',
      path: '/invite-team',
      completed: state.steps?.find(s => s.stepId === 'INVITE_TEAM')?.status === 'COMPLETED' || false,
      phase: 'team',
    },
    {
      id: 'team-intakes',
      label: 'Team Intakes',
      path: '/team-intakes',
      completed: state.steps?.find(s => s.stepId === 'TEAM_INTAKES')?.status === 'COMPLETED' || false,
      phase: 'team',
    },
    {
      id: 'diagnostic',
      label: 'Diagnostic Created',
      path: '/diagnostic-review',
      completed: state.steps?.find(s => s.stepId === 'DIAGNOSTIC_GENERATED')?.status === 'COMPLETED' || false,
      phase: 'roadmap',
    },
    {
      id: 'discovery-call',
      label: 'Discovery Call',
      path: '/discovery-call',
      completed: state.steps?.find(s => s.stepId === 'DISCOVERY_CALL')?.status === 'COMPLETED' || false,
      phase: 'roadmap',
    },
    {
      id: 'roadmap-review',
      label: 'Final Roadmap',
      path: '/roadmap',
      completed: state.steps?.find(s => s.stepId === 'ROADMAP_REVIEWED')?.status === 'COMPLETED' || false,
      phase: 'roadmap',
    },
  ];

  const phaseLabels = {
    setup: { label: 'Setup', timing: '~15 min' },
    team: { label: 'Team Input', timing: '~2-3 days' },
    roadmap: { label: 'Roadmap Creation', timing: '~1 week' },
  };

  return (
    <aside className="w-64 bg-slate-900/70 border-r border-slate-800 h-screen sticky top-0 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-sm font-semibold text-slate-200">{firmName}</h2>
        <p className="text-xs text-slate-400 mt-1">Journey Tracking</p>
      </div>

      {/* Steps grouped by phase */}
      <nav className="flex-1 overflow-y-auto py-2">
        {(['setup', 'team', 'roadmap'] as const).map((phase) => {
          const phaseSteps = journeySteps.filter(s => s.phase === phase);
          const phaseInfo = phaseLabels[phase];

          return (
            <div key={phase} className="mb-4">
              {/* Phase header */}
              <div className="px-4 py-2 flex items-center justify-between">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {phaseInfo.label}
                </h3>
                <span className="text-[10px] text-slate-600">{phaseInfo.timing}</span>
              </div>

              {/* Phase steps */}
              {phaseSteps.map((step) => {
                const isActive = location === step.path || location.startsWith(step.path + '/');

                return (
                  <button
                    key={step.id}
                    onClick={() => setLocation(step.path)}
                    className={`
                      w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors
                      ${isActive
                        ? 'bg-blue-600/20 text-blue-300 border-l-2 border-blue-500'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }
                    `}
                  >
                    {/* Completion indicator */}
                    <span className={`
                      flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center
                      ${step.completed
                        ? 'bg-emerald-600 border-emerald-600'
                        : isActive
                          ? 'border-blue-500'
                          : 'border-slate-700'
                      }
                    `}>
                      {step.completed && (
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {!step.completed && isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      )}
                    </span>

                    {/* Label */}
                    <span className="flex-1 text-[13px]">{step.label}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
