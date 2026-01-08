import React, { useEffect, useState } from 'react';
import { AuthorityCategory } from '@roadmap/shared';
import { useRoute } from 'wouter';
import { useAuth } from '../../context/AuthContext';
import { useSuperAdminAuthority } from '../../hooks/useSuperAdminAuthority';
import { AuthorityGuard } from '../../components/AuthorityGuard';
import { ExecutiveBriefSurface } from '../components/ExecutiveBriefSurface';
import { LeadDefinedRoleSurface } from '../components/LeadDefinedRoleSurface';
import { DiagnosticModerationSurface } from '../components/DiagnosticModerationSurface';
import { RoadmapReadinessPanel } from '../components/RoadmapReadinessPanel';
import { ExecutiveSnapshotPanel, SnapshotData } from '../components/ExecutiveSnapshotPanel';

// ... existing state ... 

// Phase 6: Ticket Moderation State
const [moderationStatus, setModerationStatus] = useState<{ readyForRoadmap: boolean; pending: number; approved: number } | null>(null);
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

export default function SuperAdminControlPlaneFirmDetailPage() {
    const [, params] = useRoute<{ tenantId: string }>('/superadmin/control-plane/firms/:tenantId');


    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [data, setData] = useState<SuperAdminTenantDetail | null>(null);
    const [execStatus, setExecStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Phase 4: Intake Role State
    // Phase 4: Intake Role State
    const [intakeRoles, setIntakeRoles] = useState<IntakeRoleDefinition[]>([]);

    // Phase 7: Snapshot State
    const [snapshotData, setSnapshotData] = useState<SnapshotData | null>(null);
    const [snapshotLoading, setSnapshotLoading] = useState(false);
    const { category } = useSuperAdminAuthority();

    useEffect(() => {
        if (!params?.tenantId) return;

        // Existing load logic...
        setLoading(true);
        // ... (rest of existing fetch) ...
        superadminApi.getFirmDetail(params.tenantId)
            .then((response) => {
                // ... (existing mapping) ...
                const firmDetail = response as unknown as FirmDetailResponse;
                setData({
                    tenant: {
                        id: firmDetail.tenantSummary.id,
                        name: firmDetail.tenantSummary.name,
                        cohortLabel: firmDetail.tenantSummary.cohortLabel,
                        segment: firmDetail.tenantSummary.segment,
                        region: firmDetail.tenantSummary.region,
                        status: firmDetail.tenantSummary.status,
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
                    roadmaps: firmDetail.roadmaps,
                    latestRoadmap: firmDetail.latestRoadmap,
                    recentActivity: firmDetail.recentActivity,
                    diagnosticStatus: firmDetail.diagnosticStatus,
                });

                // Initialize Intake Roles from existing intake data (Backwards Compatibility / Mock)
                // In a real implementation this comes from a dedicated endpoint.
                const mappedRoles: IntakeRoleDefinition[] = firmDetail.intakes.map((i, idx) => ({
                    id: i.id || `mock-${idx}`,
                    roleLabel: i.role,
                    roleType: 'OPERATIONAL_LEAD', // Default for legacy data
                    perceivedConstraints: i.perceivedConstraints?.[0] || 'Historical data constraint.',
                    anticipatedBlindSpots: 'Legacy import.',
                    recipientName: i.userName,
                    recipientEmail: i.userEmail,
                    inviteStatus: i.status === 'completed' ? 'SENT' : 'NOT_SENT',
                    intakeStatus: i.status === 'completed' ? 'COMPLETED' : i.status === 'in_progress' ? 'IN_PROGRESS' : 'NOT_STARTED',
                    completedAt: i.completedAt
                }));
                setIntakeRoles(mappedRoles);
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [params?.tenantId]);

    // Snapshot fetch
    useEffect(() => {
        if (params?.tenantId && category === AuthorityCategory.EXECUTIVE) {
            setSnapshotLoading(true);
            superadminApi.getSnapshot(params.tenantId)
                .then(res => setSnapshotData(res.data))
                .catch(err => console.error('Snapshot fetch error:', err))
                .finally(() => setSnapshotLoading(false));
        }
    }, [params?.tenantId, category]);

    const handleExecuteDiagnostic = async () => {
        if (!params?.tenantId) return;

        setIsGenerating(true);

        try {
            await superadminApi.generateSop01(params.tenantId);
            // Refresh detail to get the latest diagnostic ID if needed
            window.location.reload();
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
            await superadminApi.generateFinalRoadmap(params.tenantId);
            window.location.reload();
        } catch (err: any) {
            console.error('Finalization error:', err);
            setError(`Finalization Error: ${err.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    // Phase 4: Handlers
    const handleAddRole = (role: Omit<IntakeRoleDefinition, 'id' | 'inviteStatus' | 'intakeStatus'>) => {
        const newRole: IntakeRoleDefinition = {
            ...role,
            id: `new-${Date.now()}`,
            inviteStatus: 'NOT_SENT',
            intakeStatus: 'NOT_STARTED'
        };
        setIntakeRoles([...intakeRoles, newRole]);
        // TODO: Call backend to persist
    };

    const handleInvite = (roleId: string) => {
        setIntakeRoles((roles: IntakeRoleDefinition[]) => roles.map((r: IntakeRoleDefinition) => r.id === roleId ? { ...r, inviteStatus: 'SENT' } : r));
        // TODO: Call backend to send email
    };

    const handleCloseIntake = async () => {
        if (!params?.tenantId) return;
        if (!window.confirm('CRITICAL: This will freeze the intake window and generate a snapshot. This action cannot be undone. Proceed?')) return;

        setIsGenerating(true);
        try {
            await superadminApi.closeIntakeWindow(params.tenantId);
            window.location.reload();
        } catch (err: any) {
            console.error('Close intake error:', err);
            setError(`Closure Error: ${err.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen text-slate-400">Loading firm details...</div>;
    if (error) return <div className="p-6 text-red-400">Error: {error}</div>;
    if (!params?.tenantId || !data) return <div className="p-6 text-slate-400">Missing tenant data.</div>;

    const { tenant, owner, teamMembers, intakes, recentActivity } = data;

    // Filter exec-only actions from activity log (Defense-in-depth)
    const filteredActivity = recentActivity.filter((event) => {
        const execOnlyEvents = ['exec_brief_acknowledged', 'exec_brief_waived', 'strategic_framing_changed'];
        return !execOnlyEvents.includes(event.eventType);
    });

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            {/* Page Header */}
            <header className="border-b border-slate-800 pb-6 flex items-start justify-between">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-white mb-2">{tenant.name}</h1>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span>{tenant.ownerName}</span>
                        <span className="w-1 h-1 bg-slate-700 rounded-full" />
                        <span>Created {new Date(tenant.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
                <div className="px-3 py-1 bg-indigo-900/30 border border-indigo-700/50 rounded-full text-[10px] font-bold uppercase tracking-widest text-indigo-300">
                    Authority Control Plane
                </div>
            </header>

            {/* ZONE 1: Shared Information Zone */}
            <section className="space-y-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-4">
                    Zone 1 — Shared Core Artifacts
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card title="Firm Integrity">
                        <div className="space-y-3 text-sm">
                            <MetadataRow label="Status" value={tenant.status} />
                            <MetadataRow label="Cohort" value={tenant.cohortLabel || 'None'} />
                            <MetadataRow label="Region" value={tenant.region || 'Unassigned'} />
                        </div>
                    </Card>

                    <Card title="Engagement Velocity">
                        <div className="space-y-3 text-sm">
                            <MetadataRow label="Intakes" value={String(intakes.length)} />
                            <MetadataRow label="Completion" value={`${intakes.filter(i => i.completedAt).length} / ${intakes.length}`} />
                            <MetadataRow label="Team Count" value={String(teamMembers.length)} />
                        </div>
                    </Card>

                    <Card title="Executive Ownership">
                        {owner ? (
                            <div className="space-y-1">
                                <div className="text-sm font-semibold text-white">{owner.name}</div>
                                <div className="text-xs text-slate-500">{owner.email}</div>
                            </div>
                        ) : (
                            <div className="text-sm text-slate-500 italic">No owner identified</div>
                        )}
                    </Card>
                </div>

                <Card title="Recent Non-Executive Activity">
                    <div className="space-y-2 mt-2">
                        {filteredActivity.length === 0 ? (
                            <div className="text-xs text-slate-600 italic">No public logs available</div>
                        ) : (
                            filteredActivity.slice(0, 5).map((event) => (
                                <div key={event.id} className="flex justify-between text-xs py-2 border-b border-slate-900 last:border-0">
                                    <span className="text-slate-400">{event.eventType}</span>
                                    <span className="text-slate-600 font-mono">{new Date(event.createdAt).toLocaleDateString()}</span>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </section>

            {/* ZONE 1.5: Operational State (Team & Intakes) */}
            <section className="space-y-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-4">
                    Zone 1.5 — Operational Context
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card title="Team Composition">
                        <div className="space-y-3">
                            {teamMembers.length === 0 ? (
                                <div className="text-xs text-slate-500 italic">No team members invited.</div>
                            ) : (
                                <div className="divide-y divide-slate-800/50">
                                    {teamMembers.map((member) => (
                                        <div key={member.id} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between">
                                            <div>
                                                <div className="text-xs text-slate-200 font-medium">{member.name}</div>
                                                <div className="text-[10px] text-slate-500">{member.email}</div>
                                            </div>
                                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono border border-slate-700 uppercase">
                                                {member.role}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Lead-Defined Roles (EXECUTIVE ONLY) */}
                    <AuthorityGuard requiredCategory={AuthorityCategory.EXECUTIVE}>
                        <div className="lg:col-span-1 space-y-6">
                            {tenant.intakeWindowState === 'CLOSED' && (
                                <div className="p-4 bg-slate-900 border border-indigo-500/50 rounded-lg shadow-lg relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-10">
                                        <svg className="w-16 h-16 text-indigo-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                                    </div>
                                    <div className="relative z-10">
                                        <div className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold mb-1">Intake Window Locked</div>
                                        <div className="text-white font-bold text-sm mb-0.5">Snapshot Generated</div>
                                        <div className="text-[10px] text-slate-400 font-mono">{tenant.intakeSnapshotId}</div>
                                        <div className="text-[10px] text-slate-500 font-mono mt-1">Closed {new Date(tenant.intakeClosedAt || '').toLocaleDateString()}</div>
                                    </div>
                                </div>
                            )}

                            <LeadDefinedRoleSurface
                                tenantId={params?.tenantId || ''}
                                roles={intakeRoles}
                                onAddRole={handleAddRole}
                                onInvite={handleInvite}
                                readOnly={tenant.intakeWindowState === 'CLOSED'}
                            />

                            {tenant.intakeWindowState !== 'CLOSED' && (
                                <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg">
                                    <h4 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Gate Control</h4>
                                    <p className="text-xs text-slate-500 mb-4">
                                        Closing the intake window allows the diagnostic engine to stabilize on the current set of roles and responses. This is a one-way gate.
                                    </p>
                                    <button
                                        onClick={handleCloseIntake}
                                        disabled={isGenerating}
                                        className="w-full py-2 bg-indigo-900/30 hover:bg-indigo-900/50 text-indigo-300 border border-indigo-500/30 text-xs font-bold rounded transition-all uppercase tracking-wider flex items-center justify-center gap-2"
                                    >
                                        {isGenerating ? 'Processing...' : 'Close Intake Window'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </AuthorityGuard>
                </div>
            </section>

            {/* ZONE 2: Delegate Action Zone */}
            <section className="space-y-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-4">
                    Zone 2 — Delegation & Preparation
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card title="Pre-Analysis Tasks">
                        <div className="space-y-3">
                            <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors border border-slate-700/50 uppercase tracking-wider">
                                Assemble Knowledge Base
                            </button>
                            <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors border border-slate-700/50 uppercase tracking-wider">
                                Validate Team Roles
                            </button>
                        </div>
                    </Card>

                    <Card title="Authority Handover">
                        <button className="w-full py-2 bg-blue-900/20 hover:bg-blue-900/40 text-blue-400 text-xs font-bold rounded-lg border border-blue-500/30 transition-all uppercase tracking-wider">
                            Signal Executive Readiness
                        </button>
                    </Card>
                </div>
            </section>

            {/* ZONE 3: Executive Authority Zone (EXEC ONLY) */}
            <AuthorityGuard requiredCategory={AuthorityCategory.EXECUTIVE}>
                <section className="space-y-4 pt-10 border-t border-purple-900/30">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-purple-400 font-bold mb-4 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                        Zone 3 — Executive Authority (Absolute Gating)
                    </div>

                    {/* Snapshot & ROI Panel (EXEC ONLY) */}
                    <div className="mb-8">
                        <ExecutiveSnapshotPanel data={snapshotData} loading={snapshotLoading} />
                    </div>

                    {tenant.intakeWindowState !== 'CLOSED' ? (
                        <div className="p-8 border border-dashed border-purple-900/50 rounded-xl bg-purple-900/5 text-center">
                            <h3 className="text-white font-bold mb-2">Zone Locked</h3>
                            <p className="text-slate-400 text-sm max-w-md mx-auto">
                                The Executive Authority Zone is gated until the Intake Window is closed.
                                <br />
                                Please finalize the intake vectors in Zone 1.5 to proceed.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col lg:flex-row gap-6 lg:items-stretch">
                            {/* Executive Brief & Ticket Moderation (Flex Grow) */}
                            <div className="flex-1 min-w-0 space-y-6">
                                <ExecutiveBriefSurface onStatusChange={setExecStatus} />

                                <div className="p-1">
                                    <div className="text-[10px] text-slate-500 uppercase font-extrabold mb-2 pl-1">Diagnostic Review & Moderation</div>
                                    <DiagnosticModerationSurface
                                        tenantId={tenant.id}
                                        diagnosticId={tenant.lastDiagnosticId || 'latest'}
                                        onStatusChange={setModerationStatus}
                                    />
                                </div>
                            </div>

                            <div className="lg:w-[320px] shrink-0 space-y-6">
                                <RoadmapReadinessPanel
                                    tenantId={tenant.id}
                                    intakeWindowState={tenant.intakeWindowState || 'OPEN'}
                                    briefStatus={execStatus}
                                    moderationStatus={moderationStatus ? {
                                        readyForRoadmap: moderationStatus.readyForRoadmap,
                                        pending: moderationStatus.pending,
                                        approved: moderationStatus.approved
                                    } : null}
                                    roadmapStatus={data.latestRoadmap?.status || data.roadmaps?.[0]?.status || null}
                                    onFinalize={handleFinalizeRoadmap}
                                    isGenerating={isGenerating}
                                />

                                <Card title="Authority Actions">
                                    <div className="space-y-3">
                                        <button
                                            onClick={handleExecuteDiagnostic}
                                            disabled={isGenerating || !['ACKNOWLEDGED', 'WAIVED'].includes(execStatus || '')}
                                            className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-bold rounded-lg shadow-lg transition-all flex items-center justify-center gap-2"
                                        >
                                            {isGenerating ? (
                                                <>
                                                    <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                    Synthesizing...
                                                </>
                                            ) : (
                                                'Execute Diagnostic Synthesis'
                                            )}
                                        </button>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )}
                </section>
            </AuthorityGuard>

            {/* Role Simulation Control (V2 - Verification Tool) */}
            <RoleSimulator />
        </div>
    );
}

// Sub-components for clean structure
function Card({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-slate-950 border border-slate-900 rounded-xl p-5 shadow-sm hover:border-slate-800 transition-colors h-full">
            <h4 className="text-[10px] uppercase tracking-widest text-slate-600 font-inter font-extrabold mb-4">{title}</h4>
            {children}
        </div>
    );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-slate-500 font-inter">{label}</span>
            <span className="text-slate-300 font-semibold">{value}</span>
        </div>
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
