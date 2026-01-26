


import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface DiagnosticReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    diagnosticData: any; // Using simplified type for speed, should be DiagnosticRecord
    onAcknowledge: () => void;
    isAcknowledging: boolean;
    isDiscoveryAcknowledged: boolean;
    canAcknowledge: boolean;
}

export function DiagnosticReviewModal({
    isOpen,
    onClose,
    diagnosticData,
    onAcknowledge,
    isAcknowledging,
    isDiscoveryAcknowledged,
    canAcknowledge
}: DiagnosticReviewModalProps) {
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'AI_OPS' | 'ROADMAP' | 'QUESTIONS'>('OVERVIEW');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-6xl h-[85vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-900 bg-slate-900/50">
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                            PROTOCOL STEP 2
                        </div>
                        <h2 className="text-xl font-bold text-white tracking-tight">
                            Diagnostic Artifact Review
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex px-8 border-b border-slate-900 bg-slate-950">
                    <TabButton
                        active={activeTab === 'OVERVIEW'}
                        onClick={() => setActiveTab('OVERVIEW')}
                        label="Situation Overview"
                    />
                    <TabButton
                        active={activeTab === 'AI_OPS'}
                        onClick={() => setActiveTab('AI_OPS')}
                        label="AI Opportunity Zones"
                    />
                    <TabButton
                        active={activeTab === 'ROADMAP'}
                        onClick={() => setActiveTab('ROADMAP')}
                        label="Roadmap Skeleton"
                    />
                    <TabButton
                        active={activeTab === 'QUESTIONS'}
                        onClick={() => setActiveTab('QUESTIONS')}
                        label="Discovery Questions"
                    />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-950/50">
                    {activeTab === 'OVERVIEW' && (
                        <div className="max-w-4xl mx-auto">
                            {diagnosticData?.overview?.originalMarkdown ? (
                                <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed">
                                    <ReactMarkdown>
                                        {diagnosticData.overview.originalMarkdown}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                <div className="text-center text-slate-500 py-12">
                                    No situation overview available
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'AI_OPS' && (
                        <div className="max-w-4xl mx-auto">
                            {diagnosticData?.aiOpportunities?.originalMarkdown ? (
                                <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed">
                                    <ReactMarkdown>
                                        {diagnosticData.aiOpportunities.originalMarkdown}
                                    </ReactMarkdown>
                                </div>
                            ) : diagnosticData?.aiOpportunities?.zones?.length > 0 ? (
                                <div className="grid gap-4">
                                    {diagnosticData.aiOpportunities.zones.map((opp: any, i: number) => (
                                        <div key={i} className="bg-indigo-950/20 border border-indigo-500/30 p-6 rounded-xl hover:border-indigo-500/50 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-indigo-300 text-lg">{opp.zone}</h3>
                                                <span className="text-xs font-bold bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded uppercase tracking-wider">{opp.estimatedImpact}</span>
                                            </div>
                                            <p className="text-slate-400 text-sm">{opp.aiCapability}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-slate-500 py-12">
                                    No AI opportunities available
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'ROADMAP' && (
                        <div className="max-w-4xl mx-auto">
                            {diagnosticData?.roadmapSkeleton?.originalMarkdown ? (
                                <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed">
                                    <ReactMarkdown>
                                        {diagnosticData.roadmapSkeleton.originalMarkdown}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                <div className="text-center text-slate-500 py-12">
                                    No roadmap skeleton available
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'QUESTIONS' && (
                        <div className="max-w-4xl mx-auto">
                            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-6 mb-8">
                                <h4 className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-widest text-xs mb-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Discovery Protocol
                                </h4>
                                <div className="text-sm text-emerald-200/80">
                                    These questions must be addressed live with the client during the Discovery Call. Do not generate the Roadmap until these are answered and synthesized.
                                </div>
                            </div>

                            {diagnosticData?.discoveryQuestions?.questions ? (
                                <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed">
                                    <ReactMarkdown>
                                        {diagnosticData.discoveryQuestions.questions}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                <div className="text-center text-slate-500 py-12">
                                    No discovery questions available
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Action Footer */}
                <div className="p-6 border-t border-slate-900 bg-slate-950 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        {isDiscoveryAcknowledged ? (
                            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-950/30 px-4 py-2 rounded-lg border border-emerald-500/30">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                <span className="text-xs font-bold uppercase tracking-widest">Discovery Acknowledged</span>
                            </div>
                        ) : (
                            <div className="text-xs text-slate-500 font-mono">
                                REVIEW REQUIRED FOR DISCOVERY
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-widest transition-colors"
                        >
                            Close Review
                        </button>
                        {!isDiscoveryAcknowledged && canAcknowledge && (
                            <button
                                onClick={onAcknowledge}
                                disabled={isAcknowledging}
                                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-widest shadow-lg shadow-emerald-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isAcknowledging ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                                        Acknowledging...
                                    </>
                                ) : (
                                    'Acknowledge Discovery Complete'
                                )}
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

function TabButton({ active, label, onClick, badge }: { active: boolean, label: string, onClick: () => void, badge?: number }) {
    return (
        <button
            onClick={onClick}
            className={`
                relative px-6 py-5 text-[11px] font-bold uppercase tracking-widest transition-all
                ${active ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}
            `}
        >
            {label}
            {badge ? <span className="ml-2 px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[9px]">{badge}</span> : null}
            {active && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_-2px_8px_rgba(99,102,241,0.5)]"></span>
            )}
        </button>
    )
}
