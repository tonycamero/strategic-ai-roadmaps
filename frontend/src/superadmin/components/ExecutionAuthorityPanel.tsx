import React, { useState } from 'react';
import { AuthorityCategory } from '@roadmap/shared';
import { useSuperAdminAuthority } from '../../hooks/useSuperAdminAuthority';

interface ExecutionAuthorityPanelProps {
    tenantId: string;
    intakeWindowState: 'OPEN' | 'CLOSED';
    briefStatus: string | null;
    moderationStatus: {
        readyForRoadmap: boolean;
        pending: number;
        approved: number;
    } | null;
    readinessFlags: {
        knowledgeBaseReady: boolean;
        rolesValidated: boolean;
        execReady: boolean;
    };
    timestamps: {
        knowledgeBaseReadyAt?: string | null;
        rolesValidatedAt?: string | null;
        execReadyAt?: string | null;
    };
    roadmapStatus: string | null;
    onFinalize: () => Promise<void>;
    onSignal: (flag: string, value: boolean) => Promise<void>;
    isGenerating: boolean;
}

export function ExecutionAuthorityPanel({
    tenantId,
    intakeWindowState,
    briefStatus,
    moderationStatus,
    readinessFlags,
    timestamps,
    roadmapStatus,
    onFinalize,
    onSignal,
    isGenerating
}: ExecutionAuthorityPanelProps) {
    const { category } = useSuperAdminAuthority();
    const isExecutive = category === AuthorityCategory.EXECUTIVE;
    const [showConfirm, setShowConfirm] = useState(false);

    // Gate 1: Intake Window
    const isIntakeReady = intakeWindowState === 'CLOSED';

    // Gate 2: Executive Brief
    const isBriefReady = ['ACKNOWLEDGED', 'WAIVED'].includes(briefStatus || '');

    // Gate 3: Moderation
    const isModerationReady = moderationStatus?.readyForRoadmap || false;
    const pendingCount = moderationStatus?.pending || 0;
    const approvedCount = moderationStatus?.approved || 0;

    // Gate 4: Knowledge Base
    const isKBReady = readinessFlags.knowledgeBaseReady;

    // Gate 5: Roles Validated
    const isRolesReady = readinessFlags.rolesValidated;

    // Gate 6: Executive Ready
    const isExecReady = readinessFlags.execReady;

    // Overall Readiness
    const isReady = isIntakeReady && isBriefReady && isModerationReady && isKBReady && isRolesReady && isExecReady;

    const handleClick = () => {
        if (isReady) {
            setShowConfirm(true);
        }
    };

    const handleConfirm = async () => {
        setShowConfirm(false);
        await onFinalize();
    };

    if (roadmapStatus === 'FINALIZED') {
        return (
            <div className="bg-slate-950 border border-emerald-900/40 rounded-xl p-6 shadow-sm h-full flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <svg className="w-32 h-32 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                </div>

                <h4 className="text-xs tracking-widest text-emerald-500/80 font-inter font-extrabold mb-8 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    ROADMAP FINALIZED
                </h4>

                <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6 z-10">
                    <div className="w-20 h-20 rounded-full bg-emerald-900/20 flex items-center justify-center border border-emerald-500/30 text-emerald-400 shadow-2xl shadow-emerald-900/40">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <div className="text-emerald-400 font-bold text-lg">Execution Authorized</div>
                        <div className="text-slate-500 text-sm mt-2 max-w-[240px] leading-relaxed">
                            This roadmap is locked and ready for distribution.
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-950 border border-slate-900 rounded-xl p-6 shadow-sm hover:border-slate-800 transition-colors h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <h4 className="text-xs uppercase tracking-widest text-slate-500 font-inter font-extrabold">
                    EXECUTION AUTHORITY
                </h4>
                <div className={`w-2 h-2 rounded-full ${isReady ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-slate-800'}`} />
            </div>

            <div className="flex-1 space-y-4">
                {/* Readiness Checklist */}
                {/* 1. Intake Window */}
                <GateRow
                    label="Intake Window"
                    status={isIntakeReady ? 'CLOSED' : 'OPEN'}
                    isReady={isIntakeReady}
                    actionLabel={isIntakeReady ? 'Locked' : 'Close Window'}
                    onAction={() => { }} // This is handled separately usually, but for now just visual. Or we could pass a handler.
                    actionDisabled={true} // Intentionally strictly managed
                />

                {/* 2. Executive Brief */}
                <GateRow
                    label="Executive Brief"
                    status={briefStatus || 'PENDING'}
                    isReady={isBriefReady}
                    actionLabel="Review"
                    // Deep link logic could go here
                    actionDisabled={true}
                />

                {/* 3. Ticket Moderation */}
                <GateRow
                    label="Ticket Moderation"
                    status={isModerationReady ? 'COMPLETE' : `${pendingCount} PENDING`}
                    isReady={isModerationReady}
                    actionLabel="Moderate"
                    actionDisabled={true} // Handled in moderation panel
                />

                <div className="h-px bg-slate-900/50 my-4" />

                {/* 4. Knowledge Base (Interactive) */}
                <GateRow
                    label="Knowledge Base"
                    status={isKBReady ? 'READY' : 'PENDING'}
                    isReady={isKBReady}
                    actionLabel={isKBReady ? 'Clear' : 'Mark Ready'}
                    onAction={() => onSignal('knowledge_base_ready', !isKBReady)}
                    actionDisabled={false}
                />

                {/* 5. Team Roles (Interactive) */}
                <GateRow
                    label="Team Roles"
                    status={isRolesReady ? 'VALIDATED' : 'PENDING'}
                    isReady={isRolesReady}
                    actionLabel={isRolesReady ? 'Clear' : 'Validate'}
                    onAction={() => onSignal('roles_validated', !isRolesReady)}
                    actionDisabled={false}
                />

                {/* 6. Execution Authority (Interactive - High Stakes) */}
                <GateRow
                    label="Authority Signal"
                    status={isExecReady ? 'GRANTED' : 'WAITING'}
                    isReady={isExecReady}
                    actionLabel={isExecReady ? 'Revoke' : 'Grant'}
                    onAction={() => onSignal('exec_ready', !isExecReady)}
                    actionDisabled={!isExecutive} // Only Exec can toggle
                    highlight={true}
                />
            </div>

            {/* Action Button */}
            <div className="mt-8 pt-6 border-t border-slate-900/50">
                {!showConfirm ? (
                    <button
                        onClick={handleClick}
                        disabled={!isReady || isGenerating}
                        className={`w-full py-4 text-xs font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em] transform active:scale-95 ${isReady && !isGenerating
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20'
                            : 'bg-slate-900 text-slate-700 cursor-not-allowed border border-slate-800'
                            }`}
                    >
                        {isGenerating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Execute Final Roadmap
                            </>
                        )}
                    </button>
                ) : (
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200 bg-slate-900/30 p-4 rounded-xl border border-indigo-500/20">
                        <div className="text-center mb-2">
                            <div className="text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">Confirm Execution?</div>
                            <div className="text-[10px] text-slate-500 leading-tight">
                                This action is irreversible. The roadmap will be locked and distributed.
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider shadow-lg shadow-indigo-900/20 transition-colors"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                )}
            </div>
            {!isExecutive && (
                <div className="mt-4 text-[9px] text-slate-600 text-center font-mono">
                    Authority grant requires Executive privileges.
                </div>
            )}
        </div>
    );
}

function GateRow({
    label,
    status,
    isReady,
    actionLabel,
    onAction,
    actionDisabled,
    highlight = false
}: {
    label: string,
    status: string,
    isReady: boolean,
    actionLabel: string,
    onAction?: () => void,
    actionDisabled: boolean,
    highlight?: boolean
}) {
    return (
        <div className={`flex items-center justify-between group p-3 rounded-lg transition-colors ${isReady ? 'bg-emerald-900/5' : highlight ? 'bg-indigo-900/5' : 'hover:bg-slate-900/30'
            }`}>
            <div className="flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full shadow-sm ${isReady ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-slate-700'
                    }`} />
                <div>
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${isReady ? 'text-slate-300' : 'text-slate-500'
                        }`}>
                        {label}
                    </div>
                    <div className={`text-[9px] font-mono mt-0.5 ${isReady ? 'text-emerald-500/80' : 'text-slate-600'
                        }`}>
                        {status}
                    </div>
                </div>
            </div>
            {onAction && (
                <button
                    onClick={onAction}
                    disabled={actionDisabled}
                    className={`px-3 py-1.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all ${actionDisabled
                            ? 'text-slate-700 cursor-not-allowed'
                            : isReady
                                ? 'bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-red-900/10'
                                : highlight
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-900/20'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
}
