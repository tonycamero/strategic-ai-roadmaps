import React, { useState } from 'react';
import { superadminApi } from '../api';

interface RoadmapGenerationPanelProps {
    tenantId: string;
    firmData: {
        tenant: {
            intakeWindowState?: string;
            lastDiagnosticId?: string;
        };
        execBrief?: {
            exists: boolean;
            status: string | null;
        };
        diagnosticStatus?: {
            total: number;
            pending: number;
            approved: number;
            rejected: number;
            readyForRoadmap: boolean;
        };
        discoveryStatus?: {
            complete: boolean;
        };
    };
    onRefresh: () => Promise<void>;
}

export function RoadmapGenerationPanel({ tenantId, firmData, onRefresh }: RoadmapGenerationPanelProps) {
    const [isAssembling, setIsAssembling] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isRerunning, setIsRerunning] = useState(false);
    const [isGeneratingTickets, setIsGeneratingTickets] = useState(false);
    const [showRerunModal, setShowRerunModal] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    // Compute readiness gates
    const intakeClosed = firmData.tenant.intakeWindowState === 'CLOSED';
    const briefApproved = firmData.execBrief?.status === 'APPROVED' ||
        firmData.execBrief?.status === 'ACKNOWLEDGED' ||
        firmData.execBrief?.status === 'WAIVED';
    const hasDiagnostic = !!firmData.tenant.lastDiagnosticId;

    // Discovery Gating (Ticket 5)
    // Check if discovery is complete (either from firmData.discoveryStatus if passed, or minimal fallback)
    // We expect firmData to potentially have it now. If not, we fall back to false.
    const discoveryComplete = (firmData as any).discoveryStatus?.complete || false;

    // Semantic ticket moderation state
    const ticketStats = firmData.diagnosticStatus;
    let ticketState: 'NO_TICKETS_YET' | 'PENDING' | 'COMPLETE' = 'NO_TICKETS_YET';
    let ticketLabel = 'Diagnostic Generated — Findings Pending';
    let ticketIcon = '⏳';
    let ticketColor = '#94a3b8'; // slate-400

    // State 1: Diagnostic Generated, No Discovery
    if (hasDiagnostic && !discoveryComplete) {
        ticketState = 'NO_TICKETS_YET';
        ticketLabel = 'Diagnostic Generated — Discovery Required';
        ticketIcon = '⏳';
        ticketColor = '#f59e0b'; // amber-500
    }
    // State 2: Discovery Complete, No Tickets (Needs Generation)
    else if (hasDiagnostic && discoveryComplete && (!ticketStats || ticketStats.total === 0)) {
        ticketState = 'NO_TICKETS_YET';
        ticketLabel = 'Discovery Complete — Ready to Generate Tickets';
        ticketIcon = '⚡';
        ticketColor = '#3b82f6'; // blue-500
    }
    // State 3/4: Tickets Exist
    else if (ticketStats) {
        if (ticketStats.total === 0) {
            // Fallback if discovery not marked complete but 0 tickets? Should be State 1.
            // But if we are here, logic above handles specific cases.
            ticketState = 'NO_TICKETS_YET';
            // If we somehow have no diagnostic?
            if (!hasDiagnostic) ticketLabel = 'Diagnostic Required';
        } else if (ticketStats.pending > 0) {
            ticketState = 'PENDING';
            ticketLabel = `Ticket Moderation Required (${ticketStats.pending} pending)`;
            ticketIcon = '⏳';
            ticketColor = '#f59e0b'; // amber-500
        } else {
            ticketState = 'COMPLETE';
            ticketLabel = 'Ticket Moderation Complete';
            ticketIcon = '✅';
            ticketColor = '#10b981'; // emerald-500
        }
    }

    const ticketsModerated = ticketState === 'COMPLETE' && (ticketStats?.total || 0) >= 12;
    const canAssemble = intakeClosed && briefApproved && ticketsModerated && hasDiagnostic;

    // Entry condition for re-run: diagnostic exists but zero tickets
    // BLOCKED: User says "Do NOT re-run SOP-01". We hide this if Discovery is missing to encourage Discovery.
    // Only allow rerun if explicitly needed, but per instructions, we want to guide them to Discovery.
    const canRerun = false; // Disable for now to force Discovery path

    // New action: Generate Tickets
    const canGenerateTickets = hasDiagnostic && discoveryComplete && (ticketStats?.total || 0) === 0;

    const handleGenerateTickets = async () => {
        setIsGeneratingTickets(true);
        setError(null);
        try {
            // We need to call the new endpoint.
            // Assuming tenantId and diagnosticId are available.
            const diagId = firmData.tenant.lastDiagnosticId;
            if (!diagId) throw new Error("No diagnostic ID");

            // Call API (using a raw fetch since it might not be in superadminApi typed defs yet or we add it)
            // Or we assume superadminApi has it. I'll add a helper here if needed or use apiPost directly.
            // For now, let's use the route we added: /api/superadmin/tickets/generate/:tenantId/:diagnosticId
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/superadmin/tickets/generate/${tenantId}/${diagId}`, {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to generate tickets');

            setMessage(`✅ Generated ${data.ticketCount} tickets from Discovery.`);
            await onRefresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsGeneratingTickets(false);
        }
    };

    const handleAssemble = async () => {
        setIsAssembling(true);
        setError(null);
        setMessage(null);

        try {
            const result = await superadminApi.assembleRoadmap(tenantId);

            if (result.kind === 'SUCCESS') {
                setMessage('✅ Roadmap draft assembled successfully');
                await onRefresh();
            } else if (result.kind === 'BLOCKED') {
                setError(`Prerequisites not met: ${result.message}`);
            } else if (result.kind === 'ERROR') {
                setError(`Assembly failed: ${result.message}`);
            }
        } catch (err: any) {
            setError(`Unexpected error: ${err.message}`);
        } finally {
            setIsAssembling(false);
        }
    };

    const handlePublish = async () => {
        setIsPublishing(true);
        setError(null);
        setMessage(null);

        try {
            const result = await superadminApi.publishRoadmap(tenantId);

            if (result.kind === 'SUCCESS') {
                setMessage('✅ Roadmap published successfully');
                await onRefresh();
            } else if (result.kind === 'BLOCKED') {
                setError(`Cannot publish: ${result.message}`);
            } else if (result.kind === 'ERROR') {
                setError(`Publish failed: ${result.message}`);
            }
        } catch (err: any) {
            setError(`Unexpected error: ${err.message}`);
        } finally {
            setIsPublishing(false);
        }
    };

    const handleRerunConfirm = async () => {
        setShowRerunModal(false);
        setIsRerunning(true);
        setError(null);
        setMessage(null);

        try {
            const result = await superadminApi.rerunSop01Diagnostic(tenantId);

            if (result.kind === 'SUCCESS') {
                setMessage(`✅ Diagnostic re-run complete. ${result.data.ticketStats.total} findings generated.`);
                await onRefresh();
            } else if (result.kind === 'BLOCKED') {
                setError(`Cannot re-run: ${result.message}`);
            } else if (result.kind === 'ERROR') {
                setError(`Re-run failed: ${result.message}`);
            }
        } catch (err: any) {
            setError(`Unexpected error: ${err.message}`);
        } finally {
            setIsRerunning(false);
        }
    };

    const handleViewRoadmap = () => {
        window.open(`/roadmap/${tenantId}`, '_blank');
    };

    return (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 mt-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">
                Strategic Roadmap Generation
            </h3>

            {/* Readiness Checklist */}
            <div className="mb-5">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Prerequisites
                </h4>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-base">{intakeClosed ? '✅' : '⏳'}</span>
                        <span className="text-sm" style={{ color: intakeClosed ? '#10b981' : '#94a3b8' }}>
                            Intake Window CLOSED
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-base">{briefApproved ? '✅' : '⏳'}</span>
                        <span className="text-sm" style={{ color: briefApproved ? '#10b981' : '#94a3b8' }}>
                            Executive Brief APPROVED/ACKNOWLEDGED
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-base">{hasDiagnostic ? '✅' : '⏳'}</span>
                        <span className="text-sm" style={{ color: hasDiagnostic ? '#10b981' : '#94a3b8' }}>
                            Diagnostic Generated
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-base">{ticketIcon}</span>
                        <span className="text-sm" style={{ color: ticketColor }}>
                            {ticketLabel}
                        </span>
                    </div>
                </div>
            </div>

            {/* Zero-ticket recovery helper */}
            {canRerun && (
                <div className="mb-4 p-3 bg-amber-950 border border-amber-900 rounded-lg">
                    <p className="text-xs text-amber-200 mb-2">
                        Diagnostic completed but produced no findings. You may re-run SOP-01 to regenerate findings. This will overwrite the previous diagnostic.
                    </p>
                    <button
                        onClick={() => setShowRerunModal(true)}
                        disabled={isRerunning}
                        className={`px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-medium transition-all ${isRerunning ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
                            }`}
                    >
                        {isRerunning ? 'Re-running...' : 'Re-run SOP-01 (Overwrite Diagnostic)'}
                    </button>
                </div>
            )}

            {/* Status Messages */}
            {error && (
                <div className="p-3 bg-red-950 border border-red-900 rounded-lg mb-4 text-red-200 text-sm">
                    {error}
                </div>
            )}

            {message && (
                <div className="p-3 bg-emerald-950 border border-emerald-900 rounded-lg mb-4 text-emerald-200 text-sm">
                    {message}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap">
                <button
                    onClick={handleAssemble}
                    disabled={!canAssemble || isAssembling}
                    className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${canAssemble
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer'
                        : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                        } ${isAssembling ? 'opacity-70' : ''}`}
                >
                    {isAssembling ? 'Assembling...' : 'Assemble Draft Roadmap'}
                </button>

                <button
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className={`px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium cursor-pointer transition-all ${isPublishing ? 'opacity-70' : ''
                        }`}
                >
                    {isPublishing ? 'Publishing...' : 'Publish Roadmap'}
                </button>

                <button
                    onClick={handleViewRoadmap}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-sm font-medium cursor-pointer transition-all"
                >
                    View Latest Roadmap
                </button>
            </div>

            {/* Re-run Confirmation Modal */}
            {showRerunModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-slate-100 mb-3">
                            Re-run SOP-01?
                        </h3>
                        <p className="text-sm text-slate-300 mb-5">
                            This will overwrite the existing diagnostic and any associated findings. This action is irreversible.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowRerunModal(false)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRerunConfirm}
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-all"
                            >
                                Confirm Re-run
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
