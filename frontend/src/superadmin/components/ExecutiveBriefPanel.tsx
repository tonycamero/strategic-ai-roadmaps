import React, { useEffect, useState } from 'react';
import { superadminApi } from '../api';
import { PrivateLeadershipBriefView, SystemExecutiveBriefView, ApprovedSystemView } from './ExecutiveBriefViews';

interface ExecutiveBriefPanelProps {
    tenantId: string;
    onApproved?: () => void;
}

type BriefState = 'LOADING' | 'NOT_READY' | 'READY_TO_GENERATE' | 'DRAFT' | 'APPROVED' | 'DELIVERED' | 'ERROR';
type ExecutiveBriefView = 'PRIVATE_LEADERSHIP' | 'SYSTEM';

export function ExecutiveBriefPanel({ tenantId, onApproved }: ExecutiveBriefPanelProps) {
    const [state, setState] = useState<BriefState>('LOADING');
    const [activeView, setActiveView] = useState<ExecutiveBriefView>('SYSTEM');
    const [brief, setBrief] = useState<any>(null);
    const [prerequisites, setPrerequisites] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchBrief = async () => {
        try {
            setState('LOADING');
            const response = await superadminApi.getExecutiveBrief(tenantId);
            setBrief(response.brief);

            if (response.brief.status === 'DELIVERED') {
                setState('DELIVERED');
            } else if (response.brief.status === 'APPROVED') {
                setState('APPROVED');
            } else {
                setState('DRAFT');
            }
        } catch (err: any) {
            const errorMessage = err?.message || '';

            if (err?.error === 'EXECUTIVE_BRIEF_NOT_READY') {
                setState('NOT_READY');
                setPrerequisites(err?.prerequisites || {});
            } else if (err?.error === 'EXECUTIVE_BRIEF_NOT_FOUND' || errorMessage.includes('404')) {
                setState('READY_TO_GENERATE');
            } else {
                console.error('[ExecutiveBrief] Fetch error:', err);
                setState('ERROR');
                setError(err?.message || 'Failed to load executive brief');
            }
        }
    };

    useEffect(() => {
        fetchBrief();
    }, [tenantId]);

    const handleGenerate = async () => {
        try {
            setActionLoading(true);
            const response = await superadminApi.generateExecutiveBrief(tenantId);
            setBrief(response.brief);
            setState('DRAFT');
        } catch (err: any) {
            console.error('[ExecutiveBrief] Generate error:', err);
            if (err?.error === 'EXECUTIVE_BRIEF_ALREADY_EXISTS') {
                // Refetch to show existing draft
                fetchBrief();
            } else if (err?.error === 'EXECUTIVE_BRIEF_ALREADY_APPROVED') {
                // Refetch to show approved brief
                fetchBrief();
            } else {
                setError(err?.message || 'Failed to generate executive brief');
            }
        } finally {
            setActionLoading(false);
        }
    };

    const handleApprove = async () => {
        try {
            setActionLoading(true);
            const response = await superadminApi.approveExecutiveBrief(tenantId);
            setBrief(response.brief);
            setState('APPROVED');
            if (onApproved) onApproved();
        } catch (err: any) {
            console.error('[ExecutiveBrief] Approve error:', err);
            if (err?.error === 'EXECUTIVE_BRIEF_ALREADY_APPROVED') {
                // Refetch to show approved brief
                fetchBrief();
            } else {
                setError(err?.message || 'Failed to approve executive brief');
            }
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeliver = async () => {
        const confirmed = window.confirm(
            "This document contains interpretive leadership insights intended for executive review.\n\n" +
            "Once delivered, it becomes the reference point for diagnostic and discovery.\n\n" +
            "Are you sure you want to deliver this Executive Brief?"
        );

        if (!confirmed) return;

        try {
            setActionLoading(true);
            await superadminApi.deliverExecutiveBrief(tenantId);
            // Re-fetch to confirm state change and get updated stamps
            await fetchBrief();
            // Assuming fetchBrief updates state to DELIVERED if backend status updated
        } catch (err: any) {
            console.error('[ExecutiveBrief] Delivery error:', err);
            setError(err?.message || 'Failed to deliver executive brief');
        } finally {
            setActionLoading(false);
        }
    };

    if (state === 'LOADING') {
        return (
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/30">
                    <h3 className="text-sm font-bold text-slate-300 tracking-wider">Executive Brief</h3>
                </div>
                <div className="p-6">
                    <div className="w-full h-32 bg-slate-900/50 animate-pulse rounded-xl border border-slate-800" />
                </div>
            </div>
        );
    }

    if (state === 'NOT_READY') {
        return (
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-slate-300 tracking-wider">Executive Brief</h3>
                        <p className="text-[10px] text-slate-500 font-mono mt-1">PREREQUISITES NOT MET</p>
                    </div>
                    <div className="px-2 py-1 bg-amber-900/20 border border-amber-500/30 text-amber-400 text-[10px] font-bold rounded uppercase">
                        Not Ready
                    </div>
                </div>
                <div className="p-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-5">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-amber-900/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-slate-200 mb-1">Executive Brief Not Available</h4>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Complete the prerequisites below to enable executive brief generation.
                                </p>
                            </div>
                        </div>
                        <div className="space-y-3 mt-4 pt-4 border-t border-slate-800">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Required Prerequisites</div>

                            <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${prerequisites?.hasVectors ? 'border-green-500 bg-green-900/20' : 'border-slate-600'
                                    }`}>
                                    <span className={prerequisites?.hasVectors ? 'text-green-400 text-xs' : 'text-slate-600 text-xs'}>
                                        {prerequisites?.hasVectors ? '✓' : '✗'}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm text-slate-300 font-medium">Define at least one strategic stakeholder</div>
                                    <div className="text-xs text-slate-500 mt-0.5">
                                        {prerequisites?.vectorCount > 0 ? `${prerequisites.vectorCount} vectors defined` : 'No vectors yet'}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${prerequisites?.hasOwnerIntake ? 'border-green-500 bg-green-900/20' : 'border-slate-600'
                                    }`}>
                                    <span className={prerequisites?.hasOwnerIntake ? 'text-green-400 text-xs' : 'text-slate-600 text-xs'}>
                                        {prerequisites?.hasOwnerIntake ? '✓' : '✗'}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm text-slate-300 font-medium">Complete owner intake</div>
                                    <div className="text-xs text-slate-500 mt-0.5">Executive/owner must complete their strategic intake</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${prerequisites?.intakeWindowState === 'OPEN' ? 'border-green-500 bg-green-900/20' : 'border-slate-600'
                                    }`}>
                                    <span className={prerequisites?.intakeWindowState === 'OPEN' ? 'text-green-400 text-xs' : 'text-slate-600 text-xs'}>
                                        {prerequisites?.intakeWindowState === 'OPEN' ? '✓' : '✗'}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm text-slate-300 font-medium">Intake window must be OPEN</div>
                                    <div className="text-xs text-slate-500 mt-0.5">
                                        Current state: {prerequisites?.intakeWindowState || 'UNKNOWN'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (state === 'READY_TO_GENERATE') {
        return (
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-slate-300 tracking-wider">Executive Brief</h3>
                        <p className="text-[10px] text-slate-500 font-mono mt-1">READY TO GENERATE</p>
                    </div>
                    <div className="px-2 py-1 bg-blue-900/20 border border-blue-500/30 text-blue-400 text-[10px] font-bold rounded uppercase">
                        Ready
                    </div>
                </div>
                <div className="p-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-5">
                        <div className="mb-4">
                            <h4 className="text-sm font-bold text-slate-200 mb-2">Generate Executive Brief</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                All prerequisites are met. Generate the executive brief to synthesize stakeholder perspectives
                                and organizational constraints into an authoritative strategic narrative.
                            </p>
                        </div>
                        <button
                            onClick={handleGenerate}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors"
                        >
                            {actionLoading ? 'Generating...' : 'Generate Executive Brief'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const handleRequestVerification = () => {
        // Stub for routing to Intake Consultant Feedback
        const verification = brief?.signals?.verification;
        const missing = verification?.missingSignals?.join(', ') || 'signals';
        console.log(`[ExecutiveBrief] Requesting verification for: ${missing}`);
        window.alert(`Routing to Consultant Feedback.\nContext: Verification required for ${missing}.\nStatus: Pre-Diagnostic.`);
    };

    if (state === 'DRAFT' && brief) {
        const synthesis = brief.synthesis || {};
        const signals = brief.signals || {};
        const verification = signals.verification || {};

        return (
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                {/* Header with Tab Switcher */}
                <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/30">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="text-sm font-bold text-slate-300 tracking-wider">Executive Brief</h3>
                            <p className="text-[10px] text-slate-500 font-mono mt-1">DRAFT · AWAITING APPROVAL</p>
                        </div>
                        <div className="px-2 py-1 bg-yellow-900/20 border border-yellow-500/30 text-yellow-400 text-[10px] font-bold rounded uppercase">
                            Draft
                        </div>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => setActiveView('PRIVATE_LEADERSHIP')}
                            className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest rounded-full transition-all border ${activeView === 'PRIVATE_LEADERSHIP'
                                ? 'bg-white text-slate-950 border-white shadow-lg'
                                : 'bg-transparent text-slate-500 border-slate-700/50 hover:text-slate-300 hover:border-slate-500'
                                }`}
                        >
                            Private Leadership
                        </button>
                        <button
                            onClick={() => setActiveView('SYSTEM')}
                            className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest rounded-full transition-all border ${activeView === 'SYSTEM'
                                ? 'bg-white text-slate-950 border-white shadow-lg'
                                : 'bg-transparent text-slate-500 border-slate-700/50 hover:text-slate-300 hover:border-slate-500'
                                }`}
                        >
                            System View
                        </button>
                    </div>
                </div>

                {/* Render based on active view */}
                {activeView === 'PRIVATE_LEADERSHIP' ? (
                    <PrivateLeadershipBriefView synthesis={synthesis} signals={signals} verification={verification} />
                ) : (
                    <SystemExecutiveBriefView
                        synthesis={synthesis}
                        signals={signals}
                        verification={verification}
                        onApprove={handleApprove}
                        onRequestVerification={handleRequestVerification}
                        actionLoading={actionLoading}
                    />
                )}
            </div>
        );
    }

    if ((state === 'APPROVED' || state === 'DELIVERED') && brief) {
        const synthesis = brief.synthesis || {};
        const signals = brief.signals || {};
        const verification = signals.verification || {};
        const isDelivered = state === 'DELIVERED';

        return (
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                {/* Header with Tab Switcher */}
                <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/30">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="text-sm font-bold text-slate-300 tracking-wider">Executive Brief</h3>
                            <p className="text-[10px] text-slate-500 font-mono mt-1">
                                {isDelivered ? `DELIVERED` : `APPROVED`} · {brief.approvedAt ? new Date(brief.approvedAt).toLocaleDateString() : ''}
                            </p>
                        </div>
                        <div className={`px-2 py-1 border text-[10px] font-bold rounded uppercase ${isDelivered
                                ? 'bg-purple-900/20 border-purple-500/30 text-purple-400'
                                : 'bg-green-900/20 border-green-500/30 text-green-400'
                            }`}>
                            {isDelivered ? 'Delivered' : 'Approved · Intake Closed'}
                        </div>
                    </div>

                    <div className="flex justify-between items-center">
                        {/* Tab Switcher */}
                        <div className="flex gap-4">
                            <button
                                onClick={() => setActiveView('PRIVATE_LEADERSHIP')}
                                className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest rounded-full transition-all border ${activeView === 'PRIVATE_LEADERSHIP'
                                    ? 'bg-white text-slate-950 border-white shadow-lg'
                                    : 'bg-transparent text-slate-500 border-slate-700/50 hover:text-slate-300 hover:border-slate-500'
                                    }`}
                            >
                                Private Leadership
                            </button>
                            <button
                                onClick={() => setActiveView('SYSTEM')}
                                className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest rounded-full transition-all border ${activeView === 'SYSTEM'
                                    ? 'bg-white text-slate-950 border-white shadow-lg'
                                    : 'bg-transparent text-slate-500 border-slate-700/50 hover:text-slate-300 hover:border-slate-500'
                                    }`}
                            >
                                System View
                            </button>
                        </div>

                        {/* ACTION BUTTON: Deliver Executive Brief */}
                        {state === 'APPROVED' && (
                            <button
                                onClick={handleDeliver}
                                disabled={actionLoading}
                                className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest bg-purple-600 hover:bg-purple-500 text-white rounded-full transition-colors flex items-center gap-2"
                            >
                                {actionLoading ? (
                                    <>
                                        <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Delivering...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        Deliver to Client
                                    </>
                                )}
                            </button>
                        )}
                        {state === 'DELIVERED' && (
                            <div className="text-[10px] font-mono text-purple-400 flex items-center gap-1 opacity-70">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Emailed
                            </div>
                        )}
                    </div>
                </div>

                {/* Render based on active view */}
                {activeView === 'PRIVATE_LEADERSHIP' ? (
                    <PrivateLeadershipBriefView synthesis={synthesis} signals={signals} verification={verification} />
                ) : (
                    <ApprovedSystemView synthesis={synthesis} signals={signals} />
                )}
            </div>
        );
    }

    if (state === 'ERROR') {
        return (
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/30">
                    <h3 className="text-sm font-bold text-slate-300 tracking-wider">Executive Brief</h3>
                </div>
                <div className="p-6">
                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                        <p className="text-sm text-red-400">{error || 'Failed to load executive brief'}</p>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}

// (Removed redundant SynthesisSection)
