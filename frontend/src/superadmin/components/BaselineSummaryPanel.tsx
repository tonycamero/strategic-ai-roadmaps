import { useEffect, useState } from 'react';

interface BaselineData {
    id: string;
    tenantId: string;
    monthlyLeadVolume: number | null;
    avgResponseTimeMinutes: number | null;
    closeRatePercent: number | null;
    avgJobValue: number | null;
    currentTools: string[] | null;
    salesRepsCount: number | null;
    opsAdminCount: number | null;
    primaryBottleneck: string | null;
    status: 'DRAFT' | 'COMPLETE';
    createdAt: string;
    updatedAt: string;
}

interface BaselineSummaryPanelProps {
    tenantId: string;
    hasRoadmap: boolean;
}

export function BaselineSummaryPanel({ tenantId, hasRoadmap }: BaselineSummaryPanelProps) {
    const [baseline, setBaseline] = useState<BaselineData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchBaseline();
    }, [tenantId]);

    async function fetchBaseline() {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/tenants/${tenantId}/baseline-intake`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.status === 404) {
                // No baseline yet - this is expected
                setBaseline(null);
                return;
            }

            if (!res.ok) {
                throw new Error('Failed to fetch baseline');
            }

            const data = await res.json();
            setBaseline(data.baseline);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    // Derived metric: Weekly Ops Hours
    const derivedWeeklyOpsHours = baseline?.opsAdminCount
        ? baseline.opsAdminCount * 40
        : null;

    if (loading) {
        return (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
                <div className="text-xs text-slate-500 animate-pulse">Loading baseline...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-slate-950 border border-red-900/50 rounded-xl p-6">
                <div className="text-xs text-red-400">Error: {error}</div>
            </div>
        );
    }

    if (!baseline) {
        return (
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-slate-300 tracking-wider">ROI Baseline Summary</h3>
                        <p className="text-[10px] text-slate-500 font-mono mt-1">
                            BASELINE NOT CAPTURED
                        </p>
                    </div>
                    <div className="px-2 py-1 bg-amber-900/20 border border-amber-500/30 text-amber-400 text-[10px] font-bold rounded uppercase">
                        No Data
                    </div>
                </div>

                {/* Empty State */}
                <div className="p-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-5">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-slate-200 mb-1">Baseline Not Available</h4>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    The ROI baseline snapshot has not been captured yet. This data is typically collected during the owner intake process.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-slate-300 tracking-wider">ROI Baseline Summary</h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">
                        READ-ONLY • SOURCE OF TRUTH
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="px-2 py-1 bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-bold rounded uppercase">
                        Baseline
                    </div>
                    {!hasRoadmap && (
                        <div className="px-2 py-1 bg-amber-900/20 border border-amber-500/30 text-amber-400 text-[10px] font-bold rounded uppercase">
                            Overrides Locked
                        </div>
                    )}
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-800">

                {/* Column 1: Lead Metrics */}
                <div className="p-6 space-y-4">
                    <h4 className="text-[10px] tracking-widest text-slate-500 font-bold uppercase">Lead Metrics</h4>

                    <div>
                        <div className="text-[11px] text-slate-500 mb-1">Monthly Lead Volume</div>
                        <div className="text-2xl font-bold text-white">
                            {baseline.monthlyLeadVolume?.toLocaleString() || '—'}
                        </div>
                    </div>

                    <div>
                        <div className="text-[11px] text-slate-500 mb-1">Avg Response Time</div>
                        <div className="text-2xl font-bold text-white">
                            {baseline.avgResponseTimeMinutes || '—'} <span className="text-sm font-normal text-slate-500">min</span>
                        </div>
                    </div>

                    <div>
                        <div className="text-[11px] text-slate-500 mb-1">Close Rate</div>
                        <div className="text-2xl font-bold text-white">
                            {baseline.closeRatePercent || '—'}<span className="text-sm font-normal text-slate-500">%</span>
                        </div>
                    </div>
                </div>

                {/* Column 2: Team Metrics */}
                <div className="p-6 space-y-4">
                    <h4 className="text-[10px] tracking-widest text-slate-500 font-bold uppercase">Team Capacity</h4>

                    <div>
                        <div className="text-[11px] text-slate-500 mb-1">Ops/Admin Headcount</div>
                        <div className="text-2xl font-bold text-white">
                            {baseline.opsAdminCount || '—'}
                        </div>
                    </div>

                    <div>
                        <div className="text-[11px] text-slate-500 mb-1">Derived Weekly Ops Hours</div>
                        <div className="text-2xl font-bold text-emerald-400">
                            {derivedWeeklyOpsHours || '—'} <span className="text-sm font-normal text-slate-500">hrs/week</span>
                        </div>
                        {derivedWeeklyOpsHours && (
                            <div className="text-[10px] text-slate-600 mt-1">
                                {baseline.opsAdminCount} staff × 40 hrs
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="text-[11px] text-slate-500 mb-1">Sales Reps</div>
                        <div className="text-xl font-bold text-slate-300">
                            {baseline.salesRepsCount || '—'}
                        </div>
                    </div>
                </div>

                {/* Column 3: Context */}
                <div className="p-6 space-y-4 bg-slate-900/10">
                    <h4 className="text-[10px] tracking-widest text-slate-500 font-bold uppercase">Business Context</h4>

                    <div>
                        <div className="text-[11px] text-slate-500 mb-1">Avg Job Value</div>
                        <div className="text-xl font-bold text-slate-200">
                            ${baseline.avgJobValue?.toLocaleString() || '—'}
                        </div>
                    </div>

                    <div>
                        <div className="text-[11px] text-slate-500 mb-1">Primary Bottleneck</div>
                        <div className="text-sm text-slate-300 leading-tight">
                            {baseline.primaryBottleneck || 'Not specified'}
                        </div>
                    </div>

                    {baseline.currentTools && baseline.currentTools.length > 0 && (
                        <div>
                            <div className="text-[11px] text-slate-500 mb-2">Current Tools</div>
                            <div className="flex flex-wrap gap-1">
                                {baseline.currentTools.map((tool, idx) => (
                                    <span
                                        key={idx}
                                        className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-400 text-[10px] rounded"
                                    >
                                        {tool}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Note */}
            <div className="px-6 py-3 bg-slate-900/20 border-t border-slate-800">
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                        Baseline data is immutable. {hasRoadmap ? 'Overrides available via snapshots.' : 'Generate roadmap to unlock executive overrides.'}
                    </span>
                </div>
            </div>
        </div>
    );
}
