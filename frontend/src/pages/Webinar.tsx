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
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
                <div className="max-w-5xl mx-auto px-6 py-8">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Team Execution Diagnostic
                    </h1>
                    <p className="text-slate-400">
                        Exclusive multi-role assessment for team execution
                    </p>
                </div>
            </header>

            {/* Tab Navigation */}
            <div className="max-w-5xl mx-auto px-6 py-6">
                <div className="flex gap-2 border-b border-slate-800">
                    <button
                        onClick={() => setActiveTab('diagnostic')}
                        className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'diagnostic'
                            ? 'border-blue-500 text-blue-400'
                            : 'border-transparent text-slate-400 hover:text-slate-300'
                            }`}
                    >
                        Diagnostic
                    </button>
                    <button
                        onClick={() => setActiveTab('register')}
                        className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'register'
                            ? 'border-blue-500 text-blue-400'
                            : 'border-transparent text-slate-400 hover:text-slate-300'
                            }`}
                    >
                        Register
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-6 pb-12">
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
    );
}
