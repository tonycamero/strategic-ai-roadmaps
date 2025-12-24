interface NextActionCardProps {
  phase: 'onboarding' | 'roadmap_review' | 'pilot_design' | 'implementation';
  actions: Array<{ id: string; text: string }>;
  onViewPlan: () => void;
}

const PHASE_ACTIONS = {
  onboarding: [
    { id: '1', text: 'Invite remaining leaders' },
    { id: '2', text: 'Review intake submissions' },
    { id: '3', text: 'Prepare for roadmap review' },
  ],
  roadmap_review: [
    { id: '1', text: 'Schedule walkthrough call' },
    { id: '2', text: 'Review key findings' },
    { id: '3', text: 'Identify pilot systems' },
  ],
  pilot_design: [
    { id: '1', text: 'Finalize system selection' },
    { id: '2', text: 'Scope implementation timeline' },
    { id: '3', text: 'Set KPIs' },
  ],
  implementation: [
    { id: '1', text: 'Monitor pilot metrics' },
    { id: '2', text: 'Weekly team check-ins' },
    { id: '3', text: 'Refine and iterate systems' },
  ],
};

export function NextActionCard({ phase, actions, onViewPlan }: NextActionCardProps) {
  // Use provided actions or fall back to phase defaults
  const displayActions = actions.length > 0 ? actions : PHASE_ACTIONS[phase];

  return (
    <div className="bg-slate-900/40 border border-slate-800 border-l-4 border-l-blue-500 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-slate-100 mb-4">This Week's Focus</h2>
      
      <div className="space-y-3 mb-6">
        {displayActions.slice(0, 3).map((action) => (
          <div key={action.id} className="flex items-start gap-2">
            <span className="text-blue-400 mt-0.5">→</span>
            <span className="text-sm text-slate-300">{action.text}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onViewPlan}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
      >
        View step-by-step plan
      </button>
    </div>
  );
}
