import React, { useEffect, useState } from 'react';
import { AuthorityCategory } from '@roadmap/shared';
import { useRoute } from 'wouter';
import { useAuth } from '../../context/AuthContext';
import { useSuperAdminAuthority } from '../../hooks/useSuperAdminAuthority';
import { AuthorityGuard } from '../../components/AuthorityGuard';
import { DiagnosticModerationSurface } from '../components/DiagnosticModerationSurface';
import { DiagnosticCompleteCard } from '../components/DiagnosticCompleteCard';

import { RoadmapReadinessPanel } from '../components/RoadmapReadinessPanel';
import { ExecutiveSnapshotPanel, SnapshotData } from '../components/ExecutiveSnapshotPanel';
import { ExecutiveBriefPanel } from '../components/ExecutiveBriefPanel';
import { ExecutiveBriefModal } from '../components/ExecutiveBriefModal';
import { DiagnosticReviewModal } from '../components/DiagnosticReviewModal';
import { StakeholderModal } from '../../components/onboarding/StakeholderModal';
import { IntakeModal } from '../components/IntakeModal';
import { TruthProbeCard, TruthProbeData } from '../components/TruthProbeCard';
import { BriefCompleteCard } from '../components/BriefCompleteCard';
import { DiscoveryNotesModal } from '../components/DiscoveryNotesModal';
import { AssistedSynthesisModal } from '../components/AssistedSynthesisModal';
import { BaselineSummaryPanel } from '../components/BaselineSummaryPanel';
// @ANCHOR:SA_FIRM_DETAIL_IMPORTS_END

import { superadminApi } from '../api';
import { SuperAdminTenantDetail, IntakeRoleDefinition } from '../types';

// Inline type definition
type FirmDetailResponse = {
    tenantSummary: {
        id: string;
        name: string;
        cohortLabel: string | null;
        segment: string | null;
        region: string | null;
        status: string;
        businessType: 'default' | 'chamber';
        teamHeadcount: number | null;
        baselineMonthlyLeads: number | null;
        firmSizeTier: string | null;
        createdAt: string;
        notes: string | null;
        lastDiagnosticId: string | null;
        intakeWindowState?: 'OPEN' | 'CLOSED';
        intakeSnapshotId?: string | null;
        intakeClosedAt?: string | null;
        discoveryComplete?: boolean;
        executiveBriefStatus?: 'DRAFT' | 'APPROVED' | 'ACKNOWLEDGED' | 'WAIVED' | null;
        executionPhase?: 'INTAKE_OPEN' | 'EXEC_BRIEF_DRAFT' | 'EXEC_BRIEF_APPROVED' | 'INTAKE_CLOSED';
    };
    owner: {
        id: string;
        name: string;
        email: string;
        role: string;
        createdAt: string;
    } | null;
    teamMembers: { id: string; name: string; email: string; role: string; createdAt: string }[];
    intakes: any[];
    roadmaps: any[];
    latestRoadmap?: {
        id: string;
        status: string;
        createdAt: string;
        deliveredAt?: string | null;
    } | null;
    recentActivity: any[];
    diagnosticStatus: {
        total: number;
        pending: number;
        approved: number;
        rejected: number;
        readyForRoadmap: boolean;
    };
    latestDiagnostic: {
        id: string;
        status: 'generated' | 'locked' | 'published' | 'archived';
        createdAt: string;
        updatedAt: string;
    } | null;
};

