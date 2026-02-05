import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ExecutiveBriefModalProps {
    open: boolean;
    onClose: () => void;
    loading?: boolean;
    data: {
        status?: string;
        synthesis?: {
            executiveSummary?: string;
            operatingReality?: string;
            constraintLandscape?: string;
            blindSpotRisks?: string;
            alignmentSignals?: string;
            content?: {

                executiveSummary?: string | null;
                operatingReality?: string | null;
                constraintLandscape?: string | null;
                blindSpotRisks?: string | null;
                alignmentSignals?: string | null;
                mirrorSummary?: string | null;
                mirrorSections?: Record<
                string, 
                {
                     livedReality: string; 
                     costOfStatusQuo: string; 
                     theCall: string;
                     }
                     >;
            };
            meta?: {
                expansion?: {
                    invoked: boolean;
                    acceptedCount: number;
                };
                signalQuality: {
                    status: 'SUFFICIENT' | 'LOW_SIGNAL';
                };
                sectionCoverage?: Record<string, { count: number; usedFallback: boolean }>;
            };
            strategicSignalSummary?: string;
        };
        createdAt?: string;
        approvedAt?: string;
    } | null;
    status?: string;
    onApprove?: () => void;
    isApproving?: boolean;
    tenantId: string;
    onDeliver?: () => void;
    isDelivering?: boolean;
    hasPdf?: boolean;
    onGeneratePdf?: () => void;
    audit?: {
        deliveredAt: string;
        deliveredByRole?: string | null;
        meta?: any;
    };
    onDownload?: () => void;
    error?: string | null;
    onRegenerate?: () => void;
    isRegenerating?: boolean;
}

