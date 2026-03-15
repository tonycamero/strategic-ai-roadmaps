import { useState } from 'react';
import { useLocation } from 'wouter';
import { useOnboarding } from '../../context/OnboardingContext';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, ShieldCheck, ChevronDown, ChevronRight, Activity, Zap, BarChart3, Map as MapIcon, FileText, LogOut } from 'lucide-react';

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
  const { logout } = useAuth();
  const [journeyOpen, setJourneyOpen] = useState(false);

  if (!state) return null;

  const firmName = tenant?.name || 'Organization';
  const isExecutionReady = state.steps?.find(s => s.stepId === 'ROADMAP_REVIEWED')?.status === 'COMPLETED';

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

  const consoleLinks = [
    // AG-TICKET-NAV-COLLAPSE: Single decisive surface for pilot.
    // All other links hidden from UI. Routes remain intact internally.
    { label: 'Executive Console', path: '/exec', basePath: '/exec', icon: ShieldCheck },
  ];

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 h-screen sticky top-0 flex flex-col z-50">
      {/* Header */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">
            {isExecutionReady ? 'Strategic AI' : 'Journey Tracking'}
          </h2>
        </div>
        <div className="text-sm font-bold text-slate-100 truncate">{firmName}</div>
      </div>

      <nav className="flex-1 overflow-y-auto py-6">
        {/* EXECUTIVE CONSOLE PRIMARY NAV */}
        {isExecutionReady && (
          <div className="px-3 mb-8">
            <h3 className="px-3 mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
              Executive Control
            </h3>
            <div className="space-y-1">
              {consoleLinks.map((link) => {
                const isActive = location === link.basePath || location.startsWith(link.basePath + '?') || location.startsWith(link.basePath + '/');
                const Icon = link.icon;
                return (
                  <button
                    key={link.path}
                    onClick={() => setLocation(link.path)}
                    className={`
                      w-full px-3 py-2.5 rounded-xl text-left text-[13px] font-bold flex items-center gap-3 transition-all
                      ${isActive
                        ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.05)]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                      }
                    `}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                    {link.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* JOURNEY STEPS (Collapsible if Execution Ready) */}
        <div className="px-3">
          {isExecutionReady ? (
            <div className="mt-4 border-t border-slate-800/50 pt-4">
              <button 
                onClick={() => setJourneyOpen(!journeyOpen)}
                className="w-full px-3 py-2 flex items-center justify-between text-slate-500 hover:text-slate-300 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Journey History</span>
                </div>
                {journeyOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {journeyOpen && (
                <div className="mt-2 space-y-4 px-3 border-l border-slate-800 ml-4 py-2">
                  {(['setup', 'team', 'roadmap'] as const).map((phase) => (
                    <div key={phase}>
                      <div className="text-[9px] font-black uppercase tracking-tighter text-slate-600 mb-2">{phaseLabels[phase].label}</div>
                      <div className="space-y-1">
                        {journeySteps.filter(s => s.phase === phase).map(step => (
                          <button
                            key={step.id}
                            onClick={() => setLocation(step.path)}
                            className="w-full py-1 text-left text-[11px] font-medium text-slate-500 hover:text-indigo-400 transition-colors flex items-center gap-2"
                          >
                            <div className={`w-1.5 h-1.5 rounded-full ${step.completed ? 'bg-emerald-500/40' : 'border border-slate-700'}`} />
                            {step.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {(['setup', 'team', 'roadmap'] as const).map((phase) => {
                const phaseSteps = journeySteps.filter(s => s.phase === phase);
                const phaseInfo = phaseLabels[phase];

                return (
                  <div key={phase} className="mb-6">
                    <div className="px-3 py-2 flex items-center justify-between">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        {phaseInfo.label}
                      </h3>
                      <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">{phaseInfo.timing}</span>
                    </div>

                    <div className="space-y-1 mt-1">
                      {phaseSteps.map((step) => {
                        const isActive = location === step.path || location.startsWith(step.path + '/');

                        return (
                          <button
                            key={step.id}
                            onClick={() => setLocation(step.path)}
                            className={`
                              w-full px-3 py-2 rounded-xl text-left text-[13px] font-bold flex items-center gap-3 transition-all
                              ${isActive
                                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                              }
                            `}
                          >
                            <div className={`
                              flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center
                              ${step.completed
                                ? 'bg-emerald-500 border-emerald-500'
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
                            </div>
                            {step.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </nav>
      
      {/* Footer */}
      <div className="p-4 bg-slate-950/50 space-y-3">
        {/* Progress Strip */}
        <div className="px-3 py-3 border border-slate-800 rounded-xl bg-slate-900/50">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Ready</span>
          </div>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-1000" 
              style={{ width: `${state.percentComplete}%` }} 
            />
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full px-3 py-2.5 rounded-xl text-left text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 transition-all flex items-center gap-3 group"
        >
          <LogOut className="w-3.5 h-3.5 text-slate-600 group-hover:text-rose-500 transition-colors" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
