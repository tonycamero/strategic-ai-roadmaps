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

    const nextAction = () => {
        const { onboardingState, readiness } = tenant;

        if (onboardingState === 'intake_open') return "Await Intake completion";
        if (onboardingState === 'diagnostic_ready') return "Ready to generate Strategic Synthesis";
        if (onboardingState === 'diagnostic_complete') {
            if (!readiness.rolesValidatedAt) return "Validate role signals for moderation";
            return "Finalize synthesis for Executive review";
        }
        if (onboardingState === 'delegate_ready') {
            if (!readiness.execReadyAt) return "Await Executive Review readiness";
            return "Perform Executive moderation and finalization";
        }
        if (onboardingState === 'exec_review') return "Review final Strategic Roadmap";
        if (onboardingState === 'roadmap_finalized') return "Strategy execution is active";

        return "System standby";
    };

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
                                {tenant.onboardingState.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[9px] font-mono text-slate-500 font-bold">
                                {Math.round(tenant.percentComplete)}% Processed
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
                {/* 1. Next Recommended Action */}
                <section>
                    <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Next Recommended Action</h3>
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 flex items-start gap-4 ring-4 ring-emerald-500/5">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-black text-emerald-400 tracking-tight leading-tight">
                                {nextAction()}
                            </p>
                        </div>
                    </div>
                </section>

                {/* 2. Readiness Matrix */}
                <section>
                    <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Readiness Matrix</h3>
                    <div className="grid grid-cols-1 gap-3">
                        {[
                            { label: 'Knowledge Base', status: tenant.readiness.knowledgeBaseReadyAt, color: 'emerald' },
                            { label: 'Role Validation', status: tenant.readiness.rolesValidatedAt, color: 'blue' },
                            { label: 'Executive Review', status: tenant.readiness.execReadyAt, color: 'purple' }
                        ].map(gate => (
                            <div key={gate.label} className="flex items-center justify-between p-4 bg-slate-900/40 border border-slate-800/50 rounded-xl">
                                <span className="text-xs font-bold text-slate-300">{gate.label}</span>
                                <div className="flex items-center gap-3">
                                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${gate.status ? 'text-emerald-500' : 'text-slate-600'}`}>
                                        {gate.status ? 'Ready' : 'Incomplete'}
                                    </span>
                                    {gate.label === 'Knowledge Base' && (
                                        <svg
                                            className={`w-4 h-4 ${gate.status ? 'text-green-500 filter drop-shadow-[0_0_5px_rgba(34,197,94,0.4)]' : 'text-slate-800 opacity-40'}`}
                                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                    )}
                                    {gate.label === 'Role Validation' && (
                                        <svg
                                            className={`w-4 h-4 ${gate.status ? 'text-blue-500 filter drop-shadow-[0_0_5px_rgba(59,130,246,0.4)]' : 'text-slate-800 opacity-40'}`}
                                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    )}
                                    {gate.label === 'Executive Review' && (
                                        <svg
                                            className={`w-4 h-4 ${gate.status ? 'text-purple-500 filter drop-shadow-[0_0_5px_rgba(168,85,247,0.4)]' : 'text-slate-800 opacity-40'}`}
                                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A3.323 3.323 0 0010.605 2.152a3.323 3.323 0 00-4.638 3.376 3.323 3.323 0 002.152 4.987 3.323 3.323 0 002.152 4.987 3.323 3.323 0 003.376 4.638 3.323 3.323 0 004.987-2.152 3.323 3.323 0 003.376-4.638 3.323 3.323 0 00-2.152-4.987zM5 2c0 .656-.126 1.283-.356 1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

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
