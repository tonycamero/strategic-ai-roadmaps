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

    // Economic Baseline (METATICKET V2.4)
    weeklyRevenue: number | null;
    peakHourRevenuePct: number | null;
    laborPct: number | null;
    overtimePct: number | null;
    grossMarginPct: number | null;
    averageTicket: number | null;
    economicConfidenceLevel: 'DRAFT' | 'ESTIMATED' | 'OPERATOR_VERIFIED' | 'LOCKED';
    baselineLockedAt: string | null;
    lockedByUserId: string | null;

    status: 'DRAFT' | 'COMPLETE';
    createdAt: string;
    updatedAt: string;
}

interface BaselineSummaryPanelProps {
    tenantId: string;
    hasRoadmap: boolean;
    isSuperAdmin: boolean;
    isImpersonating?: boolean;
}

export function BaselineSummaryPanel({ tenantId, hasRoadmap, isSuperAdmin, isImpersonating }: BaselineSummaryPanelProps) {
    const [baseline, setBaseline] = useState<BaselineData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<BaselineData>>({});

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
                setBaseline(null);
                return;
            }

            if (!res.ok) {
                throw new Error('Failed to fetch baseline');
            }

            const data = await res.json();
            setBaseline(data.baseline);
            setFormData(data.baseline);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave(isLocking: boolean = false) {
        if (isLocking && !window.confirm('Are you sure you want to lock this baseline? All economic modeling in Stage 5 will be pinned to these values. This cannot be undone.')) {
            return;
        }

        setIsSaving(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/tenants/${tenantId}/baseline-intake`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    isLocked: isLocking
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to save baseline');
            }

            await fetchBaseline();
            setIsEditing(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    }

    const isLocked = !!baseline?.baselineLockedAt;
    const canEdit = isSuperAdmin && !isImpersonating && !isLocked;

    // Derived metric: Weekly Ops Hours
    const derivedWeeklyOpsHours = baseline?.opsAdminCount
        ? baseline.opsAdminCount * 40
        : (formData.opsAdminCount ? formData.opsAdminCount * 40 : null);

    if (loading) {
        return (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
                <div className="text-xs text-slate-500 animate-pulse">Loading baseline economics...</div>
            </div>
        );
    }

    if (!baseline && !isEditing) {
        return (
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-slate-300 tracking-wider">ROI Baseline Summary</h3>
                        <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase">Baseline Not Captured</p>
                    </div>
                    {canEdit && (
                        <button
                            onClick={() => {
                                setFormData({ economicConfidenceLevel: 'DRAFT', currentTools: [] });
                                setIsEditing(true);
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded uppercase transition-colors"
                        >
                            Capture Baseline
                        </button>
                    )}
                </div>
                <div className="p-12 text-center">
                    <div className="text-slate-500 text-xs mb-4 italic">No baseline facts have been captured for this firm yet.</div>
                    {!canEdit && <div className="text-[10px] text-slate-600 uppercase font-bold tracking-widest">Restricted to SuperAdmin</div>}
                </div>
            </div>
        );
    }

    const ConfidenceBadge = ({ level }: { level: string }) => {
        const colors: Record<string, string> = {
            'DRAFT': 'bg-slate-800 text-slate-400 border-slate-700',
            'ESTIMATED': 'bg-blue-900/20 text-blue-400 border-blue-500/30',
            'OPERATOR_VERIFIED': 'bg-purple-900/20 text-purple-400 border-purple-500/30',
            'LOCKED': 'bg-emerald-900/20 text-emerald-400 border-emerald-500/30'
        };
        return (
            <div className={`px-2 py-0.5 border text-[9px] font-bold rounded uppercase tracking-tighter ${colors[level] || colors.DRAFT}`}>
                {level.replace('_', ' ')}
            </div>
        );
    };

    return (
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-slate-300 tracking-wider">ROI Baseline Summary</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-[10px] text-slate-500 font-mono uppercase">
                            {isLocked ? 'V1 Locked • Truth Source' : 'Mutable • Stage 4 Intake'}
                        </p>
                        {isLocked && baseline?.baselineLockedAt && (
                            <span className="text-[9px] text-slate-600 font-mono italic">
                                locked {new Date(baseline.baselineLockedAt).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <ConfidenceBadge level={isEditing ? (formData.economicConfidenceLevel || 'DRAFT') : (baseline?.economicConfidenceLevel || 'DRAFT')} />

                    {canEdit && !isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-[10px] text-blue-400 hover:text-blue-300 font-bold uppercase underline"
                        >
                            Edit
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="px-6 py-2 bg-red-900/20 border-b border-red-900/50 text-[10px] text-red-400">
                    Error: {error}
                </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-800">

                {/* Column 1: Lead Metrics */}
                <div className="p-6 space-y-4">
                    <h4 className="text-[10px] tracking-widest text-slate-500 font-bold uppercase">Volume & Efficiency</h4>

                    <MetricField
                        label="Monthly Lead Volume"
                        value={isEditing ? formData.monthlyLeadVolume : baseline?.monthlyLeadVolume}
                        isEditing={isEditing}
                        onChange={(v) => setFormData({ ...formData, monthlyLeadVolume: parseInt(v) })}
                        type="number"
                    />

                    <MetricField
                        label="Avg Response Time (min)"
                        value={isEditing ? formData.avgResponseTimeMinutes : baseline?.avgResponseTimeMinutes}
                        isEditing={isEditing}
                        onChange={(v) => setFormData({ ...formData, avgResponseTimeMinutes: parseInt(v) })}
                        type="number"
                        suffix="min"
                    />

                    <MetricField
                        label="Close Rate"
                        value={isEditing ? formData.closeRatePercent : baseline?.closeRatePercent}
                        isEditing={isEditing}
                        onChange={(v) => setFormData({ ...formData, closeRatePercent: parseInt(v) })}
                        type="number"
                        suffix="%"
                    />
                </div>

                {/* Column 2: Economic Metrics */}
                <div className="p-6 space-y-4 bg-slate-900/5">
                    <h4 className="text-[10px] tracking-widest text-blue-500 font-bold uppercase">Economic Metrics</h4>

                    <MetricField
                        label="Weekly Revenue"
                        value={isEditing ? formData.weeklyRevenue : baseline?.weeklyRevenue}
                        isEditing={isEditing}
                        onChange={(v) => setFormData({ ...formData, weeklyRevenue: parseInt(v) })}
                        type="number"
                        prefix="$"
                    />

                    <MetricField
                        label="Peak Hour Revenue %"
                        value={isEditing ? formData.peakHourRevenuePct : baseline?.peakHourRevenuePct}
                        isEditing={isEditing}
                        onChange={(v) => setFormData({ ...formData, peakHourRevenuePct: parseInt(v) })}
                        type="number"
                        suffix="%"
                        hint="Revenue concentration in top 4 hrs"
                    />

                    <MetricField
                        label="Avg Ticket / Job Value"
                        value={isEditing ? formData.averageTicket : (baseline?.averageTicket || baseline?.avgJobValue)}
                        isEditing={isEditing}
                        onChange={(v) => setFormData({ ...formData, averageTicket: parseInt(v) })}
                        type="number"
                        prefix="$"
                    />
                </div>

                {/* Column 3: Resource Metrics */}
                <div className="p-6 space-y-4">
                    <h4 className="text-[10px] tracking-widest text-slate-500 font-bold uppercase">Labor & Margin</h4>

                    <div className="grid grid-cols-2 gap-4">
                        <MetricField
                            label="Labor %"
                            value={isEditing ? formData.laborPct : baseline?.laborPct}
                            isEditing={isEditing}
                            onChange={(v) => setFormData({ ...formData, laborPct: parseInt(v) })}
                            type="number"
                            suffix="%"
                        />
                        <MetricField
                            label="Overtime %"
                            value={isEditing ? formData.overtimePct : baseline?.overtimePct}
                            isEditing={isEditing}
                            onChange={(v) => setFormData({ ...formData, overtimePct: parseInt(v) })}
                            type="number"
                            suffix="%"
                        />
                    </div>

                    <MetricField
                        label="Gross Margin %"
                        value={isEditing ? formData.grossMarginPct : baseline?.grossMarginPct}
                        isEditing={isEditing}
                        onChange={(v) => setFormData({ ...formData, grossMarginPct: parseInt(v) })}
                        type="number"
                        suffix="%"
                    />

                    <div className="pt-2 border-t border-slate-900">
                        <div className="text-[10px] text-slate-500 mb-1">Weekly Ops Hours</div>
                        <div className="text-xl font-bold text-emerald-400">
                            {derivedWeeklyOpsHours || '—'} <span className="text-xs font-normal text-slate-500 ml-1">hrs/week</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Actions */}
            {isEditing && (
                <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Confidence Level</label>
                            <select
                                value={formData.economicConfidenceLevel}
                                onChange={(e) => setFormData({ ...formData, economicConfidenceLevel: e.target.value as any })}
                                className="bg-slate-800 border border-slate-700 text-xs text-white rounded px-2 py-1 outline-none"
                            >
                                <option value="DRAFT">DRAFT</option>
                                <option value="ESTIMATED">ESTIMATED</option>
                                <option value="OPERATOR_VERIFIED">OPERATOR VERIFIED</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2 mt-4 ml-2">
                            <input
                                type="checkbox"
                                id="lock-baseline"
                                className="w-3 h-3 accent-emerald-500"
                                onChange={(e) => { }} // Handle via separate button for safety
                                disabled={isSaving}
                            />
                            <label htmlFor="lock-baseline" className="text-[10px] text-slate-400 font-bold uppercase cursor-pointer">
                                Ready to Lock V1
                            </label>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={isSaving}
                            onClick={() => { setIsEditing(false); setError(null); fetchBaseline(); }}
                            className="px-3 py-1 text-[10px] font-bold text-slate-400 hover:text-slate-300 uppercase"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={isSaving}
                            onClick={() => handleSave(false)}
                            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold rounded uppercase transition-colors"
                        >
                            {isSaving ? 'Saving...' : 'Save Draft'}
                        </button>
                        <button
                            disabled={isSaving}
                            onClick={() => handleSave(true)}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded uppercase transition-colors shadow-lg shadow-emerald-900/20"
                        >
                            {isSaving ? 'Locking...' : 'Lock Baseline V1'}
                        </button>
                    </div>
                </div>
            )}

            {/* Footer / Review Cycle */}
            {!isEditing && (
                <div className="px-6 py-4 bg-slate-900/20 border-t border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>
                            {isLocked
                                ? "Baseline Locked. Future changes must be recorded as 30/60/90 day reviews."
                                : "Baseline estimates active. Lock required before full Stage 5 induction."}
                        </span>
                    </div>
                    {isLocked && (
                        <button
                            disabled
                            className="text-[9px] text-slate-600 font-bold uppercase px-2 py-1 border border-slate-800 rounded opacity-50 cursor-not-allowed"
                        >
                            Start 30-Day Review (Coming Soon)
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

interface MetricFieldProps {
    label: string;
    value: any;
    isEditing?: boolean;
    onChange?: (val: string) => void;
    type?: 'text' | 'number';
    prefix?: string;
    suffix?: string;
    hint?: string;
}

function MetricField({ label, value, isEditing, onChange, type = 'text', prefix, suffix, hint }: MetricFieldProps) {
    if (isEditing && onChange) {
        return (
            <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">{label}</label>
                <div className="flex items-center gap-1">
                    {prefix && <span className="text-xs text-slate-500">{prefix}</span>}
                    <input
                        type={type}
                        value={value ?? ''}
                        onChange={(e) => onChange(e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-sm text-white rounded px-2 py-1 w-full outline-none focus:border-blue-500/50 transition-colors"
                        autoFocus={false}
                    />
                    {suffix && <span className="text-xs text-slate-500">{suffix}</span>}
                </div>
                {hint && <div className="text-[9px] text-slate-600 italic leading-tight">{hint}</div>}
            </div>
        );
    }

    return (
        <div>
            <div className="text-[11px] text-slate-500 mb-0.5">{label}</div>
            <div className={`text-2xl font-bold ${value ? 'text-white' : 'text-slate-800'}`}>
                {prefix}{value?.toLocaleString() || '—'}{suffix}
            </div>
            {hint && <div className="text-[9px] text-slate-600 mt-1">{hint}</div>}
        </div>
    );
}
