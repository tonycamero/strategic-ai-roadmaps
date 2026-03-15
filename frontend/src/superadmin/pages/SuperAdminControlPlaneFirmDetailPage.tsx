import React, { useEffect, useState, useRef } from 'react';
import { AuthorityCategory, CanonicalDiscoveryNotes } from '@roadmap/shared';
import { useRoute } from 'wouter';
import { useAuth } from '../../context/AuthContext';
import { useSuperAdminAuthority } from '../../hooks/useSuperAdminAuthority';
import { AuthorityGuard } from '../../components/AuthorityGuard';
import { DiagnosticModerationSurface } from '../components/DiagnosticModerationSurface';
import { DiagnosticCompleteCard } from '../components/DiagnosticCompleteCard';

import { RoadmapReadinessPanel } from '../components/RoadmapReadinessPanel';
import { RoadmapGenerationPanel } from '../components/RoadmapGenerationPanel';
import { ExecutiveSnapshotPanel } from '../components/ExecutiveSnapshotPanel';
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
import { getLifecycle } from '../../services/projectionLifecycleAdapter';
import { 
  getSurfaceAssignment, 
  setSurfaceAssignment, 
  mapSurfaceToRoute, 
  OperationalSurface 
} from '../../services/surfaceAssignmentService';
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
    const hasFetchedRef = useRef<string | null>(null);


    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [gateLockedMessage, setGateLockedMessage] = useState<string | null>(null);
    const [briefActionError, setBriefActionError] = useState<any | null>(null);
    const [lastBriefAction, setLastBriefAction] = useState<'generate' | 'regen' | 'download' | 'deliver' | null>(null);

    // Modal Visibility States
    const [isExecBriefOpen, setExecBriefOpen] = useState(false);
    const [isDiagOpen, setDiagOpen] = useState(false);
    const [isDiscoveryOpen, setDiscoveryOpen] = useState(false);
    const [isSynthesisOpen, setSynthesisOpen] = useState(false);
    const [intakeModalOpen, setIntakeModalOpen] = useState(false);
    const [selectedIntake, setSelectedIntake] = useState<any>(null);
    const [executiveBriefLoading, setExecutiveBriefLoading] = useState(false);
    const [executiveBriefError, setExecutiveBriefError] = useState<string | null>(null);
    const [diagLoading, setDiagLoading] = useState(false);
    const [diagError, setDiagError] = useState<string | null>(null);
    const [snapshotLoading, setSnapshotLoading] = useState(false);
    const [briefSignalMetadata, setBriefSignalMetadata] = useState<any>(null);

    // Panel Collapse States
    const [showTruthProbe, setShowTruthProbe] = useState(false);
    const [showBaselinePanel, setShowBaselinePanel] = useState(false);
    const [showROIPanel, setShowROIPanel] = useState(false);

    const [discoverySaving, setDiscoverySaving] = useState(false);
    const [impersonating, setImpersonating] = useState(false);
    const { category } = useSuperAdminAuthority();

    const refreshData = async (silent = false) => {
        if (!params?.tenantId) return;

        if (!silent) setLoading(true);

        try {
            // PHASE 1: Collapse to Single Orchestrator Call
            const res = await superadminApi.getSnapshot(params.tenantId);
            console.log("SNAPSHOT_RESPONSE_FULL", res);
            setData(res.data);
            setError(null);
            setGateLockedMessage(null);
        } catch (err: any) {
            console.error('Snapshot error:', err);
            // Non-ready snapshot is treated as a valid state, not an error
            if (err.errorCode === 'SNAPSHOT_NOT_READY' || err.status === 404) {
                setData(null);
                setGateLockedMessage('Strategic snapshot is not yet ready. Prerequisites not met.');
            } else if (err.errorCode === 'GATE_LOCKED' || err.status === 403) {
                setGateLockedMessage(err.message || 'Next step is currently locked by business logic.');
            } else {
                setError(err.message || 'Failed to load consolidated snapshot');
            }
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        const tenantId = params?.tenantId;
        if (!tenantId) return;

        // Idempotency guard for React 18 StrictMode double-mount in development
        if (hasFetchedRef.current === tenantId) return;
        hasFetchedRef.current = tenantId;

        refreshData();
    }, [params?.tenantId]);

    // EXEC-01: Hard Render Gate (Prevent catch-before-data crash)
    if (!data && loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-950 text-slate-400 font-mono text-xs uppercase tracking-widest">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                    Synchronizing Snapshot...
                </div>
            </div>
        );
    }

    if (!data && error) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-950 text-red-400 font-mono text-xs uppercase tracking-widest p-10 text-center">
                <div className="max-w-md">
                    Snapshot Error: {error}
                </div>
            </div>
        );
    }

    // STUBBED/PARKED: Impersonation feature rollback requested by user (v0.2)
    // const handleImpersonate = async () => {
    //     if (!params?.tenantId) return;
    //     if (!confirm('Are you sure you want to impersonate this tenant owner? You will be logged out of SuperAdmin.')) return;
    //
    //     setImpersonating(true);
    //     try {
    //         const response = await superadminApi.impersonateTenantOwner(params.tenantId);
    //         // Store token and redirect
    //         // Open in new tab/window with token and user object in query params to isolate session
    //         // The App component will handle extracting these and setting the session in the new tab
    //         const serializedUser = encodeURIComponent(JSON.stringify(response.user));
    //         window.open(`/dashboard?impersonationToken=${response.token}&impersonatedUser=${serializedUser}`, '_blank');
    //     } catch (err: any) {
    //         console.error('Failed to impersonate:', err);
    //         setError(err.message || 'Failed to start impersonation session');
    //         setImpersonating(false);
    //     }
    // };

    // ============================================================================
    // CANONICAL STATUS SYSTEM (LOCKED, READY, COMPLETE)
    // ============================================================================


    const getStatusStyles = (status: 'LOCKED' | 'READY' | 'ACTIVE' | 'COMPLETE') => {
        switch (status) {
            case 'COMPLETE':
                return {
                    container: 'bg-emerald-900/20 border-emerald-500/50 text-emerald-400',
                    dot: 'bg-emerald-500'
                };
            case 'ACTIVE':
                return {
                    container: 'bg-indigo-900/40 border-indigo-500/60 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.1)]',
                    dot: 'bg-indigo-400 animate-pulse'
                };
            case 'READY':
                return {
                    container: 'bg-yellow-900/20 border-yellow-500/50 text-yellow-400',
                    dot: 'bg-yellow-500'
                };
            case 'LOCKED':
            default:
                return {
                    container: 'bg-slate-900/40 border-slate-800 text-slate-500',
                    dot: 'bg-slate-700'
                };
        }
    };

    const getStakeholderDotColor = (role: IntakeRoleDefinition) => {
        // Fix stakeholder status calculation (EXEC-STAKEHOLDER-TRISTATE-ALIGN-002)
        // 1. Match by explicit intakeId link if present
        let matchedIntake = (intakes || []).find((i: any) => role.intakeId && i.id === role.intakeId);

        // 2. Fallback: Match by roleLabel
        if (!matchedIntake) {
            const truncatedLabel = role.roleLabel.substring(0, 20);
            matchedIntake = (intakes || []).find((i: any) =>
                i.role === role.roleLabel || i.role === truncatedLabel
            );
        }

        // GREEN: Intake is completed
        if (matchedIntake?.status === 'completed') {
            return 'bg-emerald-500';
        }

        // Check if account exists (YELLOW condition)
        const emailToMatch = role.recipientEmail?.toLowerCase().trim();
        const hasAccount = !!emailToMatch && (
            data?.teamMembers?.some((m: any) => m.email.toLowerCase().trim() === emailToMatch) ||
            data?.owner?.email.toLowerCase().trim() === emailToMatch
        );

        // YELLOW: Vector exists + account exists + intake NOT completed
        if (hasAccount) {
            return 'bg-yellow-500';
        }

        // RED: No account created (vector exists because we are evaluating `role`)
        return 'bg-red-500';
    };

    // Snapshot fetch removed as it is now redundant with refreshData() hook
    // and handled by unified snapshot fetch in refreshData.

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
            // Point to canonical generator
            await superadminApi.generateRoadmap(params.tenantId);
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
                    const errData = err.response?.data;
                    const details = errData?.prerequisites
                        ? [
                            !errData.prerequisites.hasApprovedBrief ? 'Executive Brief not valid' : null,
                            !errData.prerequisites.hasDiagnostic ? 'No Active Diagnostic found' : null,
                            errData.prerequisites.approvedTicketCount === 0 ? 'No Approved Tickets' : null
                        ].filter(Boolean)
                        : [];

                    const msg = details.length > 0
                        ? `Roadmap Not Ready. Missing prerequisites:\n- ${details.join('\n- ')}`
                        : (errData?.message || 'Roadmap Not Ready: Prerequisites not met.');

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
            await superadminApi.createIntakeVector(params.tenantId, role);
            await refreshData();
        } catch (err: any) {
            console.error('Failed to create intake vector:', err);
            setError(`Failed to create stakeholder: ${err.message}`);
        }
    };

    const handleInvite = async (roleId: string) => {
        try {
            const { vector } = await superadminApi.sendIntakeVectorInvite(roleId);

            // Update status
            await refreshData();
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
        // PROJECTION GUARD: Never fire if intake is not OPEN
        if (projection.lifecycle.intakeWindowState !== 'OPEN') return;
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
        if (isGenerating) return;
        setIsGenerating(true);
        setGateLockedMessage(null);
        try {
            // Wiring per Step Id: 5707 (Canonical path)
            await superadminApi.generateDiagnosticCanonical(params.tenantId);
            await refreshData();
        } catch (err: any) {
            console.error('Diagnostic Generation Error:', err);
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
        if (!params?.tenantId || !tenant?.lastDiagnosticId) return;
        if (isGenerating) return;
        setIsGenerating(true);
        try {
            await superadminApi.generateTickets(params.tenantId, tenant.lastDiagnosticId!);
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

        const confirmed = window.confirm('This will start a new moderation cycle tied to the current canonical findings. Proceed?');
        if (!confirmed) return;

        setIsGenerating(true);
        setGateLockedMessage(null);
        try {
            // Wiring per Step Id: 5707 (Canonical path)
            await superadminApi.startTicketModeration(params.tenantId);
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

    const handleRunAssistedSynthesis = async () => {
        if (!params?.tenantId || isGenerating) return;
        setIsGenerating(true);
        console.log('[SAS] Starting Assisted Synthesis Run...');
        try {
            // Wiring per Step Id: 5707 (Canonical path)
            await superadminApi.runAssistedSynthesis(params.tenantId);
            console.log('[SAS] Run complete, refreshing data silent...');
            await refreshData(true);
            console.log('[SAS] Opening modal...');
            setSynthesisOpen(true);
        } catch (err: any) {
            console.error('Assisted Synthesis Error:', err);
            setError(err.message || 'Failed to run assisted synthesis');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateStrategicRoadmap = async () => {
        if (!params?.tenantId || isGenerating) return;
        setIsGenerating(true);
        try {
            // Wiring per Step Id: 5707 (Canonical path)
            await superadminApi.generateRoadmap(params.tenantId);
            await refreshData();
        } catch (err: any) {
            console.error('Roadmap Generation Error:', err);
            setError(err.message || 'Failed to generate roadmap');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleLockDiagnostic = async () => {
        const diagId = latestDiagnostic?.id;
        if (!params?.tenantId || !diagId) return;
        if (!window.confirm('Lock Diagnostic? This prevents further regeneration.')) return;
        setIsGenerating(true);
        setGateLockedMessage(null);
        try {
            await superadminApi.lockDiagnostic(params.tenantId, latestDiagnostic?.id!);
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
        const diagId = latestDiagnostic?.id;
        if (!params?.tenantId || !diagId) {
            console.error('Missing tenantId or diagnosticId for publishing', { tenantId: params?.tenantId, diagId });
            return;
        }
        if (!window.confirm('Publish Diagnostic? This makes artifacts visible to Discovery.')) return;
        setIsGenerating(true);
        setGateLockedMessage(null);
        try {
            await superadminApi.publishDiagnostic(params.tenantId, diagId);
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

    const handleIngestDiscovery = async (notes: CanonicalDiscoveryNotes) => {
        if (!params?.tenantId) return;

        setDiscoverySaving(true);
        try {
            // EXEC-19: Smart routing via canonical state
            // Layer 1: first capture → canonical ingest (snapshot)
            // Layer 2: subsequent captures → append-only delta log
            if (!data?.projection?.workflow?.discoveryComplete) {
                await superadminApi.ingestDiscoveryNotes(params.tenantId, notes);
            } else {
                // Fail closed: never fall back to ingest if append fails
                // EXEC-26: Modal sends rawNotes (with hint block already injected by frontend).
                // Use rawNotes directly as the delta — canonical bucket fields are always empty in RAW capture mode.
                const rawPayload = notes as any;
                const delta = rawPayload.rawNotes?.trim() || (() => {
                    // Fallback: synthesize from canonical fields if for any reason rawNotes is absent
                    const timestamp = new Date().toISOString();
                    return [
                        `### Operator Clarification — ${timestamp}`,
                        '',
                        notes.currentBusinessReality ? `**Business Reality:** ${notes.currentBusinessReality}` : '',
                        notes.primaryFrictionPoints ? `**Friction Points:** ${notes.primaryFrictionPoints}` : '',
                        notes.desiredFutureState ? `**Future State:** ${notes.desiredFutureState}` : '',
                        notes.technicalOperationalEnvironment ? `**Tech/Ops:** ${notes.technicalOperationalEnvironment}` : '',
                        notes.explicitClientConstraints ? `**Constraints:** ${notes.explicitClientConstraints}` : '',
                    ].filter(Boolean).join('\n');
                })();
                await superadminApi.appendDiscoveryNote(params.tenantId, {
                    source: 'operator',
                    delta,
                });
            }
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
            await superadminApi.generateExecutiveBriefCanonical(params.tenantId);
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
            await refreshData(); // Refresh modal content
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
            await refreshData(); // Refresh to show APPROVED state in modal
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
            await refreshData();
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
            await refreshData();
        } catch (err: any) {
            console.error('Failed to generate PDF:', err);
            window.alert(`Generation Error: ${err.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    // Unified data refresh mechanism ensures all components stay in sync

    // Modal Open Handlers
    const openExecBriefModal = () => {
        setExecBriefOpen(true);
    };

    const openDiagnosticModal = () => {
        setDiagOpen(true);
    };

    // Modal Close Handlers
    const closeExecBriefModal = async () => {
        setExecBriefOpen(false);
        setExecutiveBriefError(null);
        await refreshData();
    };

    const openDiscoveryModal = () => {
        setDiscoveryOpen(true);
    };

    const openSynthesisModal = () => {
        setSynthesisOpen(true);
    };


    const closeDiagnosticModal = async () => {
        setDiagOpen(false);
        setDiagError(null);
        await refreshData();
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

    if (!params?.tenantId || !data?.tenant) {
        return (
            <div className="p-6 text-slate-400">
                Snapshot not ready.
            </div>
        );
    }

    const snapshot = data;

    const projection = snapshot?.projection;

    if (typeof window !== 'undefined') {
        (window as any).__SNAPSHOT_DEBUG__ = snapshot;
        (window as any).__PROJECTION_DEBUG__ = projection;
    }

    if (!projection || !snapshot?.tenant) {
        return (
            <div className="p-6 text-slate-400">
                Snapshot not ready.
            </div>
        );
    }

    const tenant = snapshot.tenant;
    const owner = snapshot.owner ?? null;
    const teamMembers = snapshot.teamMembers ?? [];
    const intakes = snapshot.intakes ?? [];
    const intakeRoles = (snapshot.intakeRoles ?? [])
        // 1. Map/Enrich Tenant Owner if missing data (Ensure Owner card has full data)
        .map((role: any) => {
            if (role.roleLabel === 'Tenant Owner') {
                return {
                    ...role,
                    recipientName: role.recipientName || owner?.name || tenant?.ownerName || 'Owner',
                    recipientEmail: role.recipientEmail || owner?.email || tenant?.ownerEmail || '',
                };
            }
            return role;
        })
        // 2. Filter out incomplete cards (no name and no email)
        .filter((r: any) => r.recipientName || r.recipientEmail)
        // 3. Sort: Owner > Executive > Others
        .sort((a: any, b: any) => {
            // Position 1: Tenant Owner
            if (a.roleLabel === 'Tenant Owner') return -1;
            if (b.roleLabel === 'Tenant Owner') return 1;

            // Position 2+: Executives
            if (a.roleType === 'EXECUTIVE' && b.roleType !== 'EXECUTIVE') return -1;
            if (a.roleType !== 'EXECUTIVE' && b.roleType === 'EXECUTIVE') return 1;

            // Others
            return 0;
        });

    const roadmaps = snapshot.roadmap?.all ?? [];
    const latestRoadmap = snapshot.roadmap?.latest ?? null;
    const recentActivity = snapshot.recentActivity ?? [];
    const moderationStatus = snapshot.diagnosticStatus ?? null;

    // SSOT Artifacts
    const snapshotData = snapshot?.data ?? snapshot;
    const artifacts = snapshotData?.artifacts ?? {};
    const latestDiagnostic = artifacts.diagnostic ?? null;
    const executiveBriefData = artifacts.executiveBrief ?? null;
    const discoveryNotesLog = artifacts.notes ?? [];
    const tickets = snapshot.tickets ?? [];

    const synthesisNotes = discoveryNotesLog[0]?.delta ?? null;

    const lifecycle = getLifecycle(projection);

    const getCanonicalStatus = (stage: number) => {
        const key = `stage${stage}` as keyof typeof lifecycle;
        return lifecycle[key]?.status || 'LOCKED';
    };

    // Filter exec-only actions from activity log (Defense-in-depth)
    const filteredActivity = recentActivity.filter((event: any) => {
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
                            <h1 className="text-4xl font-bold tracking-tight text-white mb-2">{tenant?.name ?? 'Loading…'}</h1>
                            <div className="flex items-center gap-4 text-sm text-slate-400">
                                <span>{tenant?.ownerName ?? '—'}</span>
                                <span className="w-1 h-1 bg-slate-700 rounded-full" />
                                <span>
                                    Created {tenant?.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : '—'}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2">
                                {/* PARKED: Impersonation Feature
                                <button
                                    // onClick={handleImpersonate}
                                    disabled={impersonating}
                                    className="px-3 py-1 bg-rose-900/30 border border-rose-700/50 rounded-full text-[10px] font-bold uppercase tracking-widest text-rose-300 hover:bg-rose-900/50 transition-colors disabled:opacity-50"
                                >
                                    {impersonating ? 'Connecting...' : 'Impersonate Owner'}
                                </button>
                                */}
                                <div className="px-3 py-1 bg-indigo-900/30 border border-indigo-700/50 rounded-full text-[10px] font-bold uppercase tracking-widest text-indigo-300">
                                    Authority Control Plane
                                </div>
                            </div>
                            {(() => {
                                // EXEC-RESTORE-REVIEW-PANELS-AND-KILL-DIVERGENCE-022: Override with TruthProbe
                                let displayPhase = projection.executionPhase;
                                if (projection.lifecycle.intakeWindowState === 'CLOSED' && displayPhase === 'INTAKE_OPEN') {
                                    displayPhase = 'INTAKE_CLOSED';
                                }

                                if (!displayPhase) return null;

                                return (
                                    <div className={`
                                        px-3 py-1 border rounded-full text-[10px] font-bold uppercase tracking-widest
                                        ${displayPhase === 'EXEC_BRIEF_APPROVED'
                                            ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400'
                                            : displayPhase === 'EXEC_BRIEF_DRAFT'
                                                ? 'bg-amber-900/30 border-amber-500/50 text-amber-400'
                                                : 'bg-slate-800/50 border-slate-700 text-slate-400'}
                                    `}>
                                        {displayPhase.replace(/_/g, ' ')}
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
                                    return projection.lifecycle.intakeWindowState === 'CLOSED' ? 'CLOSED' : `${projection.workflow.completedIntakeCount}/${projection.workflow.vectorCount} COMPLETE`;
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
                        readOnly={projection.lifecycle.intakeWindowState === 'CLOSED'}
                        tenantId={params?.tenantId || 'demo'}
                    />
                </AuthorityGuard>

                {/* MAIN EXECUTION GRID: Simple spine + contextual panels */}
                <div className="grid grid-cols-[240px_1fr] gap-4">


                    {/* LEFT: Dynamic Authority Spine */}
                    <aside className="space-y-4">
                        {/* TRUTH PROBE - Collapsed by default */}
                        {/* TRUTH PROBE REMOVED - EXEC-CLEANUP */}
                        {loading && <div className="text-xs text-slate-500 text-center animate-pulse py-2">Checking lifecycle...</div>}
                        {error && <div className="text-[10px] text-red-500 bg-red-900/10 p-2 rounded border border-red-900/20">{error}</div>}

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
                                        action: projection.derived.canLockIntake ? (
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
                                            const hasBrief = projection.artifacts.hasExecutiveBrief;

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
                                            const granularStatus = projection.artifacts.diagnostic.status;

                                            if (status === 'READY') {
                                                const hasConfirmed = projection.operator.confirmedSufficiency;
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

                                                if (projection.derived.canGenerateDiagnostic) {
                                                    return (
                                                        <button
                                                            onClick={handleGenerateDiagnostic}
                                                            className="mt-2 text-[10px] uppercase font-bold text-indigo-400 hover:text-indigo-300 border border-indigo-900/50 bg-indigo-950/30 px-3 py-1.5 rounded transition-colors"
                                                        >
                                                            Generate
                                                        </button>
                                                    );
                                                }
                                            }

                                            if (status === 'COMPLETE') {
                                                if (projection.derived.canLockDiagnostic && granularStatus === 'generated') {
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
                                                if (projection.derived.canPublishDiagnostic && granularStatus === 'locked') {
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
                                            if (projection.derived.canIngestDiscoveryNotes || projection.workflow.discoveryComplete) {
                                                return (
                                                    <button
                                                        onClick={openDiscoveryModal}
                                                        className="mt-2 text-[10px] uppercase font-bold text-indigo-400 hover:text-indigo-300 border border-indigo-900/50 bg-indigo-950/30 px-3 py-1.5 rounded transition-colors"
                                                    >
                                                        {projection.workflow.discoveryComplete ? 'Edit Raw Notes' : 'Ingest Notes (Raw)'}
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
                                            const hasFindings = projection.artifacts.hasCanonicalFindings;

                                            // If READY (means Stage 1-4 are good) but no findings yet → allow Run
                                            if (status === 'READY' && !hasFindings) {
                                                return (
                                                    <button
                                                        onClick={handleRunAssistedSynthesis}
                                                        disabled={isGenerating}
                                                        className="mt-2 text-[10px] uppercase font-bold text-indigo-400 hover:text-indigo-300 border border-indigo-900/50 bg-indigo-950/30 px-3 py-1.5 rounded transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                                    >
                                                        {isGenerating ? 'Running...' : 'Run Assisted Synthesis'}
                                                    </button>
                                                );
                                            }

                                            // If COMPLETE or Findings exist → allow Review
                                            if (hasFindings || projection.derived.synthesis.ready) {
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
                                            const ticketsExist = projection.stageState.stage7TicketsExist;

                                            if (projection.artifacts.hasCanonicalFindings && !projection.stageState.stage6ModerationReady && !ticketsExist) {
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
                                        action: (() => {
                                            const status = getCanonicalStatus(7);
                                            const hasRoadmap = projection.artifacts.hasRoadmap;

                                            if (status === 'READY' || (status === 'COMPLETE' && !hasRoadmap)) {
                                                return (
                                                    <button
                                                        onClick={handleGenerateStrategicRoadmap}
                                                        disabled={isGenerating}
                                                        className="mt-2 text-[10px] uppercase font-bold text-emerald-400 hover:text-emerald-300 border border-emerald-900/50 bg-emerald-950/30 px-3 py-1.5 rounded transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                                    >
                                                        {isGenerating ? 'Generating...' : 'Generate Roadmap'}
                                                    </button>
                                                );
                                            }

                                            if (hasRoadmap) {
                                                return (
                                                    <div className="flex gap-2 mt-2">
                                                        <button
                                                            onClick={() => window.open(`/roadmap/${params.tenantId}`, '_blank')}
                                                            className="text-[10px] uppercase font-bold text-emerald-400 hover:text-emerald-300 border border-emerald-900/50 bg-emerald-950/30 px-3 py-1.5 rounded transition-colors"
                                                        >
                                                            View
                                                        </button>
                                                        <button
                                                            onClick={handleGenerateStrategicRoadmap}
                                                            disabled={isGenerating}
                                                            className="text-[10px] uppercase font-bold text-indigo-400 hover:text-indigo-300 border border-indigo-900/50 bg-indigo-950/30 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                                                        >
                                                            Regen
                                                        </button>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()
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
                        {projection.derived.canAssembleRoadmap && (
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
                        {projection.lifecycle.intakeWindowState === 'CLOSED' && (
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
                                        projection={projection}
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
                                let status = projection.governance.executiveBriefStatus;

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
                        {/* Phase 1 Invariant: Hide Diagnostic if Brief is not APPROVED (or DELIVERED/REVIEWED) */}
                        {(() => {
                            // EXEC-RESTORE-REVIEW-PANELS-AND-KILL-DIVERGENCE-022: Snapshot-driven check
                            const hasDiagnostic = projection.artifacts.diagnostic.exists;
                            const briefState = projection.governance.executiveBriefStatus;
                            const isBriefReady = briefState && ['APPROVED', 'DELIVERED', 'REVIEWED', 'ACKNOWLEDGED', 'WAIVED'].includes(briefState);

                            if (hasDiagnostic && isBriefReady) {
                                return (
                                    <DiagnosticCompleteCard
                                        status={(latestDiagnostic?.status as any) || 'GENERATED'}
                                        onReview={openDiagnosticModal}
                                    />
                                );
                            }
                            return null;
                        })()}
                        {/* 3. Ticket Moderation (Waterfall Step 4) */}
                        {projection.lifecycle.intakeWindowState === 'CLOSED' && (
                            <AuthorityGuard requiredCategory={AuthorityCategory.EXECUTIVE}>
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase font-extrabold mb-2">Ticket Moderation {projection.artifacts.hasCanonicalFindings ? (projection.stageState.stage6ModerationReady ? '(Active)' : '(Ready)') : '(Pending)'}</div>
                                    {projection.artifacts.hasCanonicalFindings ? (
                                        <div className="space-y-4">
                                            {/* Stage 6 Activation Trigger — EXEC-TICKET-SAS-COMPLETION-REALIGN-001 */}
                                            {!projection.stageState.stage6ModerationReady && (
                                                <div className="p-6 bg-indigo-900/10 border border-indigo-500/30 rounded-xl mb-4">
                                                    <div className="flex items-center justify-between gap-6">
                                                        <div className="flex-1">
                                                            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-tight">Stage 6: Ticket Moderation Required</h3>

                                                            <p className="text-xs text-slate-400 mt-1">Canonical findings declared. Materialize findings into draft tickets to begin moderation.</p>
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

                                            {projection.stageState.stage6ModerationReady && (
                                                <DiagnosticModerationSurface
                                                    tenantId={tenant.id}
                                                    diagnosticId={latestDiagnostic?.id || ''}
                                                    tickets={tickets}
                                                    status={moderationStatus}
                                                    projection={projection}
                                                    onStatusChange={() => {
                                                        refreshData();
                                                    }}
                                                />
                                            )}
                                        </div>
                                    ) : (
                                        <div className="p-6 border border-slate-800 border-dashed rounded-lg flex flex-col items-center justify-center text-center opacity-60">
                                            <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center mb-3">
                                                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                            </div>
                                            <h3 className="text-sm font-medium text-slate-400">Canonical Findings Required</h3>
                                            <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                                                Ticket moderation will be available once the Assisted Synthesis is complete and canonical findings are declared.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </AuthorityGuard>
                        )}


                        {/* 4. Roadmap Readiness / Generation (Waterfall Step 7) */}
                        {projection.lifecycle.intakeWindowState === 'CLOSED' && (
                            <AuthorityGuard requiredCategory={AuthorityCategory.EXECUTIVE}>
                                <div className="space-y-6">
                                    <RoadmapReadinessPanel
                                        tenantId={tenant.id}
                                        projection={projection}
                                        roadmapStatus={data?.roadmaps?.lastRoadmap?.status || null}
                                        onFinalize={handleGenerateStrategicRoadmap}
                                        isGenerating={isGenerating}
                                    />
                                    
                                    <RoadmapGenerationPanel
                                        tenantId={tenant.id}
                                        firmData={data}
                                        onRefresh={refreshData}
                                        onRunSynthesis={handleRunAssistedSynthesis}
                                        onGenerateRoadmap={handleGenerateStrategicRoadmap}
                                        isGenerating={isGenerating}
                                    />
                                </div>
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
                    loading={executiveBriefLoading}
                    data={executiveBriefData}
                    status={projection.governance.executiveBriefStatus}
                    error={executiveBriefError}
                    onApprove={handleApproveExecutiveBrief}
                    isApproving={isGenerating}
                    tenantId={params?.tenantId || ''}
                    onDeliver={handleDeliverExecutiveBrief}
                    isDelivering={isGenerating}
                    hasPdf={executiveBriefData?.hasPdf}
                    onGeneratePdf={handleGenerateExecutiveBriefPdf}
                    audit={(() => {
                        // EXEC-RESTORE-REVIEW-PANELS-AND-KILL-DIVERGENCE-022: Prevent pre-deliver generation
                        if (!projection.governance.executiveBriefStatus || projection.governance.executiveBriefStatus !== 'DELIVERED') return undefined;
                        // Audit info should be persisted in executiveBriefData if available
                        return (executiveBriefData as any)?.deliveredAt ? {
                            deliveredAt: (executiveBriefData as any).deliveredAt,
                            deliveredByRole: (executiveBriefData as any).deliveredTo
                        } : undefined;
                    })()}
                    onDownload={() => superadminApi.downloadExecutiveBrief(tenant?.id ?? '', tenant?.name ?? 'ExecutiveBrief')}
                    onRegenerate={handleRegenerateExecutiveBrief}
                    isRegenerating={isGenerating}
                />

                <DiagnosticReviewModal
                    open={isDiagOpen}
                    onClose={closeDiagnosticModal}
                    data={latestDiagnostic}
                    status={latestDiagnostic?.status || 'GENERATED'}
                />

                <DiscoveryNotesModal
                    open={isDiscoveryOpen}
                    onClose={() => setDiscoveryOpen(false)}
                    onSave={handleIngestDiscovery}
                    isSaving={discoverySaving}
                    referenceQuestions={
                        // Questions are NOT in the snapshot yet — modal should handle loading them or they should be added to snapshot.
                        // For now we pass undefined to avoid crash.
                        undefined
                    }
                    appendMode={projection.workflow.discoveryComplete}
                    tenantId={params?.tenantId ?? undefined}
                />

                <AssistedSynthesisModal
                    open={isSynthesisOpen}
                    onClose={() => setSynthesisOpen(false)}
                    tenantId={params?.tenantId || ''}
                    snapshot={snapshot}
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
    stakeholderDotColorHelper,
    tenantId
}: {
    roles: IntakeRoleDefinition[];
    intakes: any[];
    onAddRole: (role: any) => void;
    onViewIntake: (intake: any) => void;
    readOnly: boolean;
    stakeholderDotColorHelper: (role: IntakeRoleDefinition) => string;
    tenantId: string;
}) {
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [assignments, setAssignments] = React.useState<Record<string, OperationalSurface>>({});
    const [loadingAssignments, setLoadingAssignments] = React.useState(true);

    // EXEC-078E: Load assignments on mount
    React.useEffect(() => {
        const loadAssignments = async () => {
            try {
                const { listSurfaceAssignments } = await import('../../services/surfaceAssignmentService');
                const data = await listSurfaceAssignments(tenantId);
                setAssignments(data);
            } catch (err) {
                console.error('Failed to load surface assignments:', err);
            } finally {
                setLoadingAssignments(false);
            }
        };

        if (tenantId) {
            loadAssignments();
        }
    }, [tenantId]);

    const handleSubmit = async (data: any) => {
        await onAddRole(data);
        setIsModalOpen(false);
    };

    const handleSurfaceChange = async (email: string, surface: OperationalSurface) => {
        try {
            const { setSurfaceAssignment: saveAssignment } = await import('../../services/surfaceAssignmentService');
            await saveAssignment(email, tenantId, surface);
            setAssignments(prev => ({
                ...prev,
                [email]: surface
            }));
        } catch (err) {
            console.error('Failed to save surface assignment:', err);
            alert('Failed to save surface assignment. Please try again.');
        }
    };

    return (
        <>
            {/* Flattened: No container, just label + cards */}
            <div>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3">Strategic Stakeholders</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {roles.map((role: any) => {
                        const intakeComplete = stakeholderDotColorHelper(role) === 'bg-emerald-500';
                        const currentSurface = assignments[role.recipientEmail] || 'DASHBOARD';

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
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        <div className="inline-block px-2 py-1 bg-indigo-900/30 border border-indigo-700/50 text-indigo-300 text-[10px] rounded uppercase tracking-wider">
                                            {role.roleLabel}
                                        </div>
                                        {intakeComplete && (
                                            <button
                                                onClick={(e: React.MouseEvent) => {
                                                    e.stopPropagation();
                                                    const fullIntake = intakes.find((i: any) =>
                                                        (role.intakeId && i.id === role.intakeId) ||
                                                        i.id === role.id ||
                                                        i.vectorId === role.id
                                                    );
                                                    if (fullIntake) onViewIntake(fullIntake);
                                                }}
                                                className="p-1 hover:bg-emerald-500/20 rounded transition-colors group/btn"
                                                title="View Intake Data"
                                            >
                                                <div className={`w-2.5 h-2.5 rounded-full ${stakeholderDotColorHelper(role)} shadow-[0_0_8px_rgba(16,185,129,0.4)] group-hover/btn:scale-110 transition-transform`} />
                                            </button>
                                        )}
                                        {!intakeComplete && (
                                            <div className={`w-2.5 h-2.5 rounded-full ${stakeholderDotColorHelper(role)} shadow-[0_0_8px_rgba(16,185,129,0.4)]`} />
                                        )}
                                    </div>
                                </div>

                                {/* EXEC-078E: Quick Surface Assignment (DB-BACKED) */}
                                <div className="mt-4 pt-4 border-t border-slate-800/50 space-y-3">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Surface</label>
                                        <select
                                            className="bg-slate-900 border border-slate-700 text-[11px] font-bold text-slate-300 px-2 py-1.5 rounded focus:outline-none focus:border-indigo-500 w-full disabled:opacity-50"
                                            value={currentSurface}
                                            disabled={loadingAssignments}
                                            onChange={(e) => handleSurfaceChange(role.recipientEmail, e.target.value as OperationalSurface)}
                                        >
                                            <option value="STRATEGIC">Strategic View</option>
                                            <option value="EXECUTION">Execution Surface</option>
                                            <option value="EXCEPTIONS">Exception Board</option>
                                            <option value="COORDINATION">Coordination Console</option>
                                            <option value="DASHBOARD">Standard Dashboard</option>
                                        </select>
                                    </div>
                                    
                                    <button
                                        onClick={() => {
                                            let route = mapSurfaceToRoute(currentSurface);
                                            if (tenantId) {
                                                route += `?tenantId=${tenantId}`;
                                            }
                                            window.open(route, '_blank');
                                        }}
                                        className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase tracking-wider rounded border border-slate-700 transition-colors"
                                    >
                                        Preview Surface
                                    </button>
                                </div>


                                {/* Hover Overlay Removed - Blocked Selectors */}
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
