import React from 'react';
import { CommandCenterTenant } from '../types';

interface ExecutionContextPanelProps {
    tenant: CommandCenterTenant | null;
    onViewFirm: (id: string) => void;
    onViewRoadmap: (id: string) => void;
    onViewDiagnostics: (id: string) => void;
}

export const ExecutionContextPanel: React.FC<ExecutionContextPanelProps> = ({
    tenant,
    onViewFirm,
    onViewRoadmap,
    onViewDiagnostics
}) => {
    if (!tenant) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-40">
                <div className="w-16 h-16 mb-6 border-2 border-dashed border-slate-700 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                </div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Awaiting Context</h3>
                <p className="text-[10px] font-bold text-slate-600 leading-relaxed max-w-[200px]">
                    Select a tenant from the queue to view situational awareness and recommendations.
                </p>
            </div>
        );
    }


    return (
        <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-500">
            {/* Panel Header */}
            <header className="px-8 py-10 border-b border-slate-900 bg-slate-900/10">
                <div className="flex items-start justify-between gap-6 mb-6">
                    <div className="min-w-0">
                        <h2 className="text-xl font-black text-white tracking-tight truncate mb-2">
                            {tenant.name}
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                {tenant.onboardingState?.replace(/_/g, ' ') || 'UNKNOWN'}
                            </span>
                            <span className="text-[9px] font-mono text-slate-500 font-bold">
                                {Math.round(tenant.percentComplete || 0)}% Processed
                            </span>
                        </div>
                    </div>
                </div>

                <div className="h-0.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-700"
                        style={{ width: `${tenant.percentComplete}%` }}
                    />
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8 space-y-12">

                {/* 3. Operational Access */}
                <section>
                    <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Operational Access</h3>
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={() => onViewFirm(tenant.id)}
                            className="w-full text-left px-5 py-4 bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/30 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all flex items-center justify-between group"
                        >
                            View Firm Overview
                            <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                        <button
                            onClick={() => onViewRoadmap(tenant.id)}
                            className="w-full text-left px-5 py-4 bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/30 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all flex items-center justify-between group"
                        >
                            View Strategic Roadmap
                            <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                        <button
                            onClick={() => onViewDiagnostics(tenant.id)}
                            className="w-full text-left px-5 py-4 bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/30 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all flex items-center justify-between group"
                        >
                            Analyze Diagnostics
                            <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
};
