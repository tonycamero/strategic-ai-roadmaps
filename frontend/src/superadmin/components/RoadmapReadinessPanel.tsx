import { useState } from 'react';

interface RoadmapReadinessPanelProps {
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
    roadmapStatus: string | null;
    onFinalize: () => Promise<void>;
    isGenerating: boolean;
}

export function RoadmapReadinessPanel({
    intakeWindowState,
    briefStatus,
    moderationStatus,
    readinessFlags,
    roadmapStatus,
    onFinalize,
    isGenerating
}: RoadmapReadinessPanelProps) {
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
            <div className="bg-slate-950 border border-emerald-900/40 rounded-xl p-5 shadow-sm h-full flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <svg className="w-24 h-24 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                </div>

                <h4 className="text-[10px] tracking-widest text-emerald-500/80 font-inter font-extrabold mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Roadmap Executed
                </h4>

                <div className="flex-1 flex flex-col justify-center items-center text-center space-y-4 z-10">
                    <div className="w-16 h-16 rounded-full bg-emerald-900/20 flex items-center justify-center border border-emerald-500/30 text-emerald-400">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <div className="text-emerald-400 font-bold text-sm">Strategic Context Locked</div>
                        <div className="text-slate-500 text-xs mt-1 max-w-[200px]">
                            This roadmap has been finalized and is now ready for execution distribution.
                        </div>
                    </div>
                </div>

                <div className="mt-6 z-10">
                    <div className="w-full py-3 bg-slate-900/50 border border-slate-800 rounded-lg text-slate-500 text-xs font-mono text-center flex items-center justify-center gap-2">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        READ-ONLY MODE
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-950 border border-slate-900 rounded-xl p-5 shadow-sm hover:border-slate-800 transition-colors h-full flex flex-col">
            <h4 className="text-[10px] uppercase tracking-widest text-slate-600 font-inter font-extrabold mb-4">
                EXECUTION AUTHORITY
            </h4>

            <div className="flex-1 space-y-6">
                {/* Readiness Checklist */}
                <div className="space-y-3">
                    <GateCheck
                        label="Intake Window Closed"
                        isReady={isIntakeReady}
                        detail={isIntakeReady ? 'Snapshot Locked' : 'Window Open'}
                    />
                    <GateCheck
                        label="Executive Brief Resolved"
                        isReady={isBriefReady}
                        detail={briefStatus || 'PENDING'}
                    />
                    <GateCheck
                        label="Ticket Moderation Complete"
                        isReady={isModerationReady}
                        detail={isModerationReady
                            ? `${approvedCount} Approved`
                            : `${pendingCount} Pending`}
                    />
                    <GateCheck
                        label="Knowledge Base Ready"
                        isReady={isKBReady}
                        detail={isKBReady ? 'READY' : 'PENDING'}
                    />
                    <GateCheck
                        label="Team Roles Validated"
                        isReady={isRolesReady}
                        detail={isRolesReady ? 'VALIDATED' : 'PENDING'}
                    />
                    <GateCheck
                        label="Authority Overide Ready"
                        isReady={isExecReady}
                        detail={isExecReady ? 'SIGNALED' : 'PENDING'}
                    />
                </div>

                {/* Status Summary */}
                <div className={`p-4 rounded-lg border flex items-center gap-3 ${isReady
                    ? 'bg-emerald-900/10 border-emerald-900/30'
                    : 'bg-slate-900/50 border-slate-800'
                    }`}>
                    <div className={`w-2 h-2 rounded-full ${isReady ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                    <div>
                        <div className={`text-xs font-bold ${isReady ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {isReady ? 'READY FOR EXECUTION' : 'EXECUTION BLOCKED'}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                            {isReady
                                ? 'All gates passed. Authority grant available.'
                                : 'Complete all gates to enable finalization.'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Button */}
            <div className="mt-6">
                {!showConfirm ? (
                    <button
                        onClick={handleClick}
                        disabled={!isReady || isGenerating}
                        className={`w-full py-3 text-xs font-bold rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-wider ${isReady && !isGenerating
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20'
                            : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                            }`}
                    >
                        {isGenerating ? 'Processing...' : 'Execute Final Roadmap'}
                    </button>
                ) : (
                    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="p-3 bg-indigo-900/20 border border-indigo-500/30 rounded text-center">
                            <div className="text-indigo-300 font-bold text-xs mb-1">Confirm Finalization?</div>
                            <div className="text-[10px] text-indigo-400/70">
                                This will lock the roadmap and notify stakeholders.
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function GateCheck({ label, isReady, detail }: { label: string; isReady: boolean; detail: string }) {
    return (
        <div className="flex items-center justify-between group">
            <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${isReady ? 'bg-emerald-500 text-emerald-950' : 'bg-slate-800 text-slate-600'
                    }`}>
                    {isReady ? (
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 130l4 4L19 7" />
                            {/* Simple checkmark */}
                            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                        </svg>
                    ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-current" />
                    )}
                </div>
                <span className={`text-xs transition-colors ${isReady ? 'text-slate-300' : 'text-slate-500'}`}>
                    {label}
                </span>
            </div>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${isReady
                ? 'bg-emerald-900/10 border-emerald-900/30 text-emerald-500/80'
                : 'bg-slate-800 border-slate-700 text-slate-500'
                }`}>
                {detail}
            </span>
        </div>
    );
}
