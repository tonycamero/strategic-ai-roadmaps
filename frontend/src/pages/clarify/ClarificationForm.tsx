import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

interface ClarificationData {
    id: string;
    questionId: string;
    originalResponse: string;
    clarificationPrompt: string;
    status: string;
}

export default function ClarificationForm({ params }: { params: { token: string } }) {
    const [data, setData] = useState<ClarificationData | null>(null);
    const [response, setResponse] = useState('');
    const [status, setStatus] = useState<'loading' | 'idle' | 'submitting' | 'success' | 'error'>('loading');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const result = await api.getClarificationByToken(params.token);
                setData(result);
                setStatus('idle');
            } catch (err: any) {
                console.error('Failed to load clarification:', err);
                setError(err.message || 'Invalid or expired link');
                setStatus('error');
            }
        }
        load();
    }, [params.token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!response.trim()) return;

        setStatus('submitting');
        try {
            await api.submitClarification(params.token, response);
            setStatus('success');
        } catch (err: any) {
            console.error('Failed to submit clarification:', err);
            setError(err.message || 'Failed to submit response');
            setStatus('error');
        }
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="text-slate-400 animate-pulse text-sm font-bold uppercase tracking-widest">
                    Loading Request...
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-slate-900 border border-emerald-500/30 rounded-2xl p-8 text-center shadow-2xl shadow-emerald-500/10">
                    <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-2xl text-emerald-400">✓</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-100 mb-2">Response Submitted</h2>
                    <p className="text-slate-400 text-sm leading-relaxed mb-8">
                        Thank you for providing additional clarity. Your response has been securely recorded and shared with the diagnostic team.
                    </p>
                    <p className="text-xs text-slate-500 font-medium italic">
                        You can now close this tab.
                    </p>
                </div>
            </div>
        );
    }

    if (status === 'error' || !data) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-2xl p-8 text-center shadow-2xl shadow-red-500/10">
                    <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-2xl text-red-400">×</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-100 mb-2">Request Unavailable</h2>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        {error || 'This clarification link is no longer active or could not be found.'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 py-12 px-4 flex flex-col items-center">
            <div className="max-w-2xl w-full">
                {/* Branding */}
                <div className="mb-12 text-center">
                    <div className="inline-block px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-4">
                        Strategic AI Diagnostic
                    </div>
                    <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Clarification Request</h1>
                    <p className="mt-2 text-slate-400">Please provide more detail on your previous response.</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                    {/* Glass background effect */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-50" />

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Context Section */}
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    Topic
                                </label>
                                <div className="text-sm font-bold text-slate-300">
                                    {data.questionId.replace(/_/g, ' ')}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    Your Original Response
                                </label>
                                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-400 italic leading-relaxed">
                                    "{data.originalResponse}"
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                                    Request from Consultant
                                </label>
                                <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl text-sm text-slate-200 leading-relaxed font-medium">
                                    {data.clarificationPrompt}
                                </div>
                            </div>
                        </div>

                        {/* Response Section */}
                        <div className="space-y-4 pt-4 border-t border-slate-800">
                            <label htmlFor="response" className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                Your Detailed Response
                            </label>
                            <textarea
                                id="response"
                                value={response}
                                onChange={(e) => setResponse(e.target.value)}
                                required
                                className="w-full min-h-[160px] bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-600"
                                placeholder="Type your response here..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'submitting' || !response.trim()}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
                        >
                            {status === 'submitting' ? 'Submitting...' : 'Submit Response'}
                        </button>
                    </form>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-[10px] text-slate-600 font-medium uppercase tracking-[0.1em]">
                        This session is secure and encrypted. Data is used only for organizational diagnostic purposes.
                    </p>
                </div>
            </div>
        </div>
    );
}
