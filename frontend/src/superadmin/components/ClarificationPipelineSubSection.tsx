import { useState } from 'react';

interface Clarification {
    id: string;
    clarificationPrompt: string;
    clarificationResponse: string | null;
    status: 'requested' | 'responded';
    requestedAt: string;
    respondedAt: string | null;
    blocking: boolean;
    emailStatus: 'NOT_SENT' | 'SENT' | 'FAILED';
    emailError: string | null;
}

interface ClarificationPipelineSubSectionProps {
    questionId: string;
    originalResponse: string;
    existingClarifications: Clarification[];
    onRequestClarification: (prompt: string, blocking: boolean) => Promise<void>;
    onResendEmail: (clarificationId: string) => Promise<void>;
}

export function ClarificationPipelineSubSection({
    questionId,
    originalResponse,
    existingClarifications,
    onRequestClarification,
    onResendEmail
}: ClarificationPipelineSubSectionProps) {
    const [isDrafting, setIsDrafting] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [blocking, setBlocking] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!prompt.trim()) return;
        setIsSubmitting(true);
        try {
            await onRequestClarification(prompt, blocking);
            setPrompt('');
            setBlocking(false);
            setIsDrafting(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mt-4 space-y-4">
            {/* Existing Clarifications */}
            {existingClarifications.length > 0 && (
                <div className="space-y-3">
                    {existingClarifications.map((c) => (
                        <div key={c.id} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                            <div className="flex items-center justify-between px-4 py-2 bg-slate-900/50 border-b border-slate-800">
                                <div className="flex items-center gap-3">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${c.status === 'responded' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                        {c.status}
                                    </span>
                                    {c.blocking && (
                                        <span className="text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                                            Blocking
                                        </span>
                                    )}
                                    {c.emailStatus === 'FAILED' ? (
                                        <span className="text-[9px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded border border-red-400/20">
                                            EMAIL FAILED
                                        </span>
                                    ) : c.emailStatus === 'SENT' ? (
                                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
                                            EMAIL SENT
                                        </span>
                                    ) : null}
                                </div>
                                <span className="text-[10px] text-slate-500 font-mono italic">
                                    REQUESTED: {new Date(c.requestedAt).toLocaleDateString()}
                                </span>
                            </div>

                            <div className="p-4 space-y-4">
                                <div className="space-y-1">
                                    <div className="text-[9px] uppercase font-bold text-slate-500">Consultant Prompt</div>
                                    <div className="text-sm text-slate-300 leading-relaxed font-medium">
                                        {c.clarificationPrompt}
                                    </div>
                                </div>

                                {c.status === 'responded' ? (
                                    <div className="space-y-1 pt-3 border-t border-slate-800/50">
                                        <div className="text-[9px] uppercase font-bold text-emerald-500 flex justify-between items-center">
                                            <span>Stakeholder Response</span>
                                            <span className="text-slate-500 font-mono italic normal-case">
                                                {c.respondedAt && new Date(c.respondedAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="text-sm text-slate-200 leading-relaxed bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-lg">
                                            {c.clarificationResponse}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between gap-4 text-[10px] bg-slate-900/30 p-2 rounded border border-dashed border-slate-800">
                                        <span className="text-slate-500 italic">
                                            {c.emailStatus === 'FAILED' ? 'Email failed to deliver.' : 'Awaiting response from stakeholder...'}
                                        </span>
                                        {c.emailStatus === 'FAILED' && (
                                            <button
                                                onClick={() => onResendEmail(c.id)}
                                                className="text-[9px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors"
                                            >
                                                Retry Send
                                            </button>
                                        )}
                                    </div>
                                )}
                                {c.emailError && (
                                    <div className="text-[8px] text-red-500/60 font-mono mt-1 px-1 truncate">
                                        Error: {c.emailError}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Request New Clarification */}
            {!isDrafting ? (
                <button
                    onClick={() => setIsDrafting(true)}
                    className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 flex items-center gap-2 transition-colors py-2 px-1"
                >
                    <span className="text-sm">+</span> Request New Clarification
                </button>
            ) : (
                <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                            New Clarification Request
                        </h4>
                        <button
                            onClick={() => setIsDrafting(false)}
                            className="text-slate-500 hover:text-slate-300 text-lg"
                        >
                            ×
                        </button>
                    </div>

                    <div className="space-y-3">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="What specifically needs clarifying? This prompt will be sent to the stakeholder."
                            className="w-full text-sm bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-300 placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none min-h-[100px]"
                        />

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={blocking}
                                    onChange={(e) => setBlocking(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-red-600 focus:ring-red-500 focus:ring-offset-slate-900"
                                />
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 group-hover:text-slate-300">
                                        Mark as Blocking
                                    </span>
                                    <span className="text-[8px] text-slate-600 uppercase font-medium">
                                        Prevents diagnostic generation until responded
                                    </span>
                                </div>
                            </label>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsDrafting(false)}
                                    className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-slate-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !prompt.trim()}
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-indigo-900/40 transition-all"
                                >
                                    {isSubmitting ? 'Sending...' : 'Send Request'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
