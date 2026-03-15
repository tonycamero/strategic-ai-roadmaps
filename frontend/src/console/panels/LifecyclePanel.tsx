import { ConsoleScope } from '../ConsoleScope';
import { ConsolePanel } from '../consoleSchema';

// AG-TICKET-EC-06: Narrative must always match lifecycle state
const LIFECYCLE_NARRATIVES: Record<string, string> = {
  DISCOVERY:         'Discovery phase active. Gathering intelligence before strategy can be assembled.',
  ROADMAP_READY:     'Roadmap is finalised and ready for execution confirmation.',
  EXECUTION_READY:   'Operational execution mode active. Strategy delivery is the primary objective.',
  EXECUTION:         'Operational execution mode active. Strategy delivery is the primary objective.',
  SCALING:           'Scaling phase active. Optimising and expanding proven execution patterns.',
  OPEN_INITIAL:      'Intake phase in progress. Base data collection underway.',
  INTAKE:            'Intake phase in progress. Base data collection underway.',
};

function getNarrative(stage: string): string {
  return LIFECYCLE_NARRATIVES[stage.toUpperCase()] ?? `${stage} phase active.`;
}

interface LifecyclePanelProps {
  stage: string;
  narrative?: string;  // optional override; defaults to canonical map
  isLoading?: boolean;
}

export function LifecyclePanel({ stage, narrative, isLoading }: LifecyclePanelProps) {
  const resolvedNarrative = narrative || getNarrative(stage);

  return (
    <ConsoleScope panel={ConsolePanel.LIFECYCLE_PANEL}>
      <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400">
            Lifecycle Position
          </h3>
          {isLoading ? (
            <div className="w-20 h-5 bg-indigo-500/10 rounded-full animate-pulse" />
          ) : (
            <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-[10px] font-bold text-indigo-400 uppercase">
              {stage}
            </div>
          )}
        </div>
        
        {isLoading ? (
          <div className="space-y-2">
            <div className="w-full h-4 bg-slate-800 rounded animate-pulse" />
            <div className="w-2/3 h-4 bg-slate-800 rounded animate-pulse" />
          </div>
        ) : (
          <p className="text-sm text-slate-300 leading-relaxed font-medium">
            {resolvedNarrative}
          </p>
        )}
        
        <div className="mt-4 flex gap-1">
          {[1, 2, 3, 4, 5, 6, 7].map((s) => (
            <div 
              key={s}
              className={`h-1 flex-1 rounded-full ${isLoading ? 'bg-slate-800' : (s <= 7 ? 'bg-indigo-500' : 'bg-slate-800')}`}
            />
          ))}
        </div>
      </div>
    </ConsoleScope>
  );
}
