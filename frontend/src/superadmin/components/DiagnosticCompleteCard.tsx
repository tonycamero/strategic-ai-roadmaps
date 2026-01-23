import React from 'react';

interface DiagnosticCompleteCardProps {
    status: string;
    onReview: () => void;
}

export const DiagnosticCompleteCard: React.FC<DiagnosticCompleteCardProps> = ({ status, onReview }) => {
    return (
        <div className="bg-slate-900 border border-emerald-500/20 rounded-xl p-6 flex items-center justify-between shadow-lg shadow-emerald-900/5">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-900/20 border border-emerald-500/30 flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-sm font-bold text-slate-200">Diagnostic</h3>
                        <span className="px-2 py-0.5 bg-emerald-900/30 border border-emerald-500/40 rounded text-[10px] uppercase font-bold text-emerald-400 tracking-widest">
                            {status.replace(/_/g, ' ')}
                        </span>
                    </div>
                    <p className="text-xs text-slate-500">Outputs available. Review in modal.</p>
                </div>
            </div>
            <button
                onClick={onReview}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-lg transition-colors border border-slate-700"
            >
                Review Diagnostic
            </button>
        </div>
    );
};
