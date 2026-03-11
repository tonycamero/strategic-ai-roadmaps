import React, { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { api } from '../lib/api';
import { LucideAlertCircle, LucideCheckCircle2, LucideSend, LucideUser, LucideBriefcase, LucideMapPin, LucideChevronRight, LucideLogOut } from 'lucide-react';

interface OpsSession {
    participantId: string;
    tenantId: string;
    name: string;
    department: string;
    roleLabel: string;
}

export default function OpsSignalPortal() {
    const [, params] = useRoute('/ops-signal/:tenantId');
    const tenantIdFromRoute = params?.tenantId;

    const [step, setStep] = useState<1 | 2>(1);
    const [session, setSession] = useState<OpsSession | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Identity Form State
    const [identityForm, setIdentityForm] = useState({
        name: '',
        email: '',
        department: '',
        roleLabel: ''
    });

    // Signal Form State
    const [signalForm, setSignalForm] = useState({
        exceptionTrigger: '',
        exceptionReceiver: '',
        breakEvent: '',
        location: ''
    });

    // Session Restore Logic
    useEffect(() => {
        if (!tenantIdFromRoute) return;

        const storedSessionRaw = localStorage.getItem('opsSignalSession');
        if (storedSessionRaw) {
            try {
                const storedSession: OpsSession = JSON.parse(storedSessionRaw);

                // Verify tenantId matches route
                if (storedSession.tenantId === tenantIdFromRoute) {
                    setSession(storedSession);
                    setStep(2);
                } else {
                    // Mismatch - clear session
                    localStorage.removeItem('opsSignalSession');
                    setStep(1);
                }
            } catch (e) {
                console.error('Failed to parse opsSignalSession', e);
                localStorage.removeItem('opsSignalSession');
                setStep(1);
            }
        }
    }, [tenantIdFromRoute]);

    const handleIdentitySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenantIdFromRoute) return;

        setLoading(true);
        setError(null);

        try {
            const response = await api.registerOpsParticipant({
                ...identityForm,
                tenantId: tenantIdFromRoute
            });

            if (response.ok) {
                const newSession: OpsSession = {
                    participantId: response.participantId,
                    tenantId: tenantIdFromRoute,
                    name: identityForm.name,
                    department: identityForm.department,
                    roleLabel: identityForm.roleLabel
                };

                setSession(newSession);
                localStorage.setItem('opsSignalSession', JSON.stringify(newSession));
                setStep(2);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to register identity');
        } finally {
            setLoading(false);
        }
    };

    const handleSignalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenantIdFromRoute || !session) return;

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const response = await api.submitOpsSignal({
                tenantId: tenantIdFromRoute,
                participantId: session.participantId,
                signalType: 'OPERATIONAL_EXCEPTION',
                signalData: signalForm
            });

            if (response.ok) {
                setSuccess(true);
                // Reset signal form but keep session
                setSignalForm({
                    exceptionTrigger: '',
                    exceptionReceiver: '',
                    breakEvent: '',
                    location: ''
                });
                // Auto-clear success message after 3 seconds
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to submit signal');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('opsSignalSession');
        window.location.reload();
    };

    if (!tenantIdFromRoute) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
                <div className="text-center p-8 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl">
                    <LucideAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Invalid Access</h1>
                    <p className="text-slate-400">Please provide a valid Tenant ID in the URL structure.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
            {/* Header */}
            <header className="fixed top-0 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800 z-50">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-600/20">
                            S
                        </div>
                        <h1 className="text-lg font-bold tracking-tight">
                            Ops Team <span className="text-blue-500">Signal Portal</span>
                        </h1>
                    </div>
                    {session && (
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-xs text-slate-500 hover:text-red-400 transition-colors uppercase tracking-widest font-bold group"
                        >
                            <LucideLogOut className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                            Log Out
                        </button>
                    )}
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-6 pt-32 pb-12">
                {step === 1 ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-10">
                            <h2 className="text-3xl font-extrabold mb-3 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                                Active Duty Registry
                            </h2>
                            <p className="text-slate-400 text-lg">
                                Register your identity once to start capturing operational signals in real-time.
                            </p>
                        </div>

                        <form onSubmit={handleIdentitySubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400 uppercase tracking-tighter">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <LucideUser className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                        <input
                                            type="text"
                                            required
                                            value={identityForm.name}
                                            onChange={e => setIdentityForm({ ...identityForm, name: e.target.value })}
                                            placeholder="e.g. John Miller"
                                            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400 uppercase tracking-tighter">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={identityForm.email}
                                        onChange={e => setIdentityForm({ ...identityForm, email: e.target.value })}
                                        placeholder="john@company.com"
                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400 uppercase tracking-tighter">
                                        Department
                                    </label>
                                    <input
                                        type="text"
                                        value={identityForm.department}
                                        onChange={e => setIdentityForm({ ...identityForm, department: e.target.value })}
                                        placeholder="e.g. Fulfillment"
                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400 uppercase tracking-tighter">
                                        Current Role
                                    </label>
                                    <div className="relative">
                                        <LucideBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                        <input
                                            type="text"
                                            required
                                            value={identityForm.roleLabel}
                                            onChange={e => setIdentityForm({ ...identityForm, roleLabel: e.target.value })}
                                            placeholder="e.g. Ops Manager"
                                            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600"
                                        />
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3 animate-in fade-in duration-300">
                                    <LucideAlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-400 font-medium">{error}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="group w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? 'Validating...' : (
                                    <>
                                        Enter Signal Portal
                                        <LucideChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-8 flex items-center justify-between">
                            <div>
                                <h2 className="text-3xl font-extrabold mb-2 text-white">
                                    Signal Capture
                                </h2>
                                <p className="text-slate-400">
                                    Relay operational frictions immediately as they occur.
                                </p>
                                {session && (
                                    <p className="mt-3 text-sm font-bold text-blue-500 uppercase tracking-widest animate-in fade-in slide-in-from-left-2 duration-700">
                                        Logged in as: <span className="text-white">{session.name}</span> {session.department && <span className="text-slate-500">— {session.department}</span>}
                                    </p>
                                )}
                            </div>
                            <div className="bg-slate-900 border border-slate-800 px-4 py-3 rounded-2xl hidden md:flex items-center gap-3">

                                <div className="w-10 h-10 bg-blue-600/10 rounded-full flex items-center justify-center border border-blue-500/20">
                                    <LucideUser className="w-5 h-5 text-blue-500" />
                                </div>
                                <div className="text-left">
                                    <p className="text-xs font-bold text-slate-500 uppercase">Active Signalman</p>
                                    <p className="text-sm font-extrabold text-blue-400">{session?.name}</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSignalSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-400 uppercase tracking-tighter">
                                    What breaks or shifts?
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    value={signalForm.exceptionTrigger}
                                    onChange={e => setSignalForm({ ...signalForm, exceptionTrigger: e.target.value })}
                                    placeholder="Describe the friction or deviation..."
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600 resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-400 uppercase tracking-tighter">
                                    Who should know immediately?
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={signalForm.exceptionReceiver}
                                    onChange={e => setSignalForm({ ...signalForm, exceptionReceiver: e.target.value })}
                                    placeholder="e.g. Floor Lead, Inventory Clerk"
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-400 uppercase tracking-tighter">
                                    What was the moment the process stopped or slipped?
                                </label>
                                <textarea
                                    required
                                    rows={2}
                                    value={signalForm.breakEvent}
                                    onChange={e => setSignalForm({ ...signalForm, breakEvent: e.target.value })}
                                    placeholder="Key details of the event..."
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600 resize-none"
                                />
                            </div>


                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-400 uppercase tracking-tighter">
                                    Where does it happen?
                                </label>
                                <div className="relative">
                                    <LucideMapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="text"
                                        required
                                        value={signalForm.location}
                                        onChange={e => setSignalForm({ ...signalForm, location: e.target.value })}
                                        placeholder="e.g. Loading Dock B, CRM Intake"
                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3 animate-in fade-in duration-300">
                                    <LucideAlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-400 font-medium">{error}</p>
                                </div>
                            )}

                            {success && (
                                <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex items-start gap-3 animate-in pulse duration-[2s]">
                                    <LucideCheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                    <p className="text-sm text-green-400 font-medium">Signal transmitted successfully. Stand by for next entry.</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
                            >
                                <LucideSend className="w-6 h-6" />
                                {loading ? 'Transmitting...' : 'Submit Signal Entry'}
                            </button>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
}
