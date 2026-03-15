import { useTenant } from '../../context/TenantContext';
import { useTrustAgentAnalysis } from '../../console/useTrustAgentAnalysis';
import { ConsoleScope } from '../../console/ConsoleScope';
import { ConsolePage } from '../../console/consoleSchema';
import { LifecyclePanel } from '../../console/panels/LifecyclePanel';
import { ConstraintPanel } from '../../console/panels/ConstraintPanel';
import { SignalsPanel } from '../../console/panels/SignalsPanel';
import { SimulationPanel } from '../../console/panels/SimulationPanel';
import { RoadmapPanel } from '../../console/panels/RoadmapPanel';

export default function ExecutiveConsole() {
  const { tenant, isLoading: tenantLoading } = useTenant();
  const { data: analysis, isLoading: analysisLoading, error } = useTrustAgentAnalysis(tenant?.id);

  if (tenantLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400">
            Initialising Console
          </p>
        </div>
      </div>
    );
  }

  return (
    <ConsoleScope page={ConsolePage.EXEC_CONSOLE}>
      <div className="min-h-screen bg-black text-slate-100 pb-20">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/5 px-6 py-8">
          <div className="max-w-7xl mx-auto flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">
                  Trust Console Active
                </span>
              </div>
              <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
                Executive Console
              </h1>
            </div>
            
            <div className="text-right hidden md:block">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                Connected Authority
              </div>
              <div className="text-sm font-bold text-slate-300">
                {tenant?.name || 'Authorized Firm'}
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-12">
          {/* Top Row: Strategic Narrative */}
          <section className="mb-12">
            <div className="max-w-3xl">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">
                Strategic Narrative
              </h2>
              {analysisLoading && !analysis ? (
                <div className="space-y-3">
                  <div className="w-full h-8 bg-slate-900 rounded animate-pulse" />
                  <div className="w-2/3 h-8 bg-slate-900 rounded animate-pulse" />
                </div>
              ) : (
                <div className="text-2xl font-medium text-slate-300 leading-tight">
                  {analysis?.strategicNarrative || 'Operational execution mode active. Strategy delivery is the primary objective.'}
                </div>
              )}
            </div>
          </section>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
            
            {/* Column 1: State & Constraints */}
            <div className="space-y-6">
              <LifecyclePanel 
                stage={analysis?.lifecycleStage || 'EXECUTION'} 
                narrative="System is currently stabilized in the post-roadmap execution phase." 
                isLoading={analysisLoading && !analysis}
              />
              <ConstraintPanel 
                constraint={analysis?.dominantConstraint || 'Internal Resources'} 
                isLoading={analysisLoading && !analysis}
              />
            </div>

            {/* Column 2: Signals & Risks */}
            <div className="space-y-6">
              <SignalsPanel 
                signals={analysis?.emergingSignals || []} 
                isLoading={analysisLoading && !analysis}
              />
              <SimulationPanel 
                risks={analysis?.cascadeRisks || []} 
                isLoading={analysisLoading && !analysis}
              />
            </div>

            {/* Column 3: Roadmap & Actions */}
            <div className="space-y-6 lg:col-span-1 md:col-span-2">
              <RoadmapPanel 
                actions={analysis?.suggestedActions || []} 
                isLoading={analysisLoading && !analysis}
              />
            </div>

          </div>
        </main>
      </div>
      {error && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-right-4">
          <div className="bg-rose-500/10 border border-rose-500/50 backdrop-blur-md p-4 rounded-xl max-w-xs shadow-2xl">
            <div className="flex gap-3">
              <div className="text-rose-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-wider mb-1">Analysis Error</div>
                <div className="text-[10px] text-slate-300 leading-tight">Failed to fetch agent intelligence. Using snapshot fallback.</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConsoleScope>
  );
}
