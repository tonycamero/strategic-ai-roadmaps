import { ConsoleScope } from '../ConsoleScope';
import { ConsolePanel } from '../consoleSchema';

interface CascadeRisk {
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface SimulationPanelProps {
  risks: CascadeRisk[];
  isLoading?: boolean;
}

export function SimulationPanel({ risks, isLoading }: SimulationPanelProps) {
  return (
    <ConsoleScope panel={ConsolePanel.SIMULATION_PANEL}>
      <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl backdrop-blur-sm">
        <h3 className="text-xs font-black uppercase tracking-widest text-rose-500 mb-4">
          Cascade Risk Simulations
        </h3>
        
        <div className="space-y-4">
          {isLoading ? (
            <>
              <div className="h-24 bg-slate-950/50 border border-slate-800 rounded-xl animate-pulse" />
              <div className="h-24 bg-slate-950/50 border border-slate-800 rounded-xl animate-pulse" />
            </>
          ) : (
            <>
              {risks.map((risk, i) => (
                <div key={i} className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-100">{risk.title}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                      risk.severity === 'HIGH' ? 'bg-rose-500/10 text-rose-500' :
                      risk.severity === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-emerald-500/10 text-emerald-500'
                    }`}>
                      {risk.severity} Risk
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {risk.description}
                  </p>
                </div>
              ))}
              {risks.length === 0 && (
                <div className="text-xs text-slate-500 italic py-4 text-center">
                  No high-order failure modes detected.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ConsoleScope>
  );
}
