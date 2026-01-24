
import React, { useState } from 'react';

interface SaveResultsCTAProps {
    onSave: (data: { email: string; name: string; orgName: string }) => Promise<void>;
    isSaved: boolean;
    canRefire: boolean; // If they want to save *again* or update
}

export function SaveResultsCTA({ onSave, isSaved, canRefire }: SaveResultsCTAProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({ email: '', name: '', orgName: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await onSave(formData);
            setIsOpen(false);
        } catch (err: any) {
            setError(err.message || 'Failed to save results.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSaved && !canRefire) {
        return (
            <div className="w-full bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-6 mb-8 text-center animate-fade-in text-white backdrop-blur-sm">
                <h3 className="text-xl font-bold text-emerald-400 mb-2">Results Saved</h3>
                <p className="text-slate-300">
                    We've associated this diagnostic with your account. Check your email (<b>{formData.email}</b>) for your access link.
                </p>
            </div>
        );
    }

    return (
        <>
            {/* Inline CTA Block */}
            <div className="w-full bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-8 mb-8 text-center shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors duration-500" />

                <div className="relative z-10">
                    <h3 className="text-2xl font-bold text-white mb-2">
                        Don’t lose this snapshot. Want us to save it for you?
                    </h3>
                    <p className="text-slate-400 max-w-2xl mx-auto mb-6">
                        Create an account with one click and we’ll store your diagnostic, track progress, and let you return anytime.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={() => setIsOpen(true)}
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg shadow-blue-900/50 transition-all hover:scale-105"
                        >
                            Save My Results
                        </button>

                        <button
                            disabled
                            className="px-8 py-3 bg-slate-800 text-slate-500 font-medium rounded-lg border border-slate-700 cursor-not-allowed flex items-center gap-2"
                            title="Coming soon"
                        >
                            <span>Email Me This Report</span>
                            <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded text-slate-400">Soon</span>
                        </button>
                    </div>

                    <p className="mt-4 text-xs text-slate-500 uppercase tracking-widest">
                        No passwords • No spam • Secure History
                    </p>
                </div>
            </div>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

                    <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <h2 className="text-2xl font-bold text-white mb-2">Save Your Results</h2>
                        <p className="text-slate-400 text-sm mb-6">
                            We'll create a secure account for your organization so you can access this report later.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Your Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Jane Doe"
                                    value={formData.name}
                                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Work Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="jane@company.com"
                                    value={formData.email}
                                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Organization Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Acme Corp"
                                    value={formData.orgName}
                                    onChange={e => setFormData(prev => ({ ...prev, orgName: e.target.value }))}
                                />
                            </div>

                            {error && (
                                <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <span>Save Results</span>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
