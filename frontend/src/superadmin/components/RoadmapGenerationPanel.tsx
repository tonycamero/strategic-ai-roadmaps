// frontend/src/superadmin/components/RoadmapGenerationPanel.tsx

import { useMemo, useState } from 'react';
import { superadminApi } from '../api';

type AnyRecord = Record<string, any>;

interface RoadmapGenerationPanelProps {
    tenantId: string;
    firmData: AnyRecord | null;
    onRefresh: () => Promise<void>;
}

export function RoadmapGenerationPanel({ tenantId, firmData, onRefresh }: RoadmapGenerationPanelProps) {
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const [isGeneratingTickets, setIsGeneratingTickets] = useState(false);

    // Disabled features pending API implementation
    // const [isAssembling, setIsAssembling] = useState(false);
    // const [isPublishing, setIsPublishing] = useState(false);
    // const [isRerunning, setIsRerunning] = useState(false);
    // const [showRerunModal, setShowRerunModal] = useState(false);

    // ---- Derivations (fail-closed, tolerant of schema drift) ----
    const derived = useMemo(() => {
        const tenant = firmData?.tenant ?? firmData?.firm ?? firmData?.data?.tenant ?? {};
        const diag = firmData?.latestDiagnostic ?? tenant?.latestDiagnostic ?? tenant?.diagnostic ?? {};
        const brief = firmData?.latestExecutiveBrief ?? tenant?.latestExecutiveBrief ?? tenant?.executiveBrief ?? {};
        const workflow = firmData?.workflow ?? firmData?.workflowStatus ?? firmData?.firmWorkflowStatus ?? {};

        const intakeWindowState =
            tenant?.intakeWindowState ??
            workflow?.intakeWindowState ??
            firmData?.intakeWindowState ??
            tenant?.intake_window_state ??
            null;

        const intakeClosed =
            intakeWindowState === 'CLOSED' ||
            intakeWindowState === 'LOCKED' ||
            intakeWindowState === 'COMPLETE' ||
            workflow?.intakeClosed === true ||
            tenant?.intakeClosed === true;

        const briefStatus =
            brief?.status ?? tenant?.executiveBriefStatus ?? workflow?.executiveBriefStatus ?? tenant?.executive_brief_status;

        const briefApproved =
            briefStatus === 'APPROVED' ||
            briefStatus === 'ACKNOWLEDGED' ||
            briefStatus === 'COMPLETE' ||
            brief?.isApproved === true ||
            workflow?.briefApproved === true;

        const diagnosticId =
            diag?.id ??
            tenant?.lastDiagnosticId ??
            tenant?.last_diagnostic_id ??
            workflow?.diagnosticId ??
            null;

        const diagnosticStatus = diag?.status ?? tenant?.diagnosticStatus ?? workflow?.diagnosticStatus ?? null;

        const hasDiagnostic =
            Boolean(diagnosticId) ||
            diagnosticStatus === 'COMPLETE' ||
            diagnosticStatus === 'PUBLISHED' ||
            diagnosticStatus === 'READY';

        // "ticket counts" / findings count: tolerate multiple shapes
        const findingsTotal =
            Number(diag?.ticketStats?.total ?? diag?.findingsCount ?? diag?.stats?.total ?? diag?.totals?.findings ?? 0) || 0;

        const moderation = firmData?.moderation ?? tenant?.moderation ?? workflow?.moderation ?? {};
        const moderationPending = Number(moderation?.pending ?? workflow?.pendingModerationCount ?? 0) || 0;
        const moderationApproved = Number(moderation?.approved ?? workflow?.approvedModerationCount ?? 0) || 0;

        const discoveryStatus =
            firmData?.discoveryStatus ??
            tenant?.discoveryStatus ??
            workflow?.discoveryStatus ??
            firmData?.discovery ??
            tenant?.discovery ??
            {};

        const discoveryComplete =
            discoveryStatus?.complete === true ||
            discoveryStatus?.status === 'COMPLETE' ||
            discoveryStatus?.status === 'READY' ||
            workflow?.discoveryComplete === true;

        const ticketLabel = !hasDiagnostic
            ? 'Diagnostic NOT generated'
            : findingsTotal === 0
                ? 'Diagnostic produced 0 findings'
                : moderationPending > 0
                    ? `Ticket Moderation pending (${moderationPending})`
                    : moderationApproved > 0
                        ? `Ticket Moderation complete (${moderationApproved} approved)`
                        : 'Findings present (moderation not started)';

        const ticketIcon = !hasDiagnostic ? '⏳' : findingsTotal === 0 ? '⚠️' : moderationPending > 0 ? '🟠' : '✅';

        const ticketColor = !hasDiagnostic ? '#94a3b8' : findingsTotal === 0 ? '#f59e0b' : moderationPending > 0 ? '#fb923c' : '#10b981';

        // Gate logic
        const canGenerate =
            Boolean(tenantId) && Boolean(diagnosticId) && intakeClosed && briefApproved && hasDiagnostic && discoveryComplete && findingsTotal > 0;

        const canAssemble = Boolean(tenantId) && intakeClosed && briefApproved && hasDiagnostic && findingsTotal > 0;

        // Rerun SOP-01 if diagnostic exists but produced 0 findings
        const canRerun = Boolean(tenantId) && hasDiagnostic && findingsTotal === 0;

        return {
            tenant,
            diag,
            brief,

            intakeClosed,
            briefApproved,
            hasDiagnostic,

            diagnosticId,
            findingsTotal,

            moderationPending,
            moderationApproved,

            discoveryComplete,

            ticketLabel,
            ticketIcon,
            ticketColor,

            canGenerate,
            canAssemble,
            canRerun,
        };
    }, [firmData, tenantId]);

    // ---- Handlers ----
    const handleGenerateTickets = async () => {
        setIsGeneratingTickets(true);
        setError(null);
        setMessage(null);

        try {
            const diagId = derived.diagnosticId;
            if (!diagId) throw new Error('No diagnostic ID');

            // Expected API (shape may vary; we fail loudly if backend rejects)
            const data = await superadminApi.generateTickets(tenantId, diagId);

            const ticketCount = data?.ticketCount ?? 0;
            setMessage(`✅ Generated ${ticketCount} tickets from Discovery.`);
            await onRefresh();
        } catch (err: any) {
            setError(err?.message ?? 'Failed to generate tickets');
        } finally {
            setIsGeneratingTickets(false);
        }
    };

    /* 
    // METHODS DISABLED: Not present in SuperAdmin API surface (Strike 1)
    
    const handleAssemble = async () => {
        setIsAssembling(true);
        // ...
    };

    const handlePublish = async () => {
        setIsPublishing(true);
        // ...
    };

    const handleRerunConfirm = async () => {
        setShowRerunModal(false);
        setIsRerunning(true);
        // ...
    };
    */

    const handleViewRoadmap = () => {
        window.open(`/roadmap/${tenantId}`, '_blank');
    };

    // ---- UI state ----
    const intakeClosed = derived.intakeClosed;
    const briefApproved = derived.briefApproved;
    const hasDiagnostic = derived.hasDiagnostic;

    const ticketLabel = derived.ticketLabel;
    const ticketIcon = derived.ticketIcon;
    const ticketColor = derived.ticketColor;

    const canRerun = derived.canRerun;

    const canGenerateTickets = derived.canGenerate;


    return (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 mt-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Strategic Roadmap Generation</h3>

            {/* Readiness Checklist */}
            <div className="mb-5">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Prerequisites</h4>
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
                        Diagnostic completed but produced no findings. Rerun functionality is currently unavailable in SuperAdmin Console.
                    </p>
                    {/* 
                    <button
                        onClick={() => setShowRerunModal(true)}
                        disabled={isRerunning}
                        className="..."
                    >
                        {isRerunning ? 'Re-running...' : 'Re-run SOP-01 (Overwrite Diagnostic)'}
                    </button>
                    */}
                </div>
            )}

            {/* Status Messages */}
            {error && (
                <div className="p-3 bg-red-950 border border-red-900 rounded-lg mb-4 text-red-200 text-sm">{error}</div>
            )}

            {message && (
                <div className="p-3 bg-emerald-950 border border-emerald-900 rounded-lg mb-4 text-emerald-200 text-sm">
                    {message}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap">
                <button
                    onClick={handleGenerateTickets}
                    disabled={!canGenerateTickets || isGeneratingTickets}
                    className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${canGenerateTickets
                        ? 'bg-sky-600 hover:bg-sky-500 text-white cursor-pointer'
                        : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                        } ${isGeneratingTickets ? 'opacity-70' : ''}`}
                    title={
                        canGenerateTickets
                            ? 'Generate Tickets from Discovery'
                            : 'Locked until Intake closed, Brief approved, Diagnostic exists, Discovery complete, and Findings > 0'
                    }
                >
                    {isGeneratingTickets ? 'Generating...' : 'Generate Tickets'}
                </button>

                <button
                    disabled={true} // FORCE DISABLED
                    // onClick={handleAssemble}
                    className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all bg-slate-800 text-slate-600 cursor-not-allowed opacity-50`}
                    title="API Endpoint Not Available"
                >
                    Assemble Draft Roadmap (Disabled)
                </button>

                <button
                    disabled={true} // FORCE DISABLED
                    // onClick={handlePublish}
                    className={`px-5 py-2.5 bg-slate-800 text-slate-600 rounded-lg text-sm font-medium cursor-not-allowed opacity-50`}
                    title="API Endpoint Not Available"
                >
                    Publish Roadmap (Disabled)
                </button>

                <button
                    onClick={handleViewRoadmap}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-sm font-medium cursor-pointer transition-all"
                >
                    View Latest Roadmap
                </button>
            </div>

            {/* Modal removed/gated */}
        </div>
    );
}

export default RoadmapGenerationPanel;
