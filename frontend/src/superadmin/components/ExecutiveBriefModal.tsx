import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ExecutiveBriefModalProps {
    open: boolean;
    onClose: () => void;
    data: {
        status?: string;
        synthesis?: {
            executiveSummary?: string;
            operatingReality?: string;
            constraintLandscape?: string;
            blindSpotRisks?: string;
            alignmentSignals?: string;
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
}

export function ExecutiveBriefModal({
    open,
    onClose,
    data,
    status,
    onApprove,
    isApproving,
    tenantId,
    onDeliver,
    isDelivering,
    hasPdf,
    onGeneratePdf
}: ExecutiveBriefModalProps) {
    const [activeTab, setActiveTab] = useState('executiveSummary');

    if (!open || !data) return null;

    const displayStatus = status || data.status || 'DRAFT';

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
    const tabs = [
        { key: 'executiveSummary', label: 'Executive Summary', content: EXECUTIVE_SUMMARY_TEXT },
        { key: 'operatingReality', label: 'Operating Reality', content: data.synthesis?.operatingReality },
        { key: 'constraintLandscape', label: 'Constraint Landscape', content: data.synthesis?.constraintLandscape },
        { key: 'blindSpotRisks', label: 'Blind Spot Risks', content: data.synthesis?.blindSpotRisks },
        { key: 'alignmentSignals', label: 'Alignment Signals', content: data.synthesis?.alignmentSignals },
        { key: 'delivery', label: 'Delivery & Export', content: 'delivery' }, // Special key
    ].filter(tab => tab.key === 'delivery' || tab.content); // Always show delivery, others if content exists

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
                    {activeTab === 'delivery' ? (
                        <div className="space-y-8">
                            {!hasPdf && (
                                <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-8 text-center">
                                    <h3 className="text-white font-bold text-lg mb-2">Generate PDF Artifact</h3>
                                    <p className="text-slate-400 mb-6 max-w-lg mx-auto">
                                        You must generate the official Executive Brief PDF record before you can email or download it. This creates an immutable artifact.
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
                                                Generate PDF
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${!hasPdf ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
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
                                        className="mt-auto w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium text-sm transition-colors"
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
                                    <a
                                        href={hasPdf ? downloadUrl : '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`mt-auto w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-sm transition-colors inline-block ${!hasPdf ? 'pointer-events-none opacity-50' : ''}`}
                                    >
                                        Download
                                    </a>
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
                            <div className="prose prose-invert prose-slate max-w-none print:prose-black">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {activeTabData.content}
                                </ReactMarkdown>
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
                        {data.approvedAt && (
                            <span>Approved {new Date(data.approvedAt).toLocaleDateString()}</span>
                        )}
                        {data.createdAt && !data.approvedAt && (
                            <span>Created {new Date(data.createdAt).toLocaleDateString()}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
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
