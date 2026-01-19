<<<<<<< HEAD
import { useEffect, useState } from 'react';
import { AuthorityCategory } from '@roadmap/shared';
import { useRoute } from 'wouter';
import { useSuperAdminAuthority } from '../../hooks/useSuperAdminAuthority';
import { AuthorityGuard } from '../../components/AuthorityGuard';
import { DiagnosticModerationSurface } from '../components/DiagnosticModerationSurface';
import { DiagnosticCompleteCard } from '../components/DiagnosticCompleteCard';
import { RoadmapReadinessPanel } from '../components/RoadmapReadinessPanel';
import { BaselineSummaryPanel } from '../components/BaselineSummaryPanel';
import { superadminApi, FirmDetailResponseV2 } from '../api';
=======
import React, { useEffect, useState } from 'react';
import { AuthorityCategory } from '@roadmap/shared';
import { useRoute } from 'wouter';
import { useAuth } from '../../context/AuthContext';
import { useSuperAdminAuthority } from '../../hooks/useSuperAdminAuthority';
import { AuthorityGuard } from '../../components/AuthorityGuard';
import { DiagnosticModerationSurface } from '../components/DiagnosticModerationSurface';

import { RoadmapReadinessPanel } from '../components/RoadmapReadinessPanel';
import { ExecutiveSnapshotPanel, SnapshotData } from '../components/ExecutiveSnapshotPanel';
import { ExecutiveBriefPanel } from '../components/ExecutiveBriefPanel';
import { DiagnosticReviewModal } from '../components/phase7/DiagnosticReviewModal';
import { StakeholderModal } from '../../components/onboarding/StakeholderModal';
import { IntakeModal } from '../components/IntakeModal';

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
        executiveBriefStatus?: 'DRAFT' | 'APPROVED' | null;
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
};
>>>>>>> 1e46cab (chore: lock executive brief render + pdf contracts)

