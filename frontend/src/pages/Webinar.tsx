/**
 * Webinar Page
 * Password-gated multi-role diagnostic for webinar participants
 */

import { useState } from 'react';
import { WebinarDiagnostic } from '../components/webinar/WebinarDiagnostic';
import { WebinarRegistration } from '../components/webinar/WebinarRegistration';

export function Webinar() {
    const [activeTab, setActiveTab] = useState<'diagnostic' | 'register'>('diagnostic');
    const [isAuthorized, setIsAuthorized] = useState(false);

    return (
        <div className="min-h-screen bg-slate-950 font-sans text-slate-400">
            {/* Header */}
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-6 py-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-100 mb-1">
                            <span className="text-blue-500">Strategic</span>AI <span className="text-slate-400 font-light">Diagnostic</span>
                        </h1>
                        <p className="text-slate-500 text-sm uppercase tracking-widest font-bold">
                            Elite Operator Assessment
                        </p>
                    </div>
                    <div className="hidden md:flex items-center gap-6">
                        <span className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live System
                        </span>
                    </div>
                </div>
            </header>

            {/* Tab Navigation */}
            <div className="max-w-5xl mx-auto px-6 py-6">
                <div className="flex gap-4 border-b border-slate-800">
                    <button
                        onClick={() => setActiveTab('diagnostic')}
                        className={`px-8 py-4 font-bold transition-all border-b-2 text-sm uppercase tracking-widest ${activeTab === 'diagnostic'
                            ? 'border-blue-500 text-blue-400'
                            : 'border-transparent text-slate-500 hover:text-slate-200'
                            }`}
                    >
                        Assessment
                    </button>
                    <button
                        onClick={() => setActiveTab('register')}
                        className={`px-8 py-4 font-bold transition-all border-b-2 text-sm uppercase tracking-widest ${activeTab === 'register'
                            ? 'border-blue-500 text-blue-400'
                            : 'border-transparent text-slate-500 hover:text-slate-200'
                            }`}
                    >
                        Operator Registration
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-6 pb-12">
                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden card-glow-hover">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[80px] -mr-32 -mt-32" />
                    <div className="relative z-10">
                        {activeTab === 'diagnostic' ? (
                            <WebinarDiagnostic
                                isAuthorized={isAuthorized}
                                onAuthChange={setIsAuthorized}
                                onSwitchToRegister={() => setActiveTab('register')}
                            />
                        ) : (
                            <WebinarRegistration
                                onSuccess={() => setActiveTab('diagnostic')}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
