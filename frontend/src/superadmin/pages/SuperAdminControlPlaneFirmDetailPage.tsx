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

export default function SuperAdminControlPlaneFirmDetailPage() {
    const [, params] = useRoute<{ tenantId: string }>('/superadmin/execute/firms/:tenantId');

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
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
    }, [params?.tenantId]);

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
            </div>
        </div>
    );
}
