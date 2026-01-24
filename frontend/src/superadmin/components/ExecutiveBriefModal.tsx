import React, { useState } from 'react';
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
}

export function ExecutiveBriefModal({ open, onClose, data, status }: ExecutiveBriefModalProps) {
    const [activeTab, setActiveTab] = useState('executiveSummary');

    if (!open || !data) return null;

    const displayStatus = status || data.status || 'DRAFT';

    // Define tabs from synthesis sections
    const tabs = [
        { key: 'executiveSummary', label: 'Executive Summary', content: data.synthesis?.executiveSummary },
        { key: 'operatingReality', label: 'Operating Reality', content: data.synthesis?.operatingReality },
        { key: 'constraintLandscape', label: 'Constraint Landscape', content: data.synthesis?.constraintLandscape },
        { key: 'blindSpotRisks', label: 'Blind Spot Risks', content: data.synthesis?.blindSpotRisks },
        { key: 'alignmentSignals', label: 'Alignment Signals', content: data.synthesis?.alignmentSignals },
    ].filter(tab => tab.content); // Only show tabs with content

    const activeTabData = tabs.find(tab => tab.key === activeTab) || tabs[0];

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto pt-16">
            <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-4xl h-[75vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-slate-100">Executive Brief</h2>
                        <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${displayStatus === 'APPROVED'
                            ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-700/50'
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
                    {tabs.length > 0 && activeTabData ? (
                        <div className="prose prose-invert prose-slate max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {activeTabData.content}
                            </ReactMarkdown>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-500">
                            No brief content available
                        </div>
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
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors text-sm font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
