import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface DiagnosticReviewModalProps {
    open: boolean;
    onClose: () => void;
    data: {
        status?: string;
        createdAt?: string;
        outputs?: {
            // New structure from backend
            overview?: any;
            aiOpportunities?: any;
            roadmapSkeleton?: any;
            discoveryQuestions?: any;
            // Legacy structure (fallback)
            sop01DiagnosticMarkdown?: string;
            sop01AiLeverageMarkdown?: string;
            sop01RoadmapSkeletonMarkdown?: string;
        };
    } | null;
    status?: string;
}

export function DiagnosticReviewModal({ open, onClose, data, status }: DiagnosticReviewModalProps) {
    const [activeTab, setActiveTab] = useState('overview');

    if (!open) return null;

    // Graceful degradation if no data
    if (!data || !data.outputs) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-5xl max-h-[80vh] flex flex-col">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                        <h2 className="text-lg font-bold text-slate-100">Diagnostic Outputs</h2>
                        <button
                            onClick={onClose}
                            className="text-slate-500 hover:text-slate-300 transition-colors text-2xl leading-none"
                        >
                            ×
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-6 py-12">
                        <div className="text-center text-slate-500">
                            No diagnostic payload found
                        </div>
                    </div>
                    <div className="flex items-center justify-end px-6 py-4 border-t border-slate-800 bg-slate-950/50">
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

    const displayStatus = status || data.status || 'GENERATED';


    const tabs = [
        {
            key: 'overview',
            title: 'Diagnostic Overview',
            content: data.outputs.overview || data.outputs.sop01DiagnosticMarkdown
        },
        {
            key: 'aiOpportunities',
            title: 'AI Leverage Opportunities',
            content: data.outputs.aiOpportunities || data.outputs.sop01AiLeverageMarkdown
        },
        {
            key: 'roadmapSkeleton',
            title: 'Roadmap Skeleton',
            content: data.outputs.roadmapSkeleton || data.outputs.sop01RoadmapSkeletonMarkdown
        },
        {
            key: 'discoveryQuestions',
            title: 'Discovery Questions',
            content: data.outputs.discoveryQuestions
        },
    ].filter(tab => tab.content);

    const activeTabData = tabs.find(tab => tab.key === activeTab) || tabs[0];

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto pt-16">
            <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-5xl h-[75vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-slate-100">Diagnostic Outputs</h2>
                        <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded bg-emerald-900/30 text-emerald-400 border border-emerald-700/50">
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
                                    {tab.title}
                                    {activeTab === tab.key && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-6 pb-12">
                    {tabs.length > 0 && activeTabData ? (
                        <div className="prose prose-invert prose-slate max-w-none">
                            {typeof activeTabData.content === 'string' ? (
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {activeTabData.content}
                                </ReactMarkdown>
                            ) : (
                                <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-mono bg-slate-950/50 p-4 rounded-lg border border-slate-800">
                                    {JSON.stringify(activeTabData.content, null, 2)}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-500">
                            No diagnostic outputs available
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/50">
                    <div className="text-xs text-slate-500">
                        {data.createdAt && (
                            <span>Generated {new Date(data.createdAt).toLocaleDateString()}</span>
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