export function ExecutiveBriefModal({
    open,
    onClose,
    loading,
    data,
    status,
    onApprove,
    isApproving,
    tenantId,
    onDeliver,
    isDelivering,
    hasPdf,
    onGeneratePdf,
    audit,
    onDownload,
    error,
    onRegenerate,
    isRegenerating
}: ExecutiveBriefModalProps) {
    const [activeTab, setActiveTab] = useState('executiveSummary');
    const [layer, setLayer] = useState<'facts' | 'mirror'>('facts');

    if (!open) return null;

    const displayStatus = status || data?.status || 'DRAFT';
    const isDelivered = displayStatus === 'DELIVERED';

    // Static orientation text for Executive Summary
    const EXECUTIVE_SUMMARY_TEXT = `
This briefing captures unfiltered operational perspectives from across your leadership team before any strategic recommendations are made. Each section reflects how different roles experience constraints, friction, and risk in day-to-day operations.

No synthesis, prioritization, or reframing has been applied yet. The purpose of this stage is alignment — surfacing where perspectives converge, diverge, or reveal hidden system stress that may not be visible from a single role.

**These inputs will be used to:**

* Identify root operational bottlenecks vs. perceived problems
* Quantify revenue and time leakage tied to workflow breakdowns
* Anchor the Strategic AI Roadmap in lived reality, not assumptions

*What follows is not a diagnosis or a solution — it is the factual substrate from which both will be derived.*
`;

    // Define tabs
    const synthesis = data?.synthesis;
    const content = synthesis?.content;

    const tabs = [
        {
            key: 'executiveSummary',
            label: 'Executive Summary',
            content: layer === 'mirror'
                ? (content?.mirrorSections?.EXEC_SUMMARY?.livedReality || content?.mirrorSummary || 'Mirror Summary pending...')
                : (content?.executiveSummary || synthesis?.executiveSummary || synthesis?.strategicSignalSummary || EXECUTIVE_SUMMARY_TEXT)
        },
        {
            key: 'operatingReality',
            label: 'Operating Reality',
            content: layer === 'mirror'
                ? ([content?.mirrorSections?.OPERATING_REALITY?.livedReality, content?.mirrorSections?.OPERATING_REALITY?.costOfStatusQuo, content?.mirrorSections?.OPERATING_REALITY?.theCall].filter(Boolean).join('\n\n') || 'Mirror narrative pending...')

                : (content?.operatingReality ?? '')

                : content?.operatingReality
        },
        {
            key: 'constraintLandscape',
            label: 'Constraint Landscape',
            content: layer === 'mirror'
                ? ([content?.mirrorSections?.CONSTRAINT_LANDSCAPE?.livedReality, content?.mirrorSections?.CONSTRAINT_LANDSCAPE?.costOfStatusQuo, content?.mirrorSections?.CONSTRAINT_LANDSCAPE?.theCall].filter(Boolean).join('\n\n') || 'Mirror narrative pending...')
<<<<<<< HEAD
                : (content?.constraintLandscape ?? '')
=======
                : content?.constraintLandscape
>>>>>>> a565a621ca618714539b3035fcfb826dad94c239
        },
        {
            key: 'blindSpotRisks',
            label: 'Blind Spot Risks',
            content: layer === 'mirror'
                ? ([content?.mirrorSections?.BLIND_SPOT_RISKS?.livedReality, content?.mirrorSections?.BLIND_SPOT_RISKS?.costOfStatusQuo, content?.mirrorSections?.BLIND_SPOT_RISKS?.theCall].filter(Boolean).join('\n\n') || 'Mirror narrative pending...')
<<<<<<< HEAD
                : (content?.blindSpotRisks ?? '')
=======
                : content?.blindSpotRisks
>>>>>>> a565a621ca618714539b3035fcfb826dad94c239
        },
        {
            key: 'alignmentSignals',
            label: 'Alignment Signals',
            content: layer === 'mirror'
                ? ([content?.mirrorSections?.ALIGNMENT_SIGNALS?.livedReality, content?.mirrorSections?.ALIGNMENT_SIGNALS?.costOfStatusQuo, content?.mirrorSections?.ALIGNMENT_SIGNALS?.theCall].filter(Boolean).join('\n\n') || 'Mirror narrative pending...')
<<<<<<< HEAD
                : (content?.alignmentSignals ?? '')
=======
                : content?.alignmentSignals
>>>>>>> a565a621ca618714539b3035fcfb826dad94c239
        },
        { key: 'delivery', label: 'Delivery & Export', content: 'delivery' },
    ];

    const activeTabData = tabs.find(tab => tab.key === activeTab) || tabs[0];
    const downloadUrl = `/api/superadmin/firms/${tenantId}/executive-brief/download`;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto pt-16">
            <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-4xl h-[75vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-slate-100">Executive Brief</h2>
                        <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${displayStatus === 'APPROVED'
                            ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-700/50'
                            : displayStatus === 'DELIVERED'
                                ? 'bg-purple-900/30 text-purple-400 border border-purple-700/50'
                                : displayStatus === 'ACKNOWLEDGED'
                                    ? 'bg-blue-900/30 text-blue-400 border border-blue-700/50'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}>
                            {displayStatus}
                        </span>
                    </div>

                    {/* Layer Toggle */}
                    {content?.mirrorSections && (
                        <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                            <button
                                onClick={() => setLayer('facts')}
                                className={`px-3 py-1 text-[10px] font-bold uppercase rounded transition-all ${layer === 'facts'
                                    ? 'bg-slate-600 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-slate-300'}`}
                            >
                                Facts
                            </button>
                            <button
                                onClick={() => setLayer('mirror')}
                                className={`px-3 py-1 text-[10px] font-bold uppercase rounded transition-all ${layer === 'mirror'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-slate-300'}`}
                            >
                                Mirror Narrative
                            </button>
                        </div>
                    )}

                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-300 transition-colors text-2xl leading-none"
                    >
                        ×
                    </button>
                </div>

                {/* Tabs Area */}
                <div className="flex-none bg-slate-900 border-b border-slate-800 relative z-20">
                    {tabs.length > 0 && (
                        <div className="flex gap-1 px-6 pt-4 overflow-x-auto scrollbar-hide">
                            {tabs.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-all relative ${activeTab === tab.key
                                        ? 'text-emerald-400'
                                        : 'text-slate-400 hover:text-slate-300'
                                        }`}
                                >
                                    {tab.label}
                                    {activeTab === tab.key && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                            <svg className="animate-spin h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="font-medium">Loading Executive Brief Data...</span>
                        </div>
                    ) : activeTab === 'executiveSummary' ? (
                        <div className="space-y-6">
                            {synthesis?.meta?.expansion?.invoked && (
                                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 flex items-start gap-3">
                                    <svg className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                        <div className="text-blue-300 font-bold text-sm">Mode 2 Expansion Applied</div>
                                        <div className="text-blue-400/70 text-xs">
                                            This brief was generated using assertion expansion to ensure sufficient signal density ({synthesis.meta.expansion.acceptedCount} candidates accepted).
                                        </div>
                                    </div>
                                </div>
                            )}
                            {!data && (
                                <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4 flex items-start gap-3">
                                    <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <div>
                                        <div className="text-amber-400 font-bold text-sm">Synthesis Layers Unavailable</div>
                                        <div className="text-amber-500/70 text-xs">
                                            {error || 'The detailed synthesis layers could not be retrieved. Only the high-level summary is available.'}
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="prose prose-invert prose-slate max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {EXECUTIVE_SUMMARY_TEXT}
                                </ReactMarkdown>

                                {(content?.executiveSummary || synthesis?.executiveSummary) && (
                                    <>
                                        <hr className="border-slate-800 my-8" />
                                        <div className="bg-slate-800/20 border-l-4 border-emerald-500/50 p-6 rounded-r-lg">
                                            <h4 className="text-emerald-400 font-bold text-sm uppercase tracking-wider mb-2">Synthesis Result</h4>
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {content?.executiveSummary || synthesis?.executiveSummary || ''}
                                            </ReactMarkdown>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : activeTab === 'delivery' ? (
                        <div className="space-y-8">
                            {audit && isDelivered && (
                                <div className="bg-emerald-900/10 border border-emerald-500/30 rounded-xl p-6 mb-8">
                                    <h3 className="text-emerald-400 font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Brief Delivered
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                                        <div>
                                            <div className="text-slate-500 text-xs uppercase font-bold mb-1">Delivered At</div>
                                            <div className="text-slate-200 font-mono">
                                                {new Date(audit.deliveredAt).toLocaleString()}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-slate-500 text-xs uppercase font-bold mb-1">Delivered By</div>
                                            <div className="text-slate-200 font-mono">
                                                {audit.deliveredByRole || 'System'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-slate-500 text-xs uppercase font-bold mb-1">Recipient</div>
                                            <div className="text-slate-200 font-mono">
                                                {audit.meta?.deliveredTo || 'Detailed distribution list'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!isDelivered && (
                                <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-8 text-center">
                                    <h3 className="text-white font-bold text-lg mb-2">
                                        {hasPdf ? 'Regenerate PDF Artifact' : 'Generate PDF Artifact'}
                                    </h3>
                                    <p className="text-slate-400 mb-6 max-w-lg mx-auto">
                                        {hasPdf
                                            ? 'Regenerate the PDF to reflect the latest synthesis changes. This will replace the existing PDF artifact.'
                                            : 'You must generate the official Executive Brief PDF record before you can email or download it. This creates an immutable artifact.'
                                        }
                                    </p>
                                    <button
                                        onClick={onGeneratePdf}
                                        disabled={isDelivering || !onGeneratePdf}
                                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-bold shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 mx-auto"
                                    >
                                        {isDelivering ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Generating PDF...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                {hasPdf ? 'Regenerate PDF' : 'Generate PDF'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Email Card */}
                                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 flex flex-col items-center text-center hover:bg-slate-800 transition-colors">
                                    <div className="w-12 h-12 bg-purple-900/20 text-purple-400 rounded-full flex items-center justify-center mb-4">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-slate-200 font-bold mb-2">Email to Tenant Lead</h3>
                                    <p className="text-xs text-slate-400 mb-6">
                                        Send the PDF directly to the primary stakeholder via email.
                                    </p>
                                    <button
                                        onClick={onDeliver}
                                        disabled={isDelivering || !onDeliver || !hasPdf}
                                        className={`mt-auto w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium text-sm transition-colors ${!hasPdf ? 'opacity-50 grayscale pointer-events-none' : ''}`}
                                    >
                                        {isDelivering ? 'Sending...' : 'Send Email'}
                                    </button>
                                </div>

                                {/* Download Card */}
                                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 flex flex-col items-center text-center hover:bg-slate-800 transition-colors">
                                    <div className="w-12 h-12 bg-blue-900/20 text-blue-400 rounded-full flex items-center justify-center mb-4">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                    </div>
                                    <h3 className="text-slate-200 font-bold mb-2">Download PDF</h3>
                                    <p className="text-xs text-slate-400 mb-6">
                                        Download the generated PDF file to your local machine.
                                    </p>
                                    <button
                                        onClick={onDownload}
                                        disabled={!onDownload}
                                        className="mt-auto w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium text-sm transition-colors"
                                    >
                                        Download
                                    </button>
                                </div>

                                {/* Print Card */}
                                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 flex flex-col items-center text-center hover:bg-slate-800 transition-colors pointer-events-auto filter-none">
                                    {/* Override grayscale for Print, it is always available */}
                                    <div className="w-12 h-12 bg-slate-700/30 text-slate-400 rounded-full flex items-center justify-center mb-4">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-slate-200 font-bold mb-2">Print Web View</h3>
                                    <p className="text-xs text-slate-400 mb-6">
                                        Open the browser print dialog for the current content (not the PDF).
                                    </p>
                                    <button
                                        onClick={() => window.print()}
                                        className="mt-auto w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-medium text-sm transition-colors"
                                    >
                                        Print
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        tabs.length > 0 && activeTabData ? (
                            <div className="space-y-6">
                                {synthesis?.meta?.sectionCoverage?.[activeTab]?.usedFallback && (
                                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 flex items-start gap-3">
                                        <svg className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div className="text-slate-400 text-xs italic">
                                            Limited signal: section rendered using safe fallback guidance.
                                        </div>
                                    </div>
                                )}
                                <div className="prose prose-invert prose-slate max-w-none print:prose-black">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {activeTabData.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-500">
                                No brief content available
                            </div>
                        )
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/50">
                    <div className="text-xs text-slate-500">
                        {data?.approvedAt && (
                            <span>Approved {new Date(data.approvedAt).toLocaleDateString()}</span>
                        )}
                        {data?.createdAt && !data?.approvedAt && (
                            <span>Created {new Date(data.createdAt).toLocaleDateString()}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {onRegenerate && (
                            <button
                                onClick={onRegenerate}
                                disabled={isRegenerating || isApproving || isDelivering}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg transition-all text-sm font-bold uppercase tracking-wider border border-slate-700 flex items-center gap-2"
                            >
                                {isRegenerating ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Regenerating...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Regenerate
                                    </>
                                )}
                            </button>
                        )}
                        {displayStatus === 'DRAFT' && onApprove && (
                            <button
                                onClick={onApprove}
                                disabled={isApproving}
                                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg transition-all text-sm font-bold uppercase tracking-wider shadow-lg shadow-emerald-900/20"
                            >
                                {isApproving ? 'Approving...' : 'Approve Brief'}
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors text-sm font-medium"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
