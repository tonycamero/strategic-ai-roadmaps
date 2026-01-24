import { FC } from 'react';
import { CommandCenterTenant } from '../types';

interface ExecuteTenantRowProps {
    tenant: CommandCenterTenant;
    isSelected: boolean;
    isFocused: boolean;
    onSelect: (id: string) => void;
    onFocus: (tenant: CommandCenterTenant) => void;
    onExecute: (id: string) => void;
}

export const ExecuteTenantRow: FC<ExecuteTenantRowProps> = ({
    tenant,
    isSelected,
    isFocused,
    onSelect,
    onFocus,
    onExecute
}) => {
    const getOnboardingStateLabel = (state: string) => {
        const labels: Record<string, string> = {
            intake_open: 'Intake Open',
            diagnostic_ready: 'Ready for Synthesis',
            diagnostic_complete: 'Synthesis Complete',
            delegate_ready: 'Ready for Exec Review',
            exec_review: 'In Executive Review',
            roadmap_finalized: 'Finalized'
        };
        return labels[state] || state;
    };

    const getStateColor = (state: string) => {
        const colors: Record<string, string> = {
            intake_open: 'bg-slate-800 text-slate-400',
            diagnostic_ready: 'bg-blue-900/30 text-blue-400',
            diagnostic_complete: 'bg-indigo-900/30 text-indigo-400',
            delegate_ready: 'bg-amber-900/30 text-amber-500',
            exec_review: 'bg-purple-900/30 text-purple-400',
            roadmap_finalized: 'bg-green-900/30 text-green-500'
        };
        return colors[state] || 'bg-slate-900 text-slate-500';
    };

    return (
        <div
            onClick={() => onFocus(tenant)}
            className={`group px-8 py-8 border-b border-slate-900/50 transition-all cursor-pointer flex items-center gap-6 ${isFocused ? 'bg-indigo-500/5 border-l-4 border-l-indigo-500' : 'hover:bg-slate-900/30 border-l-4 border-l-transparent'
                }`}
        >
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <input
                    type="checkbox"
                    className="w-4 h-4 rounded-md bg-slate-900 border-slate-800 text-indigo-600 focus:ring-indigo-500/20"
                    checked={isSelected}
                    onChange={() => onSelect(tenant.id)}
                />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-black text-white truncate tracking-tight">
                        {tenant.name}
                    </h3>
                    <div className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${getStateColor(tenant.onboardingState)}`}>
                        {getOnboardingStateLabel(tenant.onboardingState)}
                    </div>
                </div>

                <div className="flex items-center gap-3 text-[10px] text-slate-600 font-bold uppercase tracking-widest mb-3">
                    <span>{tenant.owner?.name || 'No Owner'}</span>
                    <span className="w-1 h-1 bg-slate-800 rounded-full"></span>
                    <span>{tenant.cohortLabel || 'No Cohort'}</span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex-1 h-0.5 bg-slate-900 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-1000 ease-out ${tenant.percentComplete === 100 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]'
                                }`}
                            style={{ width: `${tenant.percentComplete}%` }}
                        />
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 w-8 text-right">
                        {Math.round(tenant.percentComplete)}%
                    </span>
                </div>
            </div>

            <div className="flex flex-col items-center gap-2 ml-4 min-w-[80px]">
                <div className="flex items-center gap-3">
                    {/* Knowledge Base Icon */}
                    <svg
                        className={`w-3.5 h-3.5 ${tenant.readiness.knowledgeBaseReadyAt ? 'text-green-500 filter drop-shadow-[0_0_3px_rgba(34,197,94,0.6)]' : 'text-slate-800 opacity-40'}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                        <title>Knowledge Base</title>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>

                    {/* Role Validation Icon */}
                    <svg
                        className={`w-3.5 h-3.5 ${tenant.readiness.rolesValidatedAt ? 'text-blue-500 filter drop-shadow-[0_0_3px_rgba(59,130,246,0.6)]' : 'text-slate-800 opacity-40'}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                        <title>Role Validation</title>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>

                    {/* Executive Review Icon */}
                    <svg
                        className={`w-3.5 h-3.5 ${tenant.readiness.execReadyAt ? 'text-purple-500 filter drop-shadow-[0_0_3px_rgba(168,85,247,0.6)]' : 'text-slate-800 opacity-40'}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                        <title>Executive Review</title>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A3.323 3.323 0 0010.605 2.152a3.323 3.323 0 00-4.638 3.376 3.323 3.323 0 002.152 4.987 3.323 3.323 0 003.376 4.638 3.323 3.323 0 004.987-2.152 3.323 3.323 0 003.376-4.638 3.323 3.323 0 00-2.152-4.987zM5 2c0 .656-.126 1.283-.356 1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>

                <div className="h-4 flex items-center justify-center">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onExecute(tenant.id);
                        }}
                        className="text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-400 transition-all duration-200 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    >
                        Execute →
                    </button>
                </div>
            </div>
        </div>
    );
};
