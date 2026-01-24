
import { FC } from 'react';

interface DiagnosticGenerationCardProps {
    onGenerate: () => void;
    isGenerating: boolean;
    disabled: boolean;
    disabledReason?: string;
}

export const DiagnosticGenerationCard: FC<DiagnosticGenerationCardProps> = ({ onGenerate, isGenerating, disabled, disabledReason }) => {
    return (
        <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-8 shadow-inner text-center">
            <h4 className="text-xs uppercase font-black tracking-widest text-slate-500 mb-6">
                Diagnostic Synthesis
            </h4>

            <div className="flex flex-col items-center gap-4">
                <button
                    onClick={onGenerate}
                    disabled={disabled || isGenerating}
                    className={`
                        group relative flex items-center gap-3 px-8 py-4 rounded-xl font-bold uppercase tracking-[0.2em] text-xs transition-all shadow-lg
                        ${disabled
                            ? 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/40 hover:scale-105 active:scale-95'
                        }
                    `}
                >
                    {isGenerating ? (
                        <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                            Synthesizing...
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                            Generate SOP-01
                        </>
                    )}
                </button>

                {disabled && disabledReason && (
                    <div className="flex items-center gap-2 text-[10px] text-amber-500 font-mono bg-amber-900/10 px-3 py-1.5 rounded border border-amber-900/20">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>BLOCKED: {disabledReason}</span>
                    </div>
                )}
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-slate-900/50 pt-6">
                <Metric label="Inputs" value="Intakes" />
                <Metric label="Constraint" value="Brief" />
                <Metric label="Output" value="Diagnosis" />
            </div>
        </div>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="text-[9px] text-slate-600 uppercase tracking-wider mb-1">{label}</div>
            <div className="text-[10px] text-slate-400 font-bold">{value}</div>
        </div>
    );
}
