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

    // EXEC-BRIEF-UI-ACCEPTANCE-005: Brief-specific error state (non-blocking)
    const [briefActionError, setBriefActionError] = useState<any | null>(null);
    const [lastBriefAction, setLastBriefAction] = useState<'generate' | 'regen' | 'download' | 'deliver' | null>(null);

    // EXEC-BRIEF-SIGNAL-GATE-009A: Threshold metadata (quality pass warning)
    const [briefSignalMetadata, setBriefSignalMetadata] = useState<{
        signalQuality: 'SUFFICIENT' | 'LOW_SIGNAL';
        assertionCount: number;
        targetCount: number;
    } | null>(null);

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
    const [gateLockedMessage, setGateLockedMessage] = useState<string | null>(null);
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

            // Synthesis: If Owner exists but isn't in vectors, add them as a virtual EXECUTIVE stakeholder
            if (firmDetail.owner && !mappedRoles.some(r => r.recipientEmail === firmDetail.owner?.email)) {
                const ownerIntake = firmDetail.intakes.find(i => i.role === 'owner' || i.userEmail === firmDetail.owner?.email);
                mappedRoles.unshift({
                    id: `owner-${firmDetail.owner.id}`,
                    intakeId: ownerIntake?.id,
                    roleLabel: (ownerIntake?.answers as any)?.role_label || 'Strategic Owner',
                    roleType: 'EXECUTIVE',
                    recipientName: firmDetail.owner.name,
                    recipientEmail: firmDetail.owner.email,
                    inviteStatus: 'SENT',
                    intakeStatus: ownerIntake?.status === 'completed' ? 'COMPLETED' :
                        ownerIntake?.status === 'in_progress' ? 'IN_PROGRESS' : 'NOT_STARTED',
                    perceivedConstraints: 'Business Continuity & Strategic Roadmap',
                    anticipatedBlindSpots: 'Internal execution bottlenecks',
                    isAccepted: true
                });
            }

            setIntakeRoles(mappedRoles);
        } catch (err: any) {
            console.error('Error fetching firm detail:', err);
            // If the failure is a business logic gate, show the lock panel instead of crashing the surface
            if (err.errorCode === 'GATE_LOCKED' || err.status === 403) {
                setGateLockedMessage(err.message || 'Next step is currently locked by business logic.');
                setError(null);
            } else {
                setError(err.message);
                setGateLockedMessage(null);
            }
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
        // TRUTH PROBE AUTHORITY (Phase 1)
        if (truthProbe) {
            // s1: Intake
            if (stage === 1) {
                const isClosed = truthProbe.intake.windowState === 'CLOSED';
                const isSufficient = truthProbe.intake.sufficiencyHint === 'COMPLETE';
                return (isClosed || isSufficient) ? 'COMPLETE' : 'READY';
            }

            // s2: Executive Brief
            if (stage === 2) {
                const state = truthProbe.executiveBrief.state;
                const isApproved = ['APPROVED', 'DELIVERED', 'REVIEWED'].includes(state || '');
                if (isApproved) return 'COMPLETE';
                // If intake is complete/sufficient, Brief is READY
                const s1Complete = truthProbe.intake.windowState === 'CLOSED' || truthProbe.intake.sufficiencyHint === 'COMPLETE';
                return s1Complete ? 'READY' : 'LOCKED';
            }

            // s3: Diagnostic
            if (stage === 3) {
                const exists = truthProbe.diagnostic.exists;
                const briefState = truthProbe.executiveBrief.state || '';
                const briefValid = ['APPROVED', 'DELIVERED', 'REVIEWED'].includes(briefState);

                if (exists && briefValid) return 'COMPLETE'; // Weak complete (exists)
                return briefValid ? 'READY' : 'LOCKED';
            }

            // s4: Discovery
            if (stage === 4) {
                if (truthProbe.discovery.exists) return 'COMPLETE';
                return truthProbe.readiness.canRunDiscovery ? 'READY' : 'LOCKED';
            }

            // s5: Findings (Assisted Synthesis)
            if (stage === 5) {
                if (truthProbe.findings.exists) return 'COMPLETE';
                // Ready if Discovery exists
                return truthProbe.discovery.exists ? 'READY' : 'LOCKED';
            }

            // s6: Tickets
            if (stage === 6) {
                // moderated = no pending tickets AND total > 0
                const { total, pending } = truthProbe.tickets;
                const isModerated = total > 0 && pending === 0;
                if (isModerated) return 'COMPLETE';
                return truthProbe.readiness.canModerateTickets ? 'READY' : 'LOCKED';
            }

            // s7: Roadmap
            if (stage === 7) {
                if (truthProbe.roadmap.exists) return 'COMPLETE';
                return truthProbe.readiness.canFinalizeRoadmap ? 'READY' : 'LOCKED';
            }
        }

        // LEGACY FALLBACK (If TruthProbe fails to load side-car)
        if (!data) return 'LOCKED';
        const { tenant, latestRoadmap } = data;

        // s1: Intake (Source: intakeWindowState OR All Roles Complete)
        const allRolesComplete = intakeRoles.length > 0 && intakeRoles.every(r => r.intakeStatus === 'COMPLETED');
        const s1 = (tenant.intakeWindowState === 'CLOSED' || allRolesComplete) ? 'COMPLETE' : 'READY';
        if (stage === 1) return s1;

        // s2: Executive Brief (Consultation Anchor)
        const s2Fact = ['APPROVED', 'ACKNOWLEDGED', 'WAIVED'].includes(tenant.executiveBriefStatus || '');
        const hasOwnerIntake = data.intakes.some((i: any) =>
            (i.role === 'owner' || i.userRole === 'owner' || i.userEmail === data.owner?.email) &&
            i.completedAt
        );
        const hasStakeholders = intakeRoles.length > 0;

        let s2: 'LOCKED' | 'READY' | 'COMPLETE' = 'LOCKED';
        if (s2Fact) {
            s2 = 'COMPLETE';
        } else if (hasOwnerIntake && hasStakeholders) {
            s2 = 'READY';
        }

        if (stage === 2) return s2;

        // s3: Diagnostic (Source: latestDiagnostic from diagnostics table)
        const diagExists = !!data.latestDiagnostic;
        const diagPublished = data.latestDiagnostic?.status === 'published';

        const isExecBriefApproved = tenant.executiveBriefStatus === 'APPROVED';

        const s3 = (diagExists && s1 === 'COMPLETE' && isExecBriefApproved)
            ? 'COMPLETE'
            : (s1 === 'COMPLETE' && isExecBriefApproved ? 'READY' : 'LOCKED');
        if (stage === 3) return s3;

        // s4: Discovery NOTES (Step 4) - Simplified Fallback
        // (We don't have deep truth in legacy object, so be conservative)
        if (stage === 4) return diagPublished ? 'READY' : 'LOCKED';

        // s5..s7 Fallbacks
        if (stage === 5) return 'LOCKED';

        // s6: Ticket Moderation (Step 6)
        if (stage === 6) return 'LOCKED';

        // s7: Roadmap Generation (Step 7)
        const s7Fact = !!latestRoadmap;
        if (stage === 7) {
            return s7Fact ? 'COMPLETE' : 'LOCKED';
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
        if (!params?.tenantId || isGenerating) return;
        setIsGenerating(true);
        setGateLockedMessage(null);
        try {
            await superadminApi.assembleRoadmap(params.tenantId);
            await refreshData();
        } catch (err: any) {
            console.error('Finalization error:', err);

            if (err.errorCode === 'GATE_LOCKED' || err.status === 403) {
                setGateLockedMessage(err.message || 'Roadmap finalization is currently locked.');
            } else {
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
        setGateLockedMessage(null);
        try {
            await superadminApi.lockIntake(params.tenantId);
            await refreshData();
        } catch (err: any) {
            console.error('Lock Intake Error:', err);
            if (err.errorCode === 'GATE_LOCKED' || err.status === 403) {
                setGateLockedMessage(err.message || 'Intake locking is currently unavailable.');
            } else {
                setError(err.message);
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateDiagnostic = async () => {
        if (!params?.tenantId) return;
        if (isGenerating) return;  // ✅ Guard against double-click
        setIsGenerating(true);
        setGateLockedMessage(null); // Clear previous lock message
        try {
            await superadminApi.generateDiagnostics(params.tenantId);
            await refreshData();
        } catch (err: any) {
            console.error('Diagnostic Generation Error:', err);
            // Handle GATE_LOCKED as a state, not a platform crash
            if (err.errorCode === 'GATE_LOCKED' || err.status === 403) {
                setGateLockedMessage(err.message || 'Next step is currently locked by business logic.');
            } else {
                setError(err.message);
            }
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

    const handleConfirmSufficiency = async () => {
        if (!params?.tenantId) return;
        setIsGenerating(true);
        try {
            await superadminApi.confirmSufficiency(params.tenantId);
            await refreshData();
        } catch (err: any) {
            console.error('Confirm Sufficiency Error:', err);
            setError(err.message || 'Failed to confirm knowledge sufficiency');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleActivateModeration = async () => {
        if (!params?.tenantId || isGenerating) return;

        const confirmed = window.confirm('This will start a new moderation cycle tied to the current canonical findings. Legacy tickets will not be used. Proceed?');
        if (!confirmed) return;

        setIsGenerating(true);
        setGateLockedMessage(null);
        try {
            await superadminApi.activateTicketModeration(params.tenantId);
            await refreshData();
        } catch (err: any) {
            console.error('Moderation Activation Error:', err);
            if (err.errorCode === 'GATE_LOCKED' || err.status === 403) {
                setGateLockedMessage(err.message || 'Ticket moderation is currently locked.');
            } else {
                setError(err.message || 'Failed to activate moderation');
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleLockDiagnostic = async () => {
        if (!params?.tenantId || !data?.latestDiagnostic?.id) return;
        if (!window.confirm('Lock Diagnostic? This prevents further regeneration.')) return;
        setIsGenerating(true);
        setGateLockedMessage(null);
        try {
            await superadminApi.lockDiagnostic(params.tenantId, data.latestDiagnostic.id);
            await refreshData();
        } catch (err: any) {
            console.error('Lock Diagnostic Error:', err);
            if (err.errorCode === 'GATE_LOCKED' || err.status === 403) {
                setGateLockedMessage(err.message || 'Diagnostic locking is currently unavailable.');
            } else {
                setError(err.message);
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePublishDiagnostic = async () => {
        if (!params?.tenantId || !data?.latestDiagnostic?.id) return;
        if (!window.confirm('Publish Diagnostic? This makes artifacts visible to Discovery.')) return;
        setIsGenerating(true);
        setGateLockedMessage(null);
        try {
            await superadminApi.publishDiagnostic(params.tenantId, data.latestDiagnostic.id);
            await refreshData();
        } catch (err: any) {
            console.error('Publish Diagnostic Error:', err);
            if (err.errorCode === 'GATE_LOCKED' || err.status === 403) {
                setGateLockedMessage(err.message || 'Diagnostic publishing is currently locked.');
            } else {
                setError(err.message);
            }
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

    const handleGenerateExecutiveBrief = async () => {
        if (!params?.tenantId) return;
        if (isGenerating) return;
        setIsGenerating(true);
        setGateLockedMessage(null);
        try {
            await superadminApi.generateExecutiveBrief(params.tenantId);
            await refreshData();
        } catch (err: any) {
            console.error('Executive Brief Generation Error:', err);
            if (err.errorCode === 'GATE_LOCKED' || err.status === 403) {
                setGateLockedMessage(err.message || 'Executive Brief generation is currently locked.');
            } else if (err.message === 'EXECUTIVE_BRIEF_ALREADY_EXISTS') {
                await refreshData();
            } else {
                setError(`Generation Error: ${err.message}`);
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRegenerateExecutiveBrief = async () => {
        if (!params?.tenantId) return;
        if (isGenerating) return;

        setIsGenerating(true);
        setGateLockedMessage(null);
        // EXEC-BRIEF-UI-ACCEPTANCE-005: Clear previous brief errors
        setBriefActionError(null);
        setBriefSignalMetadata(null); // Clear previous quality warnings
        setLastBriefAction('regen');

        try {
            const preflight = await superadminApi.preflightRegenerateExecutiveBrief(params.tenantId);
            if (!preflight.canRegenerate) {
                // EXEC-BRIEF-UI-ACCEPTANCE-005: Use brief error, not global error
                setBriefActionError({
                    code: 'PREFLIGHT_FAILED',
                    message: `Regeneration blocked: required intake data missing (${preflight.reasons.join(', ')}).`
                });
                return;
            }

            const confirmed = window.confirm(
                "This will regenerate the Executive Brief using the current synthesis ruleset and overwrite the existing artifact. Continue?"
            );
            if (!confirmed) return;

            const response = await superadminApi.generateExecutiveBrief(params.tenantId, true);
            await refreshData();
            await loadExecBriefData(); // Refresh modal content
            // Success - clear any previous errors
            setBriefActionError(null);

            // EXEC-BRIEF-SIGNAL-GATE-009A: Set quality metadata for success case
            if (response.signalQuality) {
                setBriefSignalMetadata({
                    signalQuality: response.signalQuality,
                    assertionCount: response.assertionCount || 0,
                    targetCount: response.targetCount || 4
                });
            } else {
                setBriefSignalMetadata(null);
            }
        } catch (err: any) {
            console.error('Executive Brief Regeneration Error:', err);
            // EXEC-BRIEF-UI-ACCEPTANCE-005: Handle brief errors locally, not globally
            if (err.errorCode === 'GATE_LOCKED' || err.status === 403) {
                setGateLockedMessage(err.message || 'Executive Brief regeneration is currently locked.');
            } else {
                // Set brief-specific error instead of global error
                setBriefActionError(err.errorPayload || {
                    code: err.errorCode || 'UNKNOWN_ERROR',
                    message: err.message,
                    requestId: err.requestId
                });
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleApproveExecutiveBrief = async () => {
        if (!params?.tenantId) return;
        if (isGenerating) return;
        setIsGenerating(true);
        setGateLockedMessage(null);
        try {
            await superadminApi.approveExecutiveBrief(params.tenantId);
            await refreshData();
            await loadExecBriefData(); // Refresh to show APPROVED state in modal
        } catch (err: any) {
            console.error('Executive Brief Approval Error:', err);
            if (err.errorCode === 'GATE_LOCKED' || err.status === 403) {
                setGateLockedMessage(err.message || 'Executive Brief approval is currently locked.');
            } else {
                setError(`Approval Error: ${err.message}`);
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDeliverExecutiveBrief = async () => {
        if (!params?.tenantId) return;
        if (isGenerating) return;
        setIsGenerating(true);
        try {
            await superadminApi.deliverExecutiveBrief(params.tenantId);
            await loadExecBriefData();
            // Don't close modal, just refresh state to show "Delivered" if applicable
            await refreshData();
        } catch (err: any) {
            console.error('Failed to deliver executive brief:', err);
            window.alert(`Delivery Error: ${err.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateExecutiveBriefPdf = async () => {
        if (!params?.tenantId) return;
        if (isGenerating) return;
        setIsGenerating(true);
        try {
            await superadminApi.generateExecutiveBriefPDF(params.tenantId);
            await loadExecBriefData();
            // window.alert('PDF Generated Successfully'); // Optional feedback
        } catch (err: any) {
            console.error('Failed to generate PDF:', err);
            window.alert(`Generation Error: ${err.message}`);
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
            const { brief, hasPdf } = response;

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
                hasPdf: !!hasPdf,
            });

            // EXEC-BRIEF-SIGNAL-GATE-009A: Extract quality metadata from synthesis if present
            const synthesisContent = brief.synthesis as any;
            if (synthesisContent?.signalQuality) {
                setBriefSignalMetadata({
                    signalQuality: synthesisContent.signalQuality,
                    assertionCount: synthesisContent.assertionCount || 0,
                    targetCount: synthesisContent.targetCount || 4
                });
            }
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
        const tenantId = params?.tenantId;
        if (!tenantId) return;

        setSynthesisOpen(true);

        // Load discovery notes
        try {
            const res = await superadminApi.getDiscoveryNotes(tenantId);
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
                {/* GATE LOCKED PANEL */}
                {gateLockedMessage && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300 bg-amber-900/20 border border-amber-500/30 rounded-xl p-4 flex items-start gap-4 shadow-lg shadow-amber-900/10">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m1-7l-1 1h4l-1-1m-2-2v2m0 0h2m-2 0H10" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-tight">Next Step Locked</h3>
                            <p className="text-xs text-slate-300 mt-1">{gateLockedMessage}</p>
                        </div>
                        <button
                            onClick={() => setGateLockedMessage(null)}
                            className="text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-slate-800 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* EXEC-BRIEF-UI-ACCEPTANCE-005: Brief Action Error Banner (Non-Blocking) */}
                {briefActionError && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300 bg-red-900/20 border border-red-500/30 rounded-xl p-4 shadow-lg shadow-red-900/10">
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-red-400 uppercase tracking-tight">
                                    Executive Brief {lastBriefAction || 'Action'} Failed
                                </h3>
                                <div className="mt-2 space-y-2">
                                    <p className="text-xs text-slate-300">
                                        <span className="font-mono text-red-300">{briefActionError.code}</span>: {briefActionError.message}
                                    </p>
                                    {briefActionError.details && briefActionError.code === 'INSUFFICIENT_SIGNAL' && (
                                        <div className="mt-1 space-y-1">
                                            <p className="text-xs text-slate-400">
                                                Found {briefActionError.details.signalCount || briefActionError.details.assertionCount} valid signals.
                                                Minimum required: {briefActionError.details.minRequired || 4}.
                                            </p>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 py-1.5 px-2 bg-black/30 rounded-lg border border-red-500/10">
                                                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Diagnostics:</div>
                                                <div className="text-[10px] font-mono text-slate-400">VECTORS: {briefActionError.details.vectorCount || 0}</div>
                                                <div className="text-[10px] font-mono text-slate-400">FACTS: {briefActionError.details.factCount || 0}</div>
                                                <div className="text-[10px] font-mono text-slate-400">PATTERNS: {briefActionError.details.patternCount || 0}</div>
                                                {briefActionError.details.invalidAssertions?.total > 0 && (
                                                    <div className="text-[10px] font-mono text-red-400/80">REJECTED: {briefActionError.details.invalidAssertions.total}</div>
                                                )}
                                            </div>
                                            {briefActionError.details.recommendation && (
                                                <p className="text-xs text-slate-400 italic mt-2">
                                                    Recommendation: {briefActionError.details.recommendation}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    {briefActionError.requestId && (
                                        <p className="text-[10px] text-slate-500 font-mono">
                                            Request ID: {briefActionError.requestId}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => setBriefActionError(null)}
                                className="text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* EXEC-BRIEF-SIGNAL-GATE-009A: Non-blocking quality warning banner */}
                {briefSignalMetadata && briefSignalMetadata.signalQuality === 'LOW_SIGNAL' && !briefActionError && (
                    <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-amber-500/20 rounded-lg">
                                    <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-amber-400 font-bold text-sm">Low Signal Warning</h3>
                                    <p className="text-xs text-slate-300">
                                        Brief generated with limited signal ({briefSignalMetadata.assertionCount} of {briefSignalMetadata.targetCount} desired). Consider adding more intake signal.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setBriefSignalMetadata(null)}
                                className="text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

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
                            {(() => {
                                // EXEC-RESTORE-REVIEW-PANELS-AND-KILL-DIVERGENCE-022: Override with TruthProbe
                                let phase = tenant.executionPhase;
                                if (truthProbe) {
                                    if (truthProbe.intake.windowState === 'CLOSED' && phase === 'INTAKE_OPEN') {
                                        phase = 'INTAKE_CLOSED';
                                    }
                                }

                                if (!phase) return null;

                                return (
                                    <div className={`
                                        px-3 py-1 border rounded-full text-[10px] font-bold uppercase tracking-widest
                                        ${phase === 'EXEC_BRIEF_APPROVED'
                                            ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400'
                                            : phase === 'EXEC_BRIEF_DRAFT'
                                                ? 'bg-amber-900/30 border-amber-500/50 text-amber-400'
                                                : 'bg-slate-800/50 border-slate-700 text-slate-400'}
                                    `}>
                                        {phase.replace(/_/g, ' ')}
                                    </div>
                                );
                            })()}
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
                                {(() => {
                                    if (truthProbe) {
                                        return truthProbe.intake.windowState === 'CLOSED' ? 'CLOSED' : 'OPEN';
                                    }
                                    return (tenant.intakeWindowState === 'CLOSED' || (intakeRoles.length > 0 && intakeRoles.every(r => r.intakeStatus === 'COMPLETED')))
                                        ? 'CLOSED'
                                        : `${intakes.filter(i => i.status === 'completed').length}/${intakes.length} COMPLETE`;
                                })()}
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
                                    {(() => {
                                        const checkDivergence = () => {
                                            if (!truthProbe || !data?.tenant) return false;
                                            // 1. Intake
                                            if (truthProbe.intake.windowState && truthProbe.intake.windowState !== data.tenant.intakeWindowState) return true;

                                            // 2. Brief
                                            const truthState = truthProbe.executiveBrief.state || '';
                                            const legacyStatus = data.tenant.executiveBriefStatus || '';
                                            const truthApproved = ['APPROVED', 'DELIVERED', 'REVIEWED'].includes(truthState);
                                            const legacyApproved = ['APPROVED', 'ACKNOWLEDGED', 'WAIVED'].includes(legacyStatus);
                                            if (truthApproved !== legacyApproved) return true;

                                            // 3. Diagnostic
                                            if (truthProbe.diagnostic.exists !== !!data.latestDiagnostic) return true;

                                            return false;
                                        };

                                        // EXEC-RESTORE-REVIEW-PANELS-AND-KILL-DIVERGENCE-022: Suppress Divergence Alert when Probe is present
                                        const hasDivergence = false; // checkDivergence(); // DISABLED

                                        return hasDivergence && (
                                            <div className="mb-3 bg-amber-950/40 border border-amber-900/50 p-3 rounded-lg flex items-start gap-3">
                                                <div className="text-amber-500 font-bold uppercase text-[10px] tracking-wider mt-0.5">Divergence Alert</div>
                                                <div className="text-amber-200/80 text-[10px]">
                                                    Legacy control plane state differs from TruthProbe authority.<br />
                                                    Trust <strong>Lifecycle Truth</strong> below.
                                                </div>
                                            </div>
                                        );
                                    })()}
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

                                                <div className="flex items-center justify-between">
                                                    <div className="text-[10px] text-slate-400 space-y-0.5">
                                                        <div className="font-bold uppercase tracking-widest text-slate-500 mb-1">
                                                            Truth
                                                        </div>

                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span>
                                                                Brief:{' '}
                                                                <span className="text-slate-300">
                                                                    {(truthProbe as any)?.executiveBrief?.status ?? (truthProbe as any)?.brief?.status ?? 'N/A'}
                                                                </span>
                                                            </span>

                                                            <span className="text-slate-700">•</span>

                                                            <span>
                                                                Diag:{' '}
                                                                <span className="text-slate-300">
                                                                    {(truthProbe as any)?.diagnostic?.status ?? 'N/A'}
                                                                </span>
                                                            </span>

                                                            <span className="text-slate-700">•</span>

                                                            <span>
                                                                Tickets:{' '}
                                                                <span className="text-slate-300">
                                                                    {((truthProbe as any)?.tickets?.approved ?? 0)}/{((truthProbe as any)?.tickets?.total ?? 0)}

                                                                </span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>



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
                                        action: (() => {
                                            const status = getCanonicalStatus(2);
                                            const briefStatus = tenant.executiveBriefStatus;
                                            const hasBrief = !!briefStatus;

                                            if (status === 'READY' || status === 'COMPLETE') {
                                                return (
                                                    <div className="flex gap-2 mt-2">
                                                        {!hasBrief ? (
                                                            <button
                                                                onClick={handleGenerateExecutiveBrief}
                                                                disabled={isGenerating}
                                                                className="text-[10px] uppercase font-bold text-indigo-400 hover:text-indigo-300 border border-indigo-900/50 bg-indigo-950/30 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                                                            >
                                                                Generate
                                                            </button>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={openExecBriefModal}
                                                                    className="text-[10px] uppercase font-bold text-orange-400 hover:text-orange-300 border border-orange-900/50 bg-orange-950/30 px-3 py-1.5 rounded transition-colors"
                                                                >
                                                                    Review
                                                                </button>
                                                                <button
                                                                    onClick={handleRegenerateExecutiveBrief}
                                                                    disabled={isGenerating}
                                                                    className="text-[10px] uppercase font-bold text-indigo-400 hover:text-indigo-300 border border-indigo-900/50 bg-indigo-950/30 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                                                                >
                                                                    Regen
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()
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
                                                const hasConfirmed = truthProbe?.operator?.confirmedSufficiency;
                                                if (!hasConfirmed) {
                                                    return (
                                                        <div className="mt-2 space-y-2">
                                                            <div className="text-[10px] text-amber-400 font-medium bg-amber-950/20 border border-amber-900/30 p-2 rounded">
                                                                Gate D3: Operator must confirm knowledge sufficiency before generation.
                                                            </div>
                                                            <button
                                                                onClick={handleConfirmSufficiency}
                                                                disabled={isGenerating}
                                                                className="text-[10px] uppercase font-bold text-amber-400 hover:text-amber-300 border border-amber-900/50 bg-amber-950/20 px-3 py-1.5 rounded transition-colors"
                                                            >
                                                                Confirm Knowledge Sufficiency
                                                            </button>
                                                        </div>
                                                    );
                                                }

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
                                // EXEC-RESTORE-REVIEW-PANELS-AND-KILL-DIVERGENCE-022: TruthProbe-driven
                                let status = tenant.executiveBriefStatus;
                                if (truthProbe?.executiveBrief?.state) {
                                    status = truthProbe.executiveBrief.state as any;
                                }

                                const isComplete = status && ['APPROVED', 'DELIVERED', 'REVIEWED', 'ACKNOWLEDGED', 'WAIVED'].includes(status);

                                if (!isComplete) return null;

                                return (
                                    <BriefCompleteCard
                                        status={status ?? ''}
                                        onReview={openExecBriefModal}
                                    />
                                );
                            })()}
                        </AuthorityGuard>



                        {/* @ANCHOR:SA_FIRM_DETAIL_DIAGNOSTIC_REVIEW_SLOT */}

                        {/* 3.5 Diagnostic Review (modal-only) */}
                        {/* Phase 1 Invariant: Hide Diagnostic if Brief is not APPROVED */}
                        {/* 3.5 Diagnostic Review (modal-only) */}
                        {/* Phase 1 Invariant: Hide Diagnostic if Brief is not APPROVED (or DELIVERED/REVIEWED) */}
                        {(() => {
                            // EXEC-RESTORE-REVIEW-PANELS-AND-KILL-DIVERGENCE-022: TruthProbe-driven check
                            const hasDiagnostic = truthProbe ? truthProbe.diagnostic.exists : !!tenant.lastDiagnosticId;

                            const briefState = truthProbe ? truthProbe.executiveBrief.state : tenant.executiveBriefStatus;
                            const isBriefReady = briefState && ['APPROVED', 'DELIVERED', 'REVIEWED', 'ACKNOWLEDGED', 'WAIVED'].includes(briefState);

                            if (hasDiagnostic && isBriefReady) {
                                return (
                                    <DiagnosticCompleteCard
                                        status={truthProbe?.diagnostic?.state || data?.latestDiagnostic?.status || 'GENERATED'}
                                        onReview={openDiagnosticModal}
                                    />
                                );
                            }
                            return null;
                        })()}
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
                    loading={execBriefLoading}
                    data={execBriefData}
                    status={execBriefData?.status || tenant.executiveBriefStatus}
                    error={execBriefError}
                    onApprove={handleApproveExecutiveBrief}
                    isApproving={isGenerating}
                    tenantId={params?.tenantId || ''}
                    onDeliver={handleDeliverExecutiveBrief}
                    isDelivering={isGenerating}
                    hasPdf={execBriefData?.hasPdf}
                    onGeneratePdf={handleGenerateExecutiveBriefPdf}
                    audit={truthProbe?.executiveBrief?.deliveryAudit}
                    onDownload={() => superadminApi.downloadExecutiveBrief(tenant.id, tenant.name)}
                    onRegenerate={handleRegenerateExecutiveBrief}
                    isRegenerating={isGenerating}
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
