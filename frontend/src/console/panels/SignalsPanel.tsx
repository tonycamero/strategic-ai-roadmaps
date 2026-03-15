import { ConsoleScope } from '../ConsoleScope';
import { ConsolePanel } from '../consoleSchema';

interface SignalsPanelProps {
  signals: string[];
  isLoading?: boolean;
}

export function SignalsPanel({ signals, isLoading }: SignalsPanelProps) {
  return (
    <ConsoleScope panel={ConsolePanel.SIGNALS_PANEL}>
      <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl backdrop-blur-sm">
        <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-4">
          Emerging Signals
        </h3>
        
        <div className="space-y-3">
          {isLoading ? (
            <>
              <div className="h-12 bg-slate-950/50 border border-slate-800 rounded-xl animate-pulse" />
              <div className="h-12 bg-slate-950/50 border border-slate-800 rounded-xl animate-pulse" />
              <div className="h-12 bg-slate-950/50 border border-slate-800 rounded-xl animate-pulse" />
            </>
          ) : (
            <>
              {signals.map((signal, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-950/50 border border-slate-800 rounded-xl transition-all hover:border-emerald-500/30 group">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 group-hover:scale-125 transition-transform" />
                  <span className="text-sm text-slate-300 font-medium">{signal}</span>
                </div>
              ))}
              {signals.length === 0 && (
                <div className="text-xs text-slate-500 italic py-4 text-center">
                  Awaiting operational telemetry...
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ConsoleScope>
  );
}
