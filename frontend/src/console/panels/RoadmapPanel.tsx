import { useLocation } from 'wouter';
import { ConsoleScope } from '../ConsoleScope';
import { ConsolePanel } from '../consoleSchema';

interface RoadmapAction {
  label: string;
  type: string;
  description: string;
}

interface RoadmapPanelProps {
  actions: RoadmapAction[];
  isLoading?: boolean;
}

export function RoadmapPanel({ actions, isLoading }: RoadmapPanelProps) {
  const [, setLocation] = useLocation();

  return (
    <ConsoleScope panel={ConsolePanel.ROADMAP_PANEL}>
      <div className="p-6 bg-indigo-950/20 border border-indigo-500/20 rounded-2xl backdrop-blur-sm">
        <h3 className="text-xs font-black uppercase tracking-widest text-indigo-300 mb-4">
          Strategic Execution Map
        </h3>
        
        <div className="space-y-4">
          {isLoading ? (
            <>
              <div className="h-20 bg-indigo-950/40 border border-indigo-500/10 rounded-xl animate-pulse" />
              <div className="h-20 bg-indigo-950/40 border border-indigo-500/10 rounded-xl animate-pulse" />
              <div className="h-20 bg-indigo-950/40 border border-indigo-500/10 rounded-xl animate-pulse" />
            </>
          ) : (
            <>
              {actions.map((action, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="flex items-start justify-between p-4 bg-indigo-950/40 border border-indigo-500/10 rounded-xl transition-all hover:bg-indigo-900/40 hover:border-indigo-500/40">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-indigo-100">{action.label}</span>
                        <span className="text-[9px] font-black px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded uppercase tracking-tighter">
                          {action.type}
                        </span>
                      </div>
                      <p className="text-xs text-indigo-200/60 leading-relaxed">
                        {action.description}
                      </p>
                    </div>
                    <div className="ml-4 text-indigo-500 group-hover:translate-x-1 transition-transform">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
              {actions.length === 0 && (
                <div className="text-xs text-indigo-300/40 italic py-4 text-center border border-dashed border-indigo-500/20 rounded-xl">
                  Roadmap active. Monitoring delivery signals.
                </div>
              )}
            </>
          )}
        </div>
        
        {/* AG-TICKET-EC-04: Navigate to /roadmap (execution DAG), not /diagnostic-review */}
        <button
          onClick={() => setLocation('/roadmap')}
          className="w-full mt-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg shadow-indigo-600/20"
        >
          Open Full Operational Map
        </button>
      </div>
    </ConsoleScope>
  );
}

