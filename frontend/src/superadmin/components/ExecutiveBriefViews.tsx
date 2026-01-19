import React from 'react';
import {
    renderOrientation,
    renderMetadata,
    renderClosing,
    mapSynthesisToSections,
    projectSections,
    NarrativeSection,
    ExecutiveBriefSection
} from '../renderers/mapBriefToPrivateNarrative';

export function PrivateLeadershipBriefView({ synthesis, signals, verification }: {
    synthesis: any;
    signals: any;
    verification: any;
}) {
    const rawSections = mapSynthesisToSections(synthesis, signals);
    const sections = projectSections(rawSections, 'PRIVATE');

    return (
        <div className="max-w-4xl mx-auto p-12 bg-white/[0.02] border-x border-slate-800/40 space-y-16">
            {/* 1. Orientation */}
            {renderOrientation()}

            {/* 2. Metadata */}
            {renderMetadata(signals, verification)}

            <div className="w-12 h-px bg-slate-800/60 mx-auto" />

            {/* Canonical Sections */}
            {sections.map((section: ExecutiveBriefSection, idx: number) => (
                <React.Fragment key={section.id}>
                    <NarrativeSection section={section} view="PRIVATE" />
                    {idx < sections.length - 1 && <div className="w-full h-px bg-slate-800/30" />}
                </React.Fragment>
            ))}

            <div className="w-12 h-px bg-slate-800/60 mx-auto" />

            {/* 10. End of Private Brief */}
            {renderClosing()}
        </div>
    );
}

// System Executive Brief View Component  
export function SystemExecutiveBriefView({ synthesis, signals, verification, onApprove, onRequestVerification, actionLoading }: {
    synthesis: any;
    signals: any;
    verification: any;
    onApprove: () => void;
    onRequestVerification: () => void;
    actionLoading: boolean;
}) {
    const rawSections = mapSynthesisToSections(synthesis, signals);
    const sections = projectSections(rawSections, 'SYSTEM');

    return (
        <>
            {/* Verification Request Loop */}
            {verification.required && (
                <div className="mx-6 mt-6 p-4 bg-amber-950/30 border border-amber-500/30 rounded-lg flex items-center justify-between">
                    <div className="flex items-start gap-3">
                        <div className="w-5 h-5 mt-0.5 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/50">
                            <span className="text-amber-500 text-xs font-bold">!</span>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wide">Verification Requested</h4>
                            <p className="text-xs text-amber-200/80 mt-1 max-w-md">
                                Missing Signals: {verification.missingSignals?.map((s: string) => s.replace('_', ' ')).join(', ')}.
                                These areas require consultant clarification before diagnostic generation.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onRequestVerification}
                        className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/50 text-amber-400 text-xs font-bold rounded transition-colors uppercase tracking-wider whitespace-nowrap"
                    >
                        Request Consultant Clarification
                    </button>
                </div>
            )}

            {/* Signals */}
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/20">
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Constraint Consensus</div>
                        <div className={`text-sm font-bold ${signals.constraintConsensusLevel === 'HIGH' ? 'text-green-400' :
                            signals.constraintConsensusLevel === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                            {signals.constraintConsensusLevel || 'N/A'}
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Execution Risk</div>
                        <div className={`text-sm font-bold ${signals.executionRiskLevel === 'LOW' ? 'text-green-400' :
                            signals.executionRiskLevel === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                            {signals.executionRiskLevel || 'N/A'}
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Org Clarity Score</div>
                        <div className="text-sm font-bold text-blue-400">
                            {signals.orgClarityScore !== undefined ? `${signals.orgClarityScore}/100` : 'N/A'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Synthesis Sections */}
            <div className="p-6 space-y-16">
                {sections.map((section: ExecutiveBriefSection, idx: number) => (
                    <React.Fragment key={section.id}>
                        <NarrativeSection section={section} view="SYSTEM" />
                        {idx < sections.length - 1 && <div className="h-px bg-slate-800/30" />}
                    </React.Fragment>
                ))}

                {/* Approve Action */}
                <div className="pt-4 border-t border-slate-800">
                    <button
                        onClick={onApprove}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors"
                    >
                        {actionLoading ? 'Approving...' : 'Approve & Close Intake'}
                    </button>
                    <p className="text-xs text-slate-500 mt-2">
                        Approval will permanently close the intake window. This action cannot be undone.
                    </p>
                </div>
            </div>
        </>
    );
}

// Approved System View Component (Read-Only)
export function ApprovedSystemView({ synthesis, signals }: {
    synthesis: any;
    signals: any;
}) {
    const rawSections = mapSynthesisToSections(synthesis, signals);
    const sections = projectSections(rawSections, 'SYSTEM');

    return (
        <>
            {/* Signals */}
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/20">
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Constraint Consensus</div>
                        <div className={`text-sm font-bold ${signals.constraintConsensusLevel === 'HIGH' ? 'text-green-400' :
                            signals.constraintConsensusLevel === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                            {signals.constraintConsensusLevel || 'N/A'}
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Execution Risk</div>
                        <div className={`text-sm font-bold ${signals.executionRiskLevel === 'LOW' ? 'text-green-400' :
                            signals.executionRiskLevel === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                            {signals.executionRiskLevel || 'N/A'}
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Org Clarity Score</div>
                        <div className="text-sm font-bold text-blue-400">
                            {signals.orgClarityScore !== undefined ? `${signals.orgClarityScore}/100` : 'N/A'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Synthesis Sections (Read-Only) */}
            <div className="p-6 space-y-16">
                {sections.map((section: ExecutiveBriefSection, idx: number) => (
                    <React.Fragment key={section.id}>
                        <NarrativeSection section={section} view="SYSTEM" />
                        {idx < sections.length - 1 && <div className="h-px bg-slate-800/30" />}
                    </React.Fragment>
                ))}
            </div>
        </>
    );
}