export default function SuperAdminControlPlaneFirmDetailPage() {
    const [, params] = useRoute<{ tenantId: string }>('/superadmin/execute/firms/:tenantId');


    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [data, setData] = useState<SuperAdminTenantDetail | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Phase 4: Intake Role State
    const [intakeRoles, setIntakeRoles] = useState<IntakeRoleDefinition[]>([]);

    // Phase 6: Ticket Moderation State
    const [moderationStatus, setModerationStatus] = useState<{ readyForRoadmap: boolean; pending: number; approved: number } | null>(null);

    // Phase 7: Snapshot State
    const [snapshotData, setSnapshotData] = useState<SnapshotData | null>(null);
    const [snapshotLoading, setSnapshotLoading] = useState(false);
    const { category } = useSuperAdminAuthority();

    // Truth Probe State
    const [truthProbe, setTruthProbe] = useState<TruthProbeData | null>(null);
    const [truthProbeLoading, setTruthProbeLoading] = useState(false);
    const [truthProbeError, setTruthProbeError] = useState<string | null>(null);


    // Phase 8: Intake Modal
    const [selectedIntake, setSelectedIntake] = useState<any>(null);
    const [intakeModalOpen, setIntakeModalOpen] = useState(false);

    // Phase 6C: Truth Probe Collapse
    const [showTruthProbe, setShowTruthProbe] = useState(false);

    // Phase 6D: ROI Baseline Collapse
    const [showBaselinePanel, setShowBaselinePanel] = useState(false);

    // Phase 6E: Strategic Context & Capacity ROI Collapse
    const [showROIPanel, setShowROIPanel] = useState(false);

    // Phase 6E: Modal-based Review (ONLY paradigm)
    const [isExecBriefOpen, setExecBriefOpen] = useState(false);
    const [isDiagOpen, setDiagOpen] = useState(false);

    // Modal data states
    const [execBriefData, setExecBriefData] = useState<any>(null);
    const [execBriefLoading, setExecBriefLoading] = useState(false);
    const [execBriefError, setExecBriefError] = useState<string | null>(null);

    const [diagData, setDiagData] = useState<any>(null);
    const [diagLoading, setDiagLoading] = useState(false);
    const [diagError, setDiagError] = useState<string | null>(null);

    const [isDiscoveryOpen, setDiscoveryOpen] = useState(false);
    const [discoverySaving, setDiscoverySaving] = useState(false);

    const [isSynthesisOpen, setSynthesisOpen] = useState(false);
    const [synthesisNotes, setSynthesisNotes] = useState<string | null>(null);
    // @ANCHOR:SA_FIRM_DETAIL_STATE_END

    const refreshData = async () => {
        if (!params?.tenantId) return;

        setLoading(true);
        setTruthProbeLoading(true);

        // Fetch both detail and vectors for a complete truth picture
        try {
            const [firmResponse, vectorsResponse] = await Promise.all([
                superadminApi.getFirmDetail(params.tenantId),
                superadminApi.getIntakeVectors(params.tenantId)
            ]);

            const firmDetail = firmResponse as unknown as FirmDetailResponse;
            const { vectors } = vectorsResponse;

            const detailData: SuperAdminTenantDetail = {
                tenant: {
                    id: firmDetail.tenantSummary.id,
                    name: firmDetail.tenantSummary.name,
                    cohortLabel: firmDetail.tenantSummary.cohortLabel,
                    segment: firmDetail.tenantSummary.segment,
                    region: firmDetail.tenantSummary.region,
                    status: firmDetail.tenantSummary.status,
                    executiveBriefStatus: firmDetail.tenantSummary.executiveBriefStatus,
                    executionPhase: firmDetail.tenantSummary.executionPhase,
                    intakeWindowState: firmDetail.tenantSummary.intakeWindowState || 'OPEN',
                    intakeSnapshotId: firmDetail.tenantSummary.intakeSnapshotId,
                    intakeClosedAt: firmDetail.tenantSummary.intakeClosedAt,
                    notes: firmDetail.tenantSummary.notes,
                    createdAt: firmDetail.tenantSummary.createdAt,
                    ownerEmail: firmDetail.owner?.email || '',
                    ownerName: firmDetail.owner?.name || '',
                    lastDiagnosticId: firmDetail.tenantSummary.lastDiagnosticId,
                },
                owner: firmDetail.owner,
                teamMembers: firmDetail.teamMembers,
                intakes: firmDetail.intakes,
                intakeVectors: vectors,
                roadmaps: firmDetail.roadmaps,
                latestRoadmap: firmDetail.latestRoadmap,
                recentActivity: firmDetail.recentActivity,
                diagnosticStatus: firmDetail.diagnosticStatus,
                latestDiagnostic: firmDetail.latestDiagnostic,  // ✅ Wire diagnostic state
            };

            setData(detailData);

            // Map Stakeholder roles from vectors (Per-Person Truth)
            const mappedRoles: IntakeRoleDefinition[] = vectors.map((v: any) => ({
                id: v.id,
                vectorId: v.id,
                intakeId: v.intakeId,
                roleLabel: v.roleLabel,
                roleType: v.roleType,
                perceivedConstraints: v.perceivedConstraints,
                anticipatedBlindSpots: v.anticipatedBlindSpots,
                recipientName: v.recipientName,
                recipientEmail: v.recipientEmail,
                inviteStatus: v.inviteStatus,
                intakeStatus: v.intakeStatus,
                // Definition: accepted = email exists in teamMembers
                isAccepted: firmDetail.teamMembers.some((m: any) => m.email === v.recipientEmail)
            }));
            setIntakeRoles(mappedRoles);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }

        // Fetch Truth Probe
        superadminApi.getTruthProbe(params.tenantId)
            .then((data: any) => {
                console.log(`[TruthProbe UI] Loaded for tenant ${params.tenantId}`);
                setTruthProbe(data);
                setTruthProbeError(null);
            })
            .catch(err => {
                console.error('[TruthProbe UI] Failed:', err);
                setTruthProbeError(err.message || 'Data temporarily unavailable');
            })
            .finally(() => setTruthProbeLoading(false));
    };

    useEffect(() => {
        refreshData();
    }, [params?.tenantId]);

    // ============================================================================
    // CANONICAL STATUS SYSTEM (LOCKED, READY, COMPLETE)
    // ============================================================================

    const getCanonicalStatus = (stage: number): 'LOCKED' | 'READY' | 'COMPLETE' => {
        if (!data) return 'LOCKED';
        const { tenant, latestRoadmap } = data; // diagnosticStatus removed if unused, or kept if needed.

        // s1: Intake (Source: intakeWindowState)
        const s1 = tenant.intakeWindowState === 'CLOSED' ? 'COMPLETE' : 'READY';
        if (stage === 1) return s1;

        // s2: Executive Brief (Consultation Anchor)
        // Requirement: "Brief Reviewed" or "Approved"
        const s2Fact = ['APPROVED', 'REVIEWED'].includes(tenant.executiveBriefStatus || '');
        const s2 = (s2Fact && s1 === 'COMPLETE') ? 'COMPLETE' : (s1 === 'COMPLETE' ? 'READY' : 'LOCKED');
        if (stage === 2) return s2;

        // s3: Diagnostic (Source: latestDiagnostic from diagnostics table)
        const diagExists = !!data.latestDiagnostic;
        const diagPublished = data.latestDiagnostic?.status === 'published';
        // Requirement: "Diagnostics generation requires ONLY: intake locked."
        // Checks s1 ONLY.
        const s3 = (diagExists && s1 === 'COMPLETE') ? 'COMPLETE' : (s1 === 'COMPLETE' ? 'READY' : 'LOCKED');
        if (stage === 3) return s3;

        // s4: Discovery NOTES (Step 4)
        const s4Fact = truthProbe?.discovery?.exists || false;
        const s4 = (s4Fact && diagPublished) ? 'COMPLETE' : (diagPublished ? 'READY' : 'LOCKED');
        if (stage === 4) return s4;

        // s5: Assisted Synthesis & Findings Declaration (Step 5)
        const s5Fact = truthProbe?.findings?.exists || false;
        const s5 = (s5Fact && s4 === 'COMPLETE') ? 'COMPLETE' : (s4 === 'COMPLETE' ? 'READY' : 'LOCKED');
        if (stage === 5) return s5;

        // s6: Ticket Moderation (Step 6)
        const ticketsExist = (truthProbe?.tickets?.total || 0) > 0;
        const moderationComplete = ticketsExist && (truthProbe?.tickets?.pending || 0) === 0;
        if (stage === 6) {
            if (s5 !== 'COMPLETE') return 'LOCKED';
            if (moderationComplete) return 'COMPLETE';
            return 'READY';
        }

        // s7: Roadmap Generation (Step 7)
        const s7Fact = !!latestRoadmap;
        if (stage === 7) {
            if (!moderationComplete) return 'LOCKED';
            return s7Fact ? 'COMPLETE' : 'READY';
        }

        return 'LOCKED';
    };

    const getStatusStyles = (status: 'LOCKED' | 'READY' | 'COMPLETE') => {
        switch (status) {
            case 'COMPLETE':
                return {
                    container: 'bg-emerald-900/20 border-emerald-500/50 text-emerald-400',
                    dot: 'bg-emerald-500'
                };
            case 'READY':
                return {
                    container: 'bg-yellow-900/20 border-yellow-500/50 text-yellow-400',
                    dot: 'bg-yellow-500'
                };
            case 'LOCKED':
            default:
                return {
                    container: 'bg-red-900/20 border-red-500/50 text-red-500',
                    dot: 'bg-red-500'
                };
        }
    };

    const getStakeholderDotColor = (role: IntakeRoleDefinition) => {
        if (role.intakeStatus === 'COMPLETED') return 'bg-emerald-500'; // COMPLETE -> GREEN
        if (role.isAccepted) return 'bg-yellow-500'; // READY -> YELLOW
        return 'bg-red-500'; // LOCKED -> RED
    };

    // Snapshot fetch
    useEffect(() => {
        if (params?.tenantId && category === AuthorityCategory.EXECUTIVE) {
            setSnapshotLoading(true);
            superadminApi.getSnapshot(params.tenantId)
                .then(res => setSnapshotData(res.data))
                .catch(err => {
                    console.warn('[Snapshot] Fetch error:', err);
                    // Handle 404 SNAPSHOT_NOT_READY gracefully
                    if (err?.status === 404 || err?.error === 'SNAPSHOT_NOT_READY') {
                        console.log('[Snapshot] Not ready yet - prerequisites not met');
                        setSnapshotData(null); // Set to null to render "not ready" state
                    } else {
                        console.error('[Snapshot] Unexpected error:', err);
                        setSnapshotData(null);
                    }
                })
                .finally(() => setSnapshotLoading(false));
        }
    }, [params?.tenantId, category]);

    const handleExecuteDiagnostic = async () => {
        if (!params?.tenantId) return;

        setIsGenerating(true);

        try {
            await superadminApi.generateSop01(params.tenantId);
            // Refresh detail to get the latest diagnostic ID if needed
            await refreshData();
        } catch (err: any) {
            console.error('Diagnostic error:', err);
            setError(`Synthesis Error: ${err.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleFinalizeRoadmap = async () => {
        if (!params?.tenantId) return;

        setIsGenerating(true);

        try {
            await superadminApi.assembleRoadmap(params.tenantId);
            await refreshData();
        } catch (err: any) {
            console.error('Finalization error:', err);
            // Handle 428 Precondition Required (Roadmap Not Ready)
            // Note: checks both err.status and err.response.status for compatibility
            const status = err?.status || err?.response?.status;

            if (status === 428) {
                const data = err.response?.data;
                const details = data?.prerequisites
                    ? [
                        !data.prerequisites.hasApprovedBrief ? 'Executive Brief not valid' : null,
                        !data.prerequisites.hasDiagnostic ? 'No Active Diagnostic found' : null,
                        data.prerequisites.approvedTicketCount === 0 ? 'No Approved Tickets' : null
                    ].filter(Boolean)
                    : [];

                const msg = details.length > 0
                    ? `Roadmap Not Ready. Missing prerequisites:\n- ${details.join('\n- ')}`
                    : (data?.message || 'Roadmap Not Ready: Prerequisites not met.');

                window.alert(msg);
            } else {
                setError(`Finalization Error: ${err.message}`);
            }
        } finally {
            setIsGenerating(false);
        }
    };

    // Phase 4: Handlers
    const handleAddRole = async (role: Omit<IntakeRoleDefinition, 'id' | 'inviteStatus' | 'intakeStatus'>) => {
        if (!params?.tenantId) return;

        try {
            const { vector } = await superadminApi.createIntakeVector(params.tenantId, role);

            // Optimistic update
            setIntakeRoles([...intakeRoles, {
                ...vector,
                inviteStatus: vector.inviteStatus || 'NOT_SENT',
                intakeStatus: vector.intakeStatus || 'NOT_STARTED'
            }]);
        } catch (err: any) {
            console.error('Failed to create intake vector:', err);
            setError(`Failed to create stakeholder: ${err.message}`);
        }
    };

    const handleInvite = async (roleId: string) => {
        try {
            const { vector } = await superadminApi.sendIntakeVectorInvite(roleId);

            // Update status
            setIntakeRoles((roles: IntakeRoleDefinition[]) =>
                roles.map((r: IntakeRoleDefinition) =>
                    r.id === roleId ? { ...r, inviteStatus: vector.inviteStatus || 'SENT' } : r
                )
            );
        } catch (err: any) {
            console.error('Failed to send invite:', err);
            setError(`Failed to send invite: ${err.message}`);
        }
    };

    // ============================================================================
    // META-TICKET V2: EXECUTION HANDLERS
    // ============================================================================

    const handleLockIntake = async () => {
        if (!params?.tenantId) return;
        if (!window.confirm('Confirm Intake Lock? This freezes the intake window.')) return;
        setIsGenerating(true);
        try {
            await superadminApi.lockIntake(params.tenantId);
            await refreshData();
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateDiagnostic = async () => {
        if (!params?.tenantId) return;
        if (isGenerating) return;  // ✅ Guard against double-click
        setIsGenerating(true);
        try {
            await superadminApi.generateDiagnostics(params.tenantId);
            await refreshData();
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    // Lock & Publish Diagnostic require diagnosticId
    const handleGenerateTickets = async () => {
        if (!params?.tenantId || !data?.tenant?.lastDiagnosticId) return;
        if (isGenerating) return;
        setIsGenerating(true);
        try {
            await superadminApi.generateTickets(params.tenantId, data.tenant.lastDiagnosticId);
            await refreshData();
        } catch (err: any) {
            console.error('Ticket Generation Error:', err);
            setError(err.message || 'Failed to generate tickets');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleActivateModeration = async () => {
        console.log('[DEBUG] handleActivateModeration triggered for tenant:', params?.tenantId);
        if (!params?.tenantId) {
            console.error('[DEBUG] Missing tenantId in params');
            return;
        }

        const confirmed = window.confirm('This will start a new moderation cycle tied to the current canonical findings. Legacy tickets will not be used. Proceed?');
        console.log('[DEBUG] User confirmation:', confirmed);
        if (!confirmed) return;

        console.log('[DEBUG] Setting isGenerating=true');
        setIsGenerating(true);
        try {
            console.log('[DEBUG] Calling superadminApi.activateTicketModeration...');
            const result = await superadminApi.activateTicketModeration(params.tenantId);
            console.log('[DEBUG] Activation result:', result);
            await refreshData();
            console.log('[DEBUG] Refresh done');
        } catch (err: any) {
            console.error('[DEBUG] Moderation Activation Error:', err);
            setError(err.message || 'Failed to activate moderation');
        } finally {
            console.log('[DEBUG] Setting isGenerating=false');
            setIsGenerating(false);
        }
    };

    const handleLockDiagnostic = async () => {
        if (!params?.tenantId || !data?.latestDiagnostic?.id) return;
        if (!window.confirm('Lock Diagnostic? This prevents further regeneration.')) return;
        setIsGenerating(true);
        try {
            await superadminApi.lockDiagnostic(params.tenantId, data.latestDiagnostic.id);
            await refreshData();
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePublishDiagnostic = async () => {
        if (!params?.tenantId || !data?.latestDiagnostic?.id) return;
        if (!window.confirm('Publish Diagnostic? This makes artifacts visible to Discovery.')) return;
        setIsGenerating(true);
        try {
            await superadminApi.publishDiagnostic(params.tenantId, data.latestDiagnostic.id);
            await refreshData();
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleIngestDiscovery = async (notes: import('@roadmap/shared').CanonicalDiscoveryNotes) => {
        if (!params?.tenantId) return;

        setDiscoverySaving(true);
        try {
            await superadminApi.ingestDiscoveryNotes(params.tenantId, notes);
            setDiscoveryOpen(false);
            await refreshData();
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setDiscoverySaving(false);
        }
    };


    const handleCloseIntake = async () => {
        if (!params?.tenantId) return;
        if (!window.confirm('CRITICAL: This will freeze the intake window and generate a snapshot. This action cannot be undone. Proceed?')) return;

        setIsGenerating(true);
        try {
            await superadminApi.closeIntakeWindow(params.tenantId);
            await refreshData();
        } catch (err: any) {
            console.error('Close intake error:', err);
            setError(`Closure Error: ${err.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    // Modal Data Fetch Functions
    const loadExecBriefData = async () => {
        if (!params?.tenantId) return;
        setExecBriefLoading(true);
        setExecBriefError(null);
        try {
            const response = await superadminApi.getExecutiveBrief(params.tenantId);
            const brief = response.brief;

            if (!brief) {
                setExecBriefError('No executive brief found');
                setExecBriefData(null);
                return;
            }

            // Map backend structure to modal-expected format
            // The brief has a 'synthesis' JSONB field with sections
            setExecBriefData({
                status: brief.status,
                synthesis: brief.synthesis, // Pass the whole synthesis object for tabs
                createdAt: brief.generatedAt || brief.createdAt,
                approvedAt: brief.approvedAt,
            });
        } catch (err: any) {
            console.error('Failed to load executive brief:', err);
            setExecBriefError(err.message || 'Failed to load executive brief');
            setExecBriefData(null);
        } finally {
            setExecBriefLoading(false);
        }
    };

    const loadDiagnosticData = async () => {
        if (!data?.latestDiagnostic?.id) {
            setDiagError('No diagnostic available');
            return;
        }
        setDiagLoading(true);
        setDiagError(null);
        try {
            const response = await superadminApi.getDiagnosticArtifacts(data.latestDiagnostic.id);

            // Map backend response to modal format
            setDiagData({
                status: response.diagnostic.status,
                createdAt: response.diagnostic.createdAt,
                outputs: {
                    overview: response.outputs.overview,
                    aiOpportunities: response.outputs.aiOpportunities,
                    roadmapSkeleton: response.outputs.roadmapSkeleton,
                    discoveryQuestions: response.outputs.discoveryQuestions,
                },
            });
        } catch (err: any) {
            console.error('Failed to load diagnostic:', err);
            setDiagError(err.message || 'Failed to load diagnostic');
            setDiagData(null);
        } finally {
            setDiagLoading(false);
        }
    };

    // Modal Open Handlers
    const openExecBriefModal = async () => {
        setExecBriefOpen(true);
        await loadExecBriefData();
    };

    const openDiagnosticModal = async () => {
        setDiagOpen(true);
        await loadDiagnosticData();
    };

    // Modal Close Handlers
    const closeExecBriefModal = async () => {
        setExecBriefOpen(false);
        setExecBriefData(null);
        setExecBriefError(null);
        await refreshData(); // Refresh in case any actions were taken
    };

    const openDiscoveryModal = async () => {
        setDiscoveryOpen(true);
        if (!diagData && data?.latestDiagnostic?.id) {
            await loadDiagnosticData();
        }
    };

    const openSynthesisModal = async () => {
        setSynthesisOpen(true);
        // Load discovery notes
        try {
            const res = await superadminApi.getDiscoveryNotes(params.tenantId);
            setSynthesisNotes(res.notes);
        } catch (err) {
            console.error('Failed to load discovery notes for synthesis:', err);
        }
        // Ensure other artifacts are loaded
        if (!diagData) await loadDiagnosticData();
        if (!execBriefData) await loadExecBriefData();
    };

    const closeDiagnosticModal = async () => {
        setDiagOpen(false);
        setDiagData(null);
        setDiagError(null);
        await refreshData(); // Refresh in case any actions were taken
    };


    if (loading) return <div className="flex items-center justify-center min-h-screen text-slate-400">Loading firm details...</div>;
    if (error) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="p-6 bg-red-900/20 border border-red-500/50 rounded-lg max-w-2xl">
                <h2 className="text-red-400 font-bold text-sm uppercase mb-2">BLOCKED: Backend Error</h2>
                <p className="text-red-300 text-sm">Backend error fetching execution data. This surface is fail-closed until resolved.</p>
                <p className="text-red-400/70 text-xs mt-2">Error: {error}</p>
            </div>
        </div>
    );
    if (!params?.tenantId || !data) return <div className="p-6 text-slate-400">Missing tenant data.</div>;

    const { tenant, owner, teamMembers, intakes, recentActivity, diagnosticStatus, latestRoadmap } = data;

    // Filter exec-only actions from activity log (Defense-in-depth)
    const filteredActivity = recentActivity.filter((event) => {
        const execOnlyEvents = ['exec_brief_acknowledged', 'exec_brief_waived', 'strategic_framing_changed'];
        return !execOnlyEvents.includes(event.eventType);
    });



    return (
        <div className="flex min-h-screen bg-slate-950">

            {/* Main Content - Right Side */}
            <div className="flex-1 space-y-6 p-8 max-w-7xl mx-auto">
                {/* PANEL 1: Identity & Status */}
                <section id="panel-identity-status">
                    <header className="border-b border-slate-800 pb-6 flex items-start justify-between">
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight text-white mb-2">{tenant.name}</h1>
                            <div className="flex items-center gap-4 text-sm text-slate-400">
                                <span>{tenant.ownerName}</span>
                                <span className="w-1 h-1 bg-slate-700 rounded-full" />
                                <span>Created {new Date(tenant.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className="px-3 py-1 bg-indigo-900/30 border border-indigo-700/50 rounded-full text-[10px] font-bold uppercase tracking-widest text-indigo-300">
                                Authority Control Plane
                            </div>
                            {/* Phase Badge - SA-EXEC-BRIEF-FREEZE-TAG-1 */}
                            {tenant.executionPhase && (
                                <div className={`
                                    px-3 py-1 border rounded-full text-[10px] font-bold uppercase tracking-widest
                                    ${tenant.executionPhase === 'EXEC_BRIEF_APPROVED'
                                        ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400'
                                        : tenant.executionPhase === 'EXEC_BRIEF_DRAFT'
                                            ? 'bg-amber-900/30 border-amber-500/50 text-amber-400'
                                            : 'bg-slate-800/50 border-slate-700 text-slate-400'}
                                `}>
                                    {tenant.executionPhase.replace(/_/g, ' ')}
                                </div>
                            )}
                        </div>
                    </header>

                    {/* Compact Summary Strip */}
                    <div className="mt-4 py-2 px-3 bg-slate-900/30 border border-slate-800 rounded-lg flex items-center gap-6 text-[11px] text-slate-400">
                        <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 font-medium">Status:</span>
                            <span className="text-slate-300">{tenant.status}</span>
                        </div>
                        <div className="w-px h-3 bg-slate-800" />
                        <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 font-medium">Cohort:</span>
                            <span className="text-slate-300">{tenant.cohortLabel || '—'}</span>
                        </div>
                        <div className="w-px h-3 bg-slate-800" />
                        <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 font-medium">Market:</span>
                            <span className="text-slate-300">{tenant.region || '—'}</span>
                        </div>
                        <div className="w-px h-3 bg-slate-800" />
                        <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 font-medium">Intake:</span>
                            <span className="text-slate-300">
                                {tenant.intakeWindowState === 'CLOSED' ? 'CLOSED' : `${intakes.filter(i => i.status === 'completed').length}/${intakes.length} COMPLETE`}
                            </span>
                        </div>
                        <div className="w-px h-3 bg-slate-800" />
                        <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 font-medium">Stakeholders:</span>
                            <span className="text-slate-300">{intakeRoles.length}</span>
                        </div>
                    </div>
                </section>

                {/* Strategic Stakeholders */}
                <AuthorityGuard requiredCategory={AuthorityCategory.EXECUTIVE}>
                    <StrategicStakeholdersPanel
                        roles={intakeRoles}
                        intakes={data?.intakes || []}
                        onAddRole={handleAddRole}
                        onViewIntake={(intake) => {
                            setSelectedIntake(intake);
                            setIntakeModalOpen(true);
                        }}
                        stakeholderDotColorHelper={getStakeholderDotColor}
                        readOnly={tenant.intakeWindowState === 'CLOSED'}
                    />
                </AuthorityGuard>

                {/* MAIN EXECUTION GRID: Simple spine + contextual panels */}
                <div className="grid grid-cols-[240px_1fr] gap-4">


                    {/* LEFT: Dynamic Authority Spine */}
                    <aside className="space-y-4">
                        {/* TRUTH PROBE - Collapsed by default */}
                        {truthProbe && (
                            showTruthProbe ? (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="flex justify-end mb-1">
                                        <button
                                            onClick={() => setShowTruthProbe(false)}
                                            className="text-[9px] text-slate-500 hover:text-slate-300 flex items-center gap-1 uppercase tracking-wider font-bold"
                                        >
                                            Hide <span className="text-base leading-none">×</span>
                                        </button>
                                    </div>
                                    <TruthProbeCard data={truthProbe} />
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowTruthProbe(true)}
                                    className="w-full text-left py-2 px-3 bg-slate-900/30 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="text-[10px] text-slate-400 space-y-0.5">
                                            <div className="font-bold uppercase tracking-widest text-slate-500 mb-1">Truth</div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span>Brief: <span className="text-slate-300">{truthProbe.brief?.status || 'N/A'}</span></span>
                                                <span className="text-slate-700">•</span>
                                                <span>Diag: <span className="text-slate-300">{truthProbe.diagnostic?.status || 'N/A'}</span></span>
                                                <span className="text-slate-700">•</span>
                                                <span>Tickets: <span className="text-slate-300">{truthProbe.tickets?.approved || 0}/{truthProbe.tickets?.total || 0}</span></span>
                                            </div>
                                        </div>
                                        <svg className="w-3 h-3 text-slate-600 group-hover:text-slate-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </button>
                            )
                        )}
                        {truthProbeLoading && <div className="text-xs text-slate-500 text-center animate-pulse py-2">Checking lifecycle...</div>}
                        {truthProbeError && <div className="text-[10px] text-red-500 bg-red-900/10 p-2 rounded border border-red-900/20">{truthProbeError}</div>}

                        <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4">
                            Execution Authority
                        </div>

                        <div className="space-y-2">
                            {/* Dynamically render gates from the gate array */}
                            {(() => {
                                // Define gates inline for this section
                                const gates = [
                                    {
                                        id: 1,
                                        label: 'Intake',
                                        status: getCanonicalStatus(1),
                                        action: getCanonicalStatus(1) === 'READY' ? (
                                            <button
                                                onClick={handleLockIntake}
                                                className="mt-2 text-[10px] uppercase font-bold text-indigo-400 hover:text-indigo-300 border border-indigo-900/50 bg-indigo-950/30 px-3 py-1.5 rounded transition-colors"
                                            >
                                                Lock Intake
                                            </button>
                                        ) : null
                                    },
                                    {
                                        id: 2,
                                        label: 'Executive Brief',
                                        status: getCanonicalStatus(2),
                                        action: null // Brief approval happens in modal
                                    },
                                    {
                                        id: 3,
                                        label: 'Diagnostic',
                                        status: getCanonicalStatus(3),
                                        // Complex Action Logic for Diagnostic
                                        action: (() => {
                                            const status = getCanonicalStatus(3);
                                            const granularStatus = data.latestDiagnostic?.status || 'generated';

                                            // V2 Canon: Intake Locked -> Generate.
                                            if (status === 'READY') {
                                                return (
                                                    <button
                                                        onClick={handleGenerateDiagnostic}
                                                        className="mt-2 text-[10px] uppercase font-bold text-indigo-400 hover:text-indigo-300 border border-indigo-900/50 bg-indigo-950/30 px-3 py-1.5 rounded transition-colors"
                                                    >
                                                        Generate
                                                    </button>
                                                );
                                            }

                                            // If COMPLETE (Generated), rely on TruthProbe state
                                            if (status === 'COMPLETE') {
                                                if (granularStatus === 'generated') {
                                                    return (
                                                        <div className="flex gap-2 mt-2">
                                                            <button
                                                                onClick={handleLockDiagnostic}
                                                                disabled={isGenerating}
                                                                className="text-[10px] uppercase font-bold text-amber-400 hover:text-amber-300 border border-amber-900/50 bg-amber-950/30 px-3 py-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                Lock
                                                            </button>
                                                            <button
                                                                onClick={handleGenerateDiagnostic}
                                                                disabled={isGenerating}
                                                                className="text-[10px] uppercase font-bold text-indigo-400 hover:text-indigo-300 border border-indigo-900/50 bg-indigo-950/30 px-3 py-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                Regen
                                                            </button>
                                                        </div>
                                                    );
                                                }
                                                if (granularStatus === 'locked') {
                                                    return (
                                                        <button
                                                            onClick={handlePublishDiagnostic}
                                                            className="mt-2 text-[10px] uppercase font-bold text-emerald-400 hover:text-emerald-300 border border-emerald-900/50 bg-emerald-950/30 px-3 py-1.5 rounded transition-colors"
                                                        >
                                                            Publish
                                                        </button>
                                                    );
                                                }
                                                if (granularStatus === 'published') {
                                                    // Allow re-generation?
                                                    return (
                                                        <div className="flex gap-2 mt-2">
                                                            <span className="text-[10px] font-bold text-emerald-500 py-1.5">PUBLISHED</span>
                                                            <button
                                                                onClick={handleGenerateDiagnostic}
                                                                className="text-[10px] uppercase font-bold text-indigo-400 hover:text-indigo-300 px-2 py-1.5 border border-indigo-900/30 rounded"
                                                            >
                                                                Regen
                                                            </button>
                                                        </div>
                                                    );
                                                }
                                            }
                                            return null;
                                        })()
                                    },
                                    {
                                        id: 4,
                                        label: 'Discovery Notes (Raw)',
                                        status: getCanonicalStatus(4),
                                        action: (() => {
                                            const status = getCanonicalStatus(4);
                                            if (status === 'READY' || status === 'COMPLETE') {
                                                return (
                                                    <button
                                                        onClick={openDiscoveryModal}
                                                        className="mt-2 text-[10px] uppercase font-bold text-indigo-400 hover:text-indigo-300 border border-indigo-900/50 bg-indigo-950/30 px-3 py-1.5 rounded transition-colors"
                                                    >
                                                        {status === 'COMPLETE' ? 'Edit Raw Notes' : 'Ingest Notes (Raw)'}
                                                    </button>
                                                );
                                            }
                                            return null;
                                        })()
                                    },
                                    {
                                        id: 5,
                                        label: 'Assisted Synthesis',
                                        status: getCanonicalStatus(5),
                                        action: (() => {
                                            const status = getCanonicalStatus(5);
                                            if (status === 'READY' || status === 'COMPLETE') {
                                                return (
                                                    <button
                                                        onClick={openSynthesisModal}
                                                        className="mt-2 text-[10px] uppercase font-bold text-indigo-400 hover:text-indigo-300 border border-indigo-900/50 bg-indigo-950/30 px-3 py-1.5 rounded transition-colors"
                                                    >
                                                        Review & Reason With Agent
                                                    </button>
                                                );
                                            }
                                            return null;
                                        })()
                                    },
                                    {
                                        id: 6,
                                        label: 'Ticket Moderation',
                                        status: getCanonicalStatus(6),
                                        action: (() => {
                                            const status = getCanonicalStatus(6);
                                            const ticketsExist = (truthProbe?.tickets?.total || 0) > 0;

                                            if (status === 'READY' && !ticketsExist) {
                                                return (
                                                    <button
                                                        onClick={handleActivateModeration}
                                                        disabled={isGenerating}
                                                        className="mt-2 text-[10px] uppercase font-bold text-amber-400 hover:text-amber-300 border border-amber-900/50 bg-amber-950/30 px-3 py-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                        {isGenerating ? 'Activating...' : 'Begin Ticket Moderation'}
                                                    </button>
                                                );
                                            }
                                            return null;
                                        })()
                                    },
                                    {
                                        id: 7,
                                        label: 'Roadmap Generation',
                                        status: getCanonicalStatus(7),
                                        action: null
                                    }
                                ];

                                return gates.map((gate) => {
                                    const styles = getStatusStyles(gate.status);
                                    return (
                                        <div
                                            key={gate.id}
                                            className={`p-4 rounded-xl border-2 flex flex-col gap-2 ${styles.container}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-3 h-3 rounded-full shrink-0 ${styles.dot}`} />
                                                <div>
                                                    <div className="font-bold tracking-tight text-white">{gate.label}</div>
                                                    <div className="text-[10px] uppercase font-bold tracking-widest opacity-70">
                                                        {gate.id === 4 && gate.status === 'COMPLETE' ? 'INGESTED (RAW)' : gate.status}
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Action Area */}
                                            {gate.action && (
                                                <div className="pl-7">
                                                    {gate.action}
                                                </div>
                                            )}
                                        </div>
                                    );
                                });
                            })()}
                        </div>



                        {/* Execute Final Roadmap Button */}
                        {moderationStatus?.readyForRoadmap && (
                            <button
                                onClick={handleFinalizeRoadmap}
                                disabled={isGenerating}
                                className="w-full mt-2 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-bold rounded transition-all uppercase tracking-wider"
                            >
                                {isGenerating ? 'Processing...' : 'Execute Final Roadmap'}
                            </button>
                        )}
                    </aside>

                    {/* RIGHT: Contextual panels */}
                    <main className="space-y-4">

                        {/* 0. ROI Baseline Summary - Collapsible */}
                        {showBaselinePanel ? (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="flex justify-end mb-1">
                                    <button
                                        onClick={() => setShowBaselinePanel(false)}
                                        className="text-[9px] text-slate-500 hover:text-slate-300 flex items-center gap-1 uppercase tracking-wider font-bold"
                                    >
                                        Hide <span className="text-base leading-none">×</span>
                                    </button>
                                </div>
                                <BaselineSummaryPanel
                                    tenantId={tenant.id}
                                    hasRoadmap={!!latestRoadmap}
                                />
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowBaselinePanel(true)}
                                className="w-full text-left py-2 px-3 bg-slate-900/30 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="text-[10px] text-slate-400">
                                        <div className="font-bold uppercase tracking-widest text-slate-500 mb-0.5">ROI Baseline Summary</div>
                                        <div className="text-[9px] text-slate-600">Owner intake metrics</div>
                                    </div>
                                    <svg className="w-3 h-3 text-slate-600 group-hover:text-slate-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </button>
                        )}

                        {/* 1. Strategic Context & Capacity ROI - Collapsed by default */}
                        {tenant.intakeWindowState === 'CLOSED' && (
                            showROIPanel ? (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="flex justify-end mb-1">
                                        <button
                                            onClick={() => setShowROIPanel(false)}
                                            className="text-[9px] text-slate-500 hover:text-slate-300 flex items-center gap-1 uppercase tracking-wider font-bold"
                                        >
                                            Hide <span className="text-base leading-none">×</span>
                                        </button>
                                    </div>
                                    <ExecutiveSnapshotPanel
                                        data={snapshotData}
                                        loading={snapshotLoading}
                                    />
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowROIPanel(true)}
                                    className="w-full text-left py-2 px-3 bg-slate-900/30 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="text-[10px] text-slate-400">
                                            <div className="font-bold uppercase tracking-widest text-slate-500 mb-0.5">Strategic Context & ROI</div>
                                            <div className="text-[9px] text-slate-600">No active signals yet</div>
                                        </div>
                                        <span className="text-slate-600 group-hover:text-slate-500 transition-colors">▸</span>
                                    </div>
                                </button>
                            )
                        )}

                        {/* 2. Executive Brief (modal-only review) */}
                        <AuthorityGuard requiredCategory={AuthorityCategory.EXECUTIVE}>
                            {(() => {
                                const status = tenant.executiveBriefStatus;
                                const isComplete = status && ['APPROVED', 'ACKNOWLEDGED', 'WAIVED'].includes(status);

                                if (!isComplete) return null;

                                return (
                                    <BriefCompleteCard
                                        status={status}
                                        onReview={openExecBriefModal}
                                    />
                                );
                            })()}
                        </AuthorityGuard>



                        {/* @ANCHOR:SA_FIRM_DETAIL_DIAGNOSTIC_REVIEW_SLOT */}

                        {/* 3.5 Diagnostic Review (modal-only) */}
                        {tenant.lastDiagnosticId && (
                            <DiagnosticCompleteCard
                                status="GENERATED"
                                onReview={openDiagnosticModal}
                            />
                        )}
                        {/* 3. Ticket Moderation (Waterfall Step 4) */}
                        {tenant.intakeWindowState === 'CLOSED' && (
                            <AuthorityGuard requiredCategory={AuthorityCategory.EXECUTIVE}>
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase font-extrabold mb-2">Ticket Moderation {tenant.lastDiagnosticId ? '(Active)' : '(Pending)'}</div>

                                    {tenant.lastDiagnosticId ? (
                                        <div className="space-y-4">
                                            {/* Stage 6 Activation Trigger */}
                                            {getCanonicalStatus(5) === 'COMPLETE' && !truthProbe?.tickets?.isDraft && (
                                                <div className="p-6 bg-indigo-900/10 border border-indigo-500/30 rounded-xl mb-4">
                                                    <div className="flex items-center justify-between gap-6">
                                                        <div className="flex-1">
                                                            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-tight">Stage 6: Ticket Moderation Required</h3>
                                                            <p className="text-xs text-slate-400 mt-1">Assisted synthesis is complete. Materialize findings into draft tickets to begin moderation.</p>
                                                        </div>
                                                        <button
                                                            onClick={handleActivateModeration}
                                                            disabled={isGenerating}
                                                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                                                        >
                                                            {isGenerating ? 'Activating...' : 'Begin Ticket Moderation'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            <DiagnosticModerationSurface
                                                tenantId={tenant.id}
                                                diagnosticId={tenant.lastDiagnosticId}
                                                onStatusChange={setModerationStatus}
                                            />
                                        </div>
                                    ) : (
                                        <div className="p-6 border border-slate-800 border-dashed rounded-lg flex flex-col items-center justify-center text-center opacity-60">
                                            <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center mb-3">
                                                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                            </div>
                                            <h3 className="text-sm font-medium text-slate-400">Diagnostic Not Generated</h3>
                                            <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                                                Ticket moderation will be available once the diagnostic synthesis is complete.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </AuthorityGuard>
                        )}


                        {/* 4. Roadmap Readiness (when available) */}
                        {tenant.intakeWindowState === 'CLOSED' && moderationStatus?.readyForRoadmap && (
                            <AuthorityGuard requiredCategory={AuthorityCategory.EXECUTIVE}>
                                <RoadmapReadinessPanel
                                    tenantId={tenant.id}
                                    intakeWindowState={tenant.intakeWindowState}
                                    briefStatus={tenant.executiveBriefStatus || null}
                                    moderationStatus={moderationStatus ? {
                                        readyForRoadmap: moderationStatus.readyForRoadmap,
                                        pending: moderationStatus.pending,
                                        approved: moderationStatus.approved
                                    } : null}
                                    roadmapStatus={data.latestRoadmap?.status || data.roadmaps?.[0]?.status || null}
                                    onFinalize={handleFinalizeRoadmap}
                                    isGenerating={isGenerating}
                                    readinessFlags={{
                                        knowledgeBaseReady: !!tenant.lastDiagnosticId,
                                        rolesValidated: true,
                                        execReady: tenant.executiveBriefStatus === 'APPROVED'
                                    }}
                                />
                            </AuthorityGuard>
                        )}
                    </main>
                </div>

                {/* Role Simulation Control (V2 - Verification Tool) */}
                <RoleSimulator />

                {/* @ANCHOR:SA_FIRM_DETAIL_MODAL_MOUNT */}
                {/* Review Modals */}
                <ExecutiveBriefModal
                    open={isExecBriefOpen}
                    onClose={closeExecBriefModal}
                    data={execBriefData}
                    status={execBriefData?.status || tenant.executiveBriefStatus}
                />

                <DiagnosticReviewModal
                    open={isDiagOpen}
                    onClose={closeDiagnosticModal}
                    data={diagData}
                    status={diagData?.status || data?.latestDiagnostic?.status || 'GENERATED'}
                />

                <DiscoveryNotesModal
                    open={isDiscoveryOpen}
                    onClose={() => setDiscoveryOpen(false)}
                    onSave={handleIngestDiscovery}
                    isSaving={discoverySaving}
                    referenceQuestions={diagData?.outputs?.discoveryQuestions}
                />

                <AssistedSynthesisModal
                    open={isSynthesisOpen}
                    onClose={() => setSynthesisOpen(false)}
                    tenantId={params.tenantId}
                    artifacts={{
                        discoveryNotes: synthesisNotes,
                        diagnostic: diagData,
                        executiveBrief: execBriefData
                    }}
                    onRefresh={refreshData}
                />


                {/* Intake Modal */}
                {intakeModalOpen && selectedIntake && (
                    <IntakeModal
                        intake={selectedIntake}
                        intakeWindowState={tenant?.intakeWindowState || 'CLOSED'}
                        onClose={() => {
                            setIntakeModalOpen(false);
                            setSelectedIntake(null);
                        }}
                        onRefresh={() => {
                            // Refresh firm detail data
                            window.location.reload();
                        }}
                    />
                )}
            </div>
        </div>
    );
}

// Sub-components for clean structure

// KPI Card for top metrics row
function KPICard({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 font-bold">
                {label}
            </div>
            <div className="text-lg font-bold text-slate-200">
                {value}
            </div>
        </div>
    );
}

// Strategic Stakeholders Panel (horizontal layout)
function StrategicStakeholdersPanel({
    roles,
    intakes,
    onAddRole,
    onViewIntake,
    readOnly,
    stakeholderDotColorHelper
}: {
    roles: IntakeRoleDefinition[];
    intakes: any[];
    onAddRole: (role: any) => void;
    onViewIntake: (intake: any) => void;
    readOnly: boolean;
    stakeholderDotColorHelper: (role: IntakeRoleDefinition) => string;
}) {
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    const handleSubmit = async (data: any) => {
        await onAddRole(data);
        setIsModalOpen(false);
    };

    return (
        <>
            {/* Flattened: No container, just label + cards */}
            <div>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3">Strategic Stakeholders</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {roles.map(role => {
                        const intakeComplete = role.intakeStatus === 'COMPLETED';

                        return (
                            <div
                                key={role.id}
                                className="bg-slate-950/50 border border-slate-800 rounded-lg p-4 relative group hover:border-slate-600 transition-all"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-slate-200 mb-1">{role.recipientName}</div>
                                        <div className="text-xs text-slate-500 truncate">{role.recipientEmail}</div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <div className="inline-block px-2 py-1 bg-indigo-900/30 border border-indigo-700/50 text-indigo-300 text-[10px] rounded uppercase tracking-wider">
                                            {role.roleLabel}
                                        </div>
                                        <div className={`w-2.5 h-2.5 rounded-full ${stakeholderDotColorHelper(role)} shadow-[0_0_8px_rgba(16,185,129,0.4)]`} />
                                    </div>
                                </div>


                                {/* Hover Overlay with View Intake Button */}
                                {intakeComplete && (
                                    <div className="absolute inset-0 bg-slate-900/95 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center z-10 pointer-events-none group-hover:pointer-events-auto">
                                        <button
                                            onClick={(e: React.MouseEvent) => {
                                                e.stopPropagation();
                                                console.log('DEBUG: View Intake click info:');
                                                console.log('- role object:', role);
                                                console.log('- first intake in array:', intakes[0]);
                                                console.log('- intakes array length:', intakes.length);

                                                // Find the full intake data
                                                const fullIntake = intakes.find((i: any) =>
                                                    (role.intakeId && i.id === role.intakeId) ||
                                                    i.id === role.id ||
                                                    i.vectorId === role.id
                                                );
                                                console.log('DEBUG: Found intake result:', fullIntake);

                                                if (fullIntake) {
                                                    onViewIntake(fullIntake);
                                                } else {
                                                    console.error('DEBUG ERROR: No intake found for role ID:', role.id);
                                                    console.log('DEBUG: Available IDs in intakes:', intakes.map((i: any) => ({ id: i.id, vectorId: i.vectorId })));
                                                }
                                            }}
                                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-lg pointer-events-auto"
                                        >
                                            View Intake
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {!readOnly && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-slate-950/30 border border-dashed border-slate-700 rounded-lg p-4 flex items-center justify-center text-slate-500 hover:text-slate-300 hover:border-slate-500 transition min-h-[72px]"
                        >
                            <div className="text-center">
                                <div className="text-2xl mb-1">+</div>
                                <div className="text-xs uppercase tracking-wider">Add Stakeholder</div>
                            </div>
                        </button>
                    )}
                </div>
            </div>

            {/* Import StakeholderModal at top of file */}
            {isModalOpen && (
                <StakeholderModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleSubmit}
                    loading={false}
                />
            )}
        </>
    );
}


/**
 * RoleSimulator: Subtle verification utility for authority category testing.
 */
function RoleSimulator() {
    const { user, simulateRole } = useAuth();
    const { category } = useSuperAdminAuthority();

    return (
        <div className="fixed bottom-4 right-4 flex flex-col gap-2 p-3 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl z-50">
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1 px-1">Authority Simulation</div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => simulateRole('superadmin')}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${category === AuthorityCategory.EXECUTIVE
                        ? 'bg-purple-600/20 text-purple-400 border border-purple-500/50'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'}`}
                >
                    Executive
                </button>
                <button
                    onClick={() => simulateRole('ops')}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${category === AuthorityCategory.DELEGATE
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'}`}
                >
                    Delegate
                </button>
                <button
                    onClick={() => simulateRole(null)}
                    className="px-2 py-1.5 text-[10px] font-bold text-slate-500 hover:text-white transition-colors"
                >
                    Reset
                </button>
            </div>
            {user && (
                <div className="text-[9px] text-slate-600 font-mono mt-1 px-1">
                    Current: {user.role.toUpperCase()} // Category: {category}
                </div>
            )}
        </div>
    );
}