export default function SuperAdminControlPlaneFirmDetailPage() {
    const [, params] = useRoute<{ tenantId: string }>('/superadmin/execute/firms/:tenantId');

<<<<<<< HEAD
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<FirmDetailResponseV2 | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [moderationStatus, setModerationStatus] = useState<{ readyForRoadmap: boolean; pending: number; approved: number } | null>(null);
    useSuperAdminAuthority();

    const refreshData = async () => {
        if (!params?.tenantId) return;
        setLoading(true);
        try {
            const firmResponse = await superadminApi.getFirmDetailV2(params.tenantId);
            setData(firmResponse);
=======

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

    // Phase 8: Diagnostic Review Modal (RECOVERY)
    const [reviewOpen, setReviewOpen] = useState(false);
    const [diagnosticData, setDiagnosticData] = useState<any>(null);
    const [selectedIntake, setSelectedIntake] = useState<any>(null);
    const [intakeModalOpen, setIntakeModalOpen] = useState(false);

    const refreshData = async () => {
        if (!params?.tenantId) return;

        setLoading(true);

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
>>>>>>> 1e46cab (chore: lock executive brief render + pdf contracts)
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
    }, [params?.tenantId]);

<<<<<<< HEAD
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="bg-red-900/10 border border-red-900/20 rounded-lg p-6 text-center">
                <div className="text-red-500 font-bold mb-2">Failed to load firm details</div>
                <div className="text-red-400 text-sm">{error || 'Data unavailable'}</div>
                <button onClick={refreshData} className="mt-4 text-indigo-400 hover:text-indigo-300 font-medium">Retry</button>
            </div>
        );
    }

    const { tenant, roadmaps } = data;
    const latestRoadmap = roadmaps?.lastRoadmap;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <header className="mb-8">
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-[0.2em] mb-2 font-mono">
                    SuperAdmin Control Plane // Firm Detail
                </div>
                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tighter leading-none mb-2">
                            {tenant.name}
                        </h1>
                        <div className="flex items-center gap-4 text-slate-500 text-sm">
                            <span className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${tenant.status === 'pilot_active' ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                                {tenant.status.toUpperCase()}
                            </span>
                            <span className="text-slate-700">/</span>
                            <span>{tenant.cohortLabel || 'No Cohort'}</span>
                            <span className="text-slate-700">/</span>
                            <span>{new Date(tenant.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        {/* Intake Window controls disabled/removed due to legacy field dependency */}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Execution Pipeline Overview */}
                    <section className="space-y-4">
                        <BaselineSummaryPanel tenantId={tenant.id} hasRoadmap={!!latestRoadmap} />

                        {/* ExecutiveSnapshotPanel removed due to dependency on legacy intakeWindowState */}

                        {/* BriefCompleteCard removed due to dependency on legacy executiveBriefStatus */}

                        {data.diagnostics?.lastDiagnosticId && (
                            <DiagnosticCompleteCard status="GENERATED" onReview={async () => { }} />
                        )}

                        {/* Discovery & Synthesis section removed due to dependency on legacy intakeWindowState */}

                        {data.diagnostics?.lastDiagnosticId && (
                            <AuthorityGuard requiredCategory={AuthorityCategory.EXECUTIVE}>
                                <div className="space-y-4">
                                    <div className="text-[10px] text-slate-500 uppercase font-extrabold mb-2">Ticket Moderation</div>
                                    <DiagnosticModerationSurface
                                        tenantId={tenant.id}
                                        diagnosticId={data.diagnostics.lastDiagnosticId}
                                        onStatusChange={setModerationStatus}
                                    />
                                </div>
                            </AuthorityGuard>
                        )}
                    </section>
                </div>

                <aside className="space-y-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Firm Context</h3>
                        <dl className="space-y-4">
                            <div>
                                <dt className="text-[10px] text-slate-600 uppercase font-bold mb-0.5">Owner</dt>
                                <dd className="text-sm font-medium text-slate-200">{data.owner?.name}</dd>
                                <dd className="text-[11px] text-slate-500 italic">{data.owner?.email}</dd>
                            </div>
                            <div>
                                <dt className="text-[10px] text-slate-600 uppercase font-bold mb-0.5">Execution Stage</dt>
                                {/* Legacy executionPhase removed */}
                                <dd className="text-sm font-medium text-slate-200">UNKNOWN</dd>
                            </div>
                        </dl>
                    </div>

                    {moderationStatus?.readyForRoadmap && (
                        <RoadmapReadinessPanel
                            tenantId={tenant.id}
                            intakeWindowState={'CLOSED'} // Hardcoded fallback or must derive from intakes
                            briefStatus={'APPROVED'} // Hardcoded fallback or derived
                            moderationStatus={moderationStatus}
                            roadmapStatus={latestRoadmap?.status || null}
                            onFinalize={async () => { }}
                            isGenerating={false}
                            readinessFlags={{
                                knowledgeBaseReady: !!data.diagnostics?.lastDiagnosticId,
                                rolesValidated: true,
                                execReady: true // Fallback
                            }}
                        />
                    )}
                </aside>
=======
    // ============================================================================
    // CANONICAL STATUS SYSTEM (LOCKED, READY, COMPLETE)
    // ============================================================================

    const getCanonicalStatus = (stage: number): 'LOCKED' | 'READY' | 'COMPLETE' => {
        if (!data) return 'LOCKED';
        const { tenant, latestRoadmap, diagnosticStatus } = data;

        // s1: Intake (Source: intakeWindowState)
        const s1 = tenant.intakeWindowState === 'CLOSED' ? 'COMPLETE' : 'READY';
        if (stage === 1) return s1;

        // s2: Executive Brief (Source: executive_briefs.status)
        const s2Fact = tenant.executiveBriefStatus === 'APPROVED';
        const s2 = (s2Fact && s1 === 'COMPLETE') ? 'COMPLETE' : (s1 === 'COMPLETE' ? 'READY' : 'LOCKED');
        if (stage === 2) return s2;

        // s3: Diagnostic (Source: lastDiagnosticId)
        const s3Fact = !!tenant.lastDiagnosticId;
        const s3 = (s3Fact && s2 === 'COMPLETE') ? 'COMPLETE' : (s2 === 'COMPLETE' ? 'READY' : 'LOCKED');
        if (stage === 3) return s3;

        // s4: Ticket Moderation (Source: diagnosticStatus.readyForRoadmap)
        const s4Fact = diagnosticStatus?.readyForRoadmap === true;
        const s4 = (s4Fact && s3 === 'COMPLETE') ? 'COMPLETE' : (s3 === 'COMPLETE' ? 'READY' : 'LOCKED');
        if (stage === 4) return s4;

        // s5: Roadmap Generation (Source: latest roadmap artifact status)
        const s5Fact = !!latestRoadmap;
        const s5 = (s5Fact && s4 === 'COMPLETE') ? 'COMPLETE' : (s4 === 'COMPLETE' ? 'READY' : 'LOCKED');
        if (stage === 5) return s5;

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
            <div className="flex-1 space-y-8 p-8 max-w-7xl mx-auto">
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

                    {/* KPI Row */}
                    <div className="grid grid-cols-5 gap-4 mt-6">
                        <KPICard label="Firm Status" value={tenant.status} />
                        <KPICard label="Engagement Cohort" value={tenant.cohortLabel || '—'} />
                        <KPICard
                            label="Market Region" value={tenant.region || '—'} />
                        <KPICard
                            label="Operational Intake"
                            value={tenant.intakeWindowState === 'CLOSED' ? 'CLOSED' : `${intakes.filter(i => i.status === 'completed').length}/${intakes.length} COMPLETE`}
                        />
                        <KPICard label="Stakeholders" value={intakeRoles.length} />
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
                <div className="grid grid-cols-[240px_1fr] gap-6">


                    {/* LEFT: Dynamic Authority Spine */}
                    <aside>
                        <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4">
                            Execution Authority
                        </div>

                        <div className="space-y-2">
                            {/* Dynamically render gates from the gate array */}
                            {(() => {
                                // Define gates inline for this section
                                const gates = [
                                    { id: 1, label: 'Intake', status: getCanonicalStatus(1) },
                                    { id: 2, label: 'Executive Brief', status: getCanonicalStatus(2) },
                                    { id: 3, label: 'Diagnostic', status: getCanonicalStatus(3) },
                                    { id: 4, label: 'Ticket Moderation', status: getCanonicalStatus(4) },
                                    { id: 5, label: 'Roadmap Generation', status: getCanonicalStatus(5) }
                                ];

                                return gates.map((gate) => {
                                    const styles = getStatusStyles(gate.status);
                                    return (
                                        <div
                                            key={gate.id}
                                            className={`p-4 rounded-xl border-2 flex items-center gap-4 ${styles.container}`}
                                        >
                                            <div className={`w-3 h-3 rounded-full shrink-0 ${styles.dot}`} />
                                            <div>
                                                <div className="font-bold tracking-tight text-white">{gate.label}</div>
                                                <div className="text-[10px] uppercase font-bold tracking-widest opacity-70">
                                                    {gate.status}
                                                </div>
                                            </div>
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
                    <main className="space-y-6">


                        {/* 1. Executive Snapshot (when available) */}
                        {tenant.intakeWindowState === 'CLOSED' && (
                            <ExecutiveSnapshotPanel
                                data={snapshotData}
                                loading={snapshotLoading}
                            />
                        )}

                        {/* 2. Executive Brief (when available) */}
                        <AuthorityGuard requiredCategory={AuthorityCategory.EXECUTIVE}>
                            <ExecutiveBriefPanel
                                tenantId={tenant.id}
                                onApproved={refreshData}
                            />
                        </AuthorityGuard>

                        {/* 3. Ticket Moderation (Waterfall Step 4) */}
                        {tenant.intakeWindowState === 'CLOSED' && (
                            <AuthorityGuard requiredCategory={AuthorityCategory.EXECUTIVE}>
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase font-extrabold mb-2">Ticket Moderation {tenant.lastDiagnosticId ? '(Active)' : '(Pending)'}</div>

                                    {tenant.lastDiagnosticId ? (
                                        <DiagnosticModerationSurface
                                            tenantId={tenant.id}
                                            diagnosticId={tenant.lastDiagnosticId}
                                            onStatusChange={setModerationStatus}
                                        />
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
>>>>>>> 1e46cab (chore: lock executive brief render + pdf contracts)
            </div>
        </div>
    );
}
<<<<<<< HEAD
=======

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
            <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-6">
                <h3 className="text-sm font-bold text-slate-200 mb-4">Strategic Stakeholders</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
>>>>>>> 1e46cab (chore: lock executive brief render + pdf contracts)
