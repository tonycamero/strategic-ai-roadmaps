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
    const [showEditor, setShowEditor] = useState(false);
    const [saving, setSaving] = useState(false);

    type BaselineDraft = Omit<BaselineData, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>;

    const emptyDraft: BaselineDraft = {
        monthlyLeadVolume: null,
        avgResponseTimeMinutes: null,
        closeRatePercent: null,
        avgJobValue: null,
        currentTools: [],
        salesRepsCount: null,
        opsAdminCount: null,
        primaryBottleneck: null,
        status: 'DRAFT',
    };

    const [draft, setDraft] = useState<BaselineDraft>(emptyDraft);

    function openCreate() {
        setDraft(emptyDraft);
        setShowEditor(true);
    }

    function openEdit() {
        if (!baseline) return;
        const { monthlyLeadVolume, avgResponseTimeMinutes, closeRatePercent, avgJobValue, currentTools, salesRepsCount, opsAdminCount, primaryBottleneck, status } = baseline;
        setDraft({
            monthlyLeadVolume,
            avgResponseTimeMinutes,
            closeRatePercent,
            avgJobValue,
            currentTools: currentTools ?? [],
            salesRepsCount,
            opsAdminCount,
            primaryBottleneck,
            status,
        });
        setShowEditor(true);
    }

    async function saveDraft() {
        try {
            setSaving(true);
            setError(null);
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/superadmin/firms/${tenantId}/metrics/baseline`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(draft),
            });

            if (res.status === 409) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j?.error || 'Baseline is COMPLETE and locked');
            }

            if (!res.ok) throw new Error('Failed to save baseline');

            setShowEditor(false);
            await fetchBaseline();
        } catch (e: any) {
            setError(e.message || 'Failed to save baseline');
        } finally {
            setSaving(false);
        }
    }

    useEffect(() => {
        fetchBaseline();
    }, [tenantId]);

    const isLocked = baseline?.status === 'COMPLETE';

    async function fetchBaseline() {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/superadmin/firms/${tenantId}/roi-baseline`, {
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
            // Backend now returns { ok: true, baseline: ... }
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

    return (
        <>
            {!baseline ? (
                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-slate-300 tracking-wider">ROI Baseline Summary</h3>
                            <p className="text-[10px] text-slate-500 font-mono mt-1">
                                BASELINE NOT CAPTURED
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="px-2 py-1 bg-amber-900/20 border border-amber-500/30 text-amber-400 text-[10px] font-bold rounded uppercase">
                                No Data
                            </div>
                            <button
                                onClick={openCreate}
                                className="px-3 py-1 bg-slate-800 border border-slate-700 text-slate-200 text-[10px] font-bold rounded uppercase hover:bg-slate-700"
                            >
                                Create Baseline
                            </button>
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
            ) : (
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
                            <button
                                onClick={openEdit}
                                className="px-3 py-1 bg-slate-800 border border-slate-700 text-slate-200 text-[10px] font-bold rounded uppercase hover:bg-slate-700"
                            >
                                {isLocked ? 'View Baseline' : 'Edit Baseline'}
                            </button>
                            {isLocked ? (
                                <div className="px-2 py-1 bg-teal-900/20 border border-teal-500/30 text-teal-400 text-[10px] font-bold rounded uppercase">
                                    Locked
                                </div>
                            ) : (
                                <div className="px-2 py-1 bg-amber-900/20 border border-amber-500/30 text-amber-400 text-[10px] font-bold rounded uppercase">
                                    Draft
                                </div>
                            )}
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
            )}

            {showEditor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
                    <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
                        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-slate-200 tracking-wider">
                                    {baseline ? 'Edit ROI Baseline' : 'Create ROI Baseline'}
                                </h3>
                                <p className="text-[10px] text-slate-500 font-mono mt-1">
                                    OPERATOR INPUT • SOURCE OF TRUTH (LOCKABLE)
                                </p>
                            </div>
                            <button
                                onClick={() => setShowEditor(false)}
                                className="px-2 py-1 bg-slate-900 border border-slate-700 text-slate-300 text-[10px] font-bold rounded uppercase hover:bg-slate-800"
                            >
                                Close
                            </button>
                        </div>

                        <div className="p-6 grid grid-cols-2 gap-4">
                            {isLocked && (
                                <div className="col-span-2 bg-amber-900/10 border border-amber-500/20 rounded p-3 flex items-center gap-3 mb-2">
                                    <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m11 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-[11px] text-amber-200/80 font-mono uppercase tracking-tight">
                                        Locked — Snapshot Required to Modify
                                    </span>
                                </div>
                            )}

                            <label className="text-xs text-slate-400">
                                Monthly Lead Volume
                                <input
                                    type="number"
                                    disabled={isLocked}
                                    value={draft.monthlyLeadVolume ?? ''}
                                    onChange={(e) => setDraft({ ...draft, monthlyLeadVolume: e.target.value === '' ? null : Number(e.target.value) })}
                                    className="mt-1 w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-slate-600 disabled:opacity-50"
                                />
                            </label>

                            <label className="text-xs text-slate-400">
                                Avg Response Time (minutes)
                                <input
                                    type="number"
                                    disabled={isLocked}
                                    value={draft.avgResponseTimeMinutes ?? ''}
                                    onChange={(e) => setDraft({ ...draft, avgResponseTimeMinutes: e.target.value === '' ? null : Number(e.target.value) })}
                                    className="mt-1 w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-slate-600 disabled:opacity-50"
                                />
                            </label>

                            <label className="text-xs text-slate-400">
                                Close Rate (%)
                                <input
                                    type="number"
                                    disabled={isLocked}
                                    value={draft.closeRatePercent ?? ''}
                                    onChange={(e) => setDraft({ ...draft, closeRatePercent: e.target.value === '' ? null : Number(e.target.value) })}
                                    className="mt-1 w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-slate-600 disabled:opacity-50"
                                />
                            </label>

                            <label className="text-xs text-slate-400">
                                Avg Job Value
                                <input
                                    type="number"
                                    disabled={isLocked}
                                    value={draft.avgJobValue ?? ''}
                                    onChange={(e) => setDraft({ ...draft, avgJobValue: e.target.value === '' ? null : Number(e.target.value) })}
                                    className="mt-1 w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-slate-600 disabled:opacity-50"
                                />
                            </label>

                            <label className="text-xs text-slate-400">
                                Sales Reps Count
                                <input
                                    type="number"
                                    disabled={isLocked}
                                    value={draft.salesRepsCount ?? ''}
                                    onChange={(e) => setDraft({ ...draft, salesRepsCount: e.target.value === '' ? null : Number(e.target.value) })}
                                    className="mt-1 w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-slate-600 disabled:opacity-50"
                                />
                            </label>

                            <label className="text-xs text-slate-400">
                                Ops/Admin Count
                                <input
                                    type="number"
                                    disabled={isLocked}
                                    value={draft.opsAdminCount ?? ''}
                                    onChange={(e) => setDraft({ ...draft, opsAdminCount: e.target.value === '' ? null : Number(e.target.value) })}
                                    className="mt-1 w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-slate-600 disabled:opacity-50"
                                />
                            </label>

                            <label className="text-xs text-slate-400 col-span-2">
                                Primary Bottleneck
                                <input
                                    type="text"
                                    disabled={isLocked}
                                    value={draft.primaryBottleneck ?? ''}
                                    onChange={(e) => setDraft({ ...draft, primaryBottleneck: e.target.value === '' ? null : e.target.value })}
                                    className="mt-1 w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-slate-600 disabled:opacity-50"
                                />
                            </label>

                            <label className="text-xs text-slate-400 col-span-2">
                                Current Tools (comma-separated)
                                <input
                                    type="text"
                                    disabled={isLocked}
                                    value={(draft.currentTools ?? []).join(', ')}
                                    onChange={(e) =>
                                        setDraft({
                                            ...draft,
                                            currentTools: e.target.value
                                                .split(',')
                                                .map((x) => x.trim())
                                                .filter((x) => x.length > 0),
                                        })
                                    }
                                    className="mt-1 w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-slate-600 disabled:opacity-50"
                                />
                            </label>

                            {!isLocked && (
                                <label className="text-xs text-slate-400">
                                    Status
                                    <select
                                        value={draft.status}
                                        onChange={(e) => setDraft({ ...draft, status: e.target.value as any })}
                                        className="mt-1 w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-slate-600"
                                    >
                                        <option value="DRAFT">DRAFT</option>
                                        <option value="COMPLETE">COMPLETE</option>
                                    </select>
                                </label>
                            )}

                            <div className="col-span-2 flex justify-end gap-2 pt-2">
                                <button
                                    onClick={() => setShowEditor(false)}
                                    className="px-4 py-2 bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold rounded hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                {!isLocked && (
                                    <button
                                        onClick={saveDraft}
                                        disabled={saving}
                                        className="px-4 py-2 bg-teal-900/30 border border-teal-500/30 text-teal-200 text-xs font-bold rounded hover:bg-teal-900/40 disabled:opacity-50"
                                    >
                                        {saving ? 'Saving…' : 'Save'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
