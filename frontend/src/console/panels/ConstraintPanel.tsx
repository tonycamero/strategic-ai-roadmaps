import { ConsoleScope } from '../ConsoleScope';
import { ConsolePanel } from '../consoleSchema';

interface ConstraintPanelProps {
  constraint: string;
  isLoading?: boolean;
}

export function ConstraintPanel({ constraint, isLoading }: ConstraintPanelProps) {
  return (
    <ConsoleScope panel={ConsolePanel.CONSTRAINT_PANEL}>
      <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl backdrop-blur-sm">
        <h3 className="text-xs font-black uppercase tracking-widest text-amber-500 mb-4">
          Dominant Constraint
        </h3>
        
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 flex-shrink-0 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center">
            {isLoading ? (
              <div className="w-6 h-6 bg-amber-500/20 rounded animate-pulse" />
            ) : (
              <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>
          <div className="flex-1">
            {isLoading ? (
              <div className="space-y-2">
                <div className="w-3/4 h-5 bg-slate-800 rounded animate-pulse" />
                <div className="w-1/2 h-3 bg-slate-800/50 rounded animate-pulse" />
              </div>
            ) : (
              <>
                <div className="text-lg font-bold text-slate-100 leading-tight mb-1">
                  {constraint}
                </div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                  Systemic Bottleneck Identified
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </ConsoleScope>
  );
}
