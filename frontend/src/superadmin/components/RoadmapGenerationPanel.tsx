// frontend/src/superadmin/components/RoadmapGenerationPanel.tsx

import { useMemo, useState } from 'react';
import { superadminApi } from '../api';
import { getLifecycle } from '../../services/projectionLifecycleAdapter';

type AnyRecord = Record<string, any>;

interface RoadmapGenerationPanelProps {
    tenantId: string;
    firmData: AnyRecord | null;
    onRefresh: () => Promise<void>;
    onRunSynthesis?: () => Promise<void>;
    onGenerateRoadmap?: () => Promise<void>;
    isGenerating?: boolean;
}

export function RoadmapGenerationPanel({ 
    tenantId, 
    firmData, 
    onRefresh,
    onRunSynthesis,
    onGenerateRoadmap,
    isGenerating = false 
}: RoadmapGenerationPanelProps) {
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    // ---- Derivations (Strictly consuming SSOT Projection) ----
    const derived = useMemo(() => {
        const projection = firmData?.projection;
        if (!projection) return null;

        const lifecycle = getLifecycle(projection);
        
        // Stage statuses derived from Projection Lifecycle
        const intakeClosed = lifecycle.stage1.status === 'COMPLETE';
        const briefApproved = lifecycle.stage2.status === 'COMPLETE';
        const diagnosticStatus = lifecycle.stage3.status;
        const discoveryStatus = lifecycle.stage4.status;
        const synthesisStatus = lifecycle.stage5.status;
        const moderationStatus = lifecycle.stage6.status;
        const roadmapStatus = lifecycle.stage7.status;

        const hasDiagnostic = diagnosticStatus === 'COMPLETE';
        
        const diag = projection?.artifacts?.diagnostic ?? {};

        // "ticket counts" / findings count: tolerate multiple shapes
        const findingsTotal = Number(diag?.ticketStats?.total ?? diag?.findingsCount ?? projection?.artifacts?.hasCanonicalFindings ? 1 : 0) || 0;

        const moderationPending = Number(projection?.artifacts?.moderation?.pending ?? 0) || 0;
        const moderationApproved = Number(projection?.artifacts?.moderation?.approved ?? 0) || 0;

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

        // Gate logic aligned with SSOT
        // For "Generate Tickets" (Stage 5 synthesis)
        const canRunSynthesis = synthesisStatus === 'READY';
        
        // For "Generate Roadmap" (Stage 7)
        const canGenerateRoadmap = roadmapStatus === 'READY' || roadmapStatus === 'COMPLETE';

        const canRerun = hasDiagnostic && findingsTotal === 0;

        return {
            intakeClosed,
            briefApproved,
            hasDiagnostic,
            findingsTotal,
            moderationPending,
            moderationApproved,
            ticketLabel,
            ticketIcon,
            ticketColor,
            canRunSynthesis,
            canGenerateRoadmap,
            canRerun,
            synthesisStatus,
            roadmapStatus
        };
    }, [firmData, tenantId]);

    // ---- Handlers ----
    const handleRunSynthesisClick = async () => {
        if (!onRunSynthesis) return;
        setError(null);
        setMessage(null);
        try {
            await onRunSynthesis();
            setMessage('✅ Assisted Synthesis run successfully.');
        } catch (err: any) {
            setError(err?.message ?? 'Failed to run assisted synthesis');
        }
    };

    const handleGenerateRoadmapClick = async () => {
        if (!onGenerateRoadmap) return;
        setError(null);
        setMessage(null);
        try {
            await onGenerateRoadmap();
            setMessage('✅ Strategic Roadmap generated successfully.');
        } catch (err: any) {
            setError(err?.message ?? 'Failed to generate roadmap');
        }
    };

    const handleViewRoadmap = () => {
        window.open(`/roadmap/${tenantId}`, '_blank');
    };

    if (!derived) return null;

    // ---- UI state ----
    const intakeClosed = derived.intakeClosed;
    const briefApproved = derived.briefApproved;
    const hasDiagnostic = derived.hasDiagnostic;

    const ticketLabel = derived.ticketLabel;
    const ticketIcon = derived.ticketIcon;
    const ticketColor = derived.ticketColor;

    const canRerun = derived.canRerun;

    return (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
            <h3 className="text-[10px] uppercase tracking-widest text-slate-600 font-inter font-extrabold mb-4">
                PIPELINE CONTROLS
            </h3>

            {/* Readiness Checklist */}
            <div className="mb-5">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Prerequisites (Stage 1-4)</h4>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-base">{intakeClosed ? '✅' : '⏳'}</span>
                        <span className="text-xs" style={{ color: intakeClosed ? '#10b981' : '#94a3b8' }}>
                            Intake Window CLOSED
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-base">{briefApproved ? '✅' : '⏳'}</span>
                        <span className="text-xs" style={{ color: briefApproved ? '#10b981' : '#94a3b8' }}>
                            Executive Brief APPROVED/ACKNOWLEDGED
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-base">{hasDiagnostic ? '✅' : '⏳'}</span>
                        <span className="text-xs" style={{ color: hasDiagnostic ? '#10b981' : '#94a3b8' }}>
                            Diagnostic Generated
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-base">{ticketIcon}</span>
                        <span className="text-xs" style={{ color: ticketColor }}>
                            {ticketLabel}
                        </span>
                    </div>
                </div>
            </div>

            {/* Zero-ticket recovery helper */}
            {canRerun && (
                <div className="mb-4 p-3 bg-amber-950/20 border border-amber-900/30 rounded-lg">
                    <p className="text-[10px] text-amber-200/70 mb-2">
                        Diagnostic completed but produced no findings. Ensure discovery notes are thorough.
                    </p>
                </div>
            )}

            {/* Status Messages */}
            {error && (
                <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-lg mb-4 text-red-400 text-xs">{error}</div>
            )}

            {message && (
                <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-lg mb-4 text-emerald-400 text-xs">
                    {message}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap">
                <button
                    onClick={handleRunSynthesisClick}
                    disabled={!derived.canRunSynthesis || isGenerating}
                    className={`px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${derived.canRunSynthesis && !isGenerating
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-lg shadow-indigo-600/20'
                        : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                        }`}
                >
                    {isGenerating ? 'Running...' : 'Run Assisted Synthesis'}
                </button>

                <button
                    onClick={handleGenerateRoadmapClick}
                    disabled={!derived.canGenerateRoadmap || isGenerating}
                    className={`px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${derived.canGenerateRoadmap && !isGenerating
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-lg shadow-emerald-600/20'
                        : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                        }`}
                >
                    {isGenerating ? 'Generating...' : 'Generate Roadmap'}
                </button>

                <button
                    onClick={handleViewRoadmap}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all"
                >
                    View Latest Roadmap
                </button>
            </div>
        </div>
    );
}

export default RoadmapGenerationPanel;
