import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { useAuth } from '../context/AuthContext';

interface BaselineIntakeData {
    monthlyLeadVolume?: number;
    avgResponseTimeMinutes?: number;
    closeRatePercent?: number;
    avgJobValue?: number;
    currentTools?: string[];
    salesRepsCount?: number;
    opsAdminCount?: number;
    primaryBottleneck?: string;
    status?: 'DRAFT' | 'COMPLETE';
}

export default function BaselineIntakePage() {
    const [location, setLocation] = useLocation();
    const { user, isLoading: authLoading } = useAuth();

    // CR-FIX-BL-CTX-ROUTE-1: Resolve tenantId from route param (primary) or auth (fallback)
    const { tenantId: paramsTenantId } = useParams();
    const authTenantId = user?.tenantId;
    const tenantId = paramsTenantId ?? authTenantId;

    const firmId = tenantId; // Domain alias for clarity

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<BaselineIntakeData>({
        currentTools: []
    });

    // Effect: Canonical Redirect
    // If we are on the generic /baseline-intake route but have a resolved tenantId,
    // redirect to the canonical /tenants/:tenantId/baseline-intake route.
    useEffect(() => {
        if (location === '/baseline-intake' && tenantId) {
            setLocation(`/tenants/${tenantId}/baseline-intake`, { replace: true });
        }
    }, [location, tenantId, setLocation]);

    // Effect: Load data only when tenantId is resolved
    useEffect(() => {
        if (tenantId && !authLoading) {
            loadBaselineData();
        }
        // Silent fall-through: if no tenantId, we render specific UI states below instead of logging/erroring
    }, [tenantId, authLoading]);

    const loadBaselineData = async () => {
        if (!tenantId) return; // double guard

        try {
            const response = await fetch(`/api/tenants/${tenantId}/baseline-intake`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.baseline) {
                    setFormData(data.baseline);
                }
            } else {
                console.warn('[BaselineIntakePage] Failed to fetch baseline:', response.status);
            }
        } catch (error) {
            console.error('Failed to load baseline:', error);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || (loading && tenantId)) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-slate-400">Loading firm context...</div>
            </div>
        );
    }

    const handleSave = async (markComplete = false) => {
        setSaving(true);
        try {
            const response = await fetch(`/api/tenants/${tenantId}/baseline-intake`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    status: markComplete ? 'COMPLETE' : 'DRAFT'
                })
            });

            if (response.ok) {
                const data = await response.json();
                setFormData(data.baseline);
                if (markComplete) {
                    // Redirect to next step (Team Intakes)
                    setLocation(`/firms/${tenantId}/team-intakes`);
                } else {
                    alert('Draft saved successfully!');
                }
            } else {
                console.error('[BaselineIntakePage] Failed to save baseline:', response.status);
                alert('Failed to save baseline intake');
            }
        } catch (error) {
            console.error('Failed to save baseline:', error);
            // Optionally, show an error message to the user
        } finally {
            setSaving(false);
        }
    };

    const toolOptions = ['CRM', 'Scheduling', 'Invoicing', 'Email/Comms', 'Project Management', 'Other'];

    const toggleTool = (tool: string) => {
        const current = formData.currentTools || [];
        if (current.includes(tool)) {
            setFormData({ ...formData, currentTools: current.filter(t => t !== tool) });
        } else {
            setFormData({ ...formData, currentTools: [...current, tool] });
        }
    };

    // Guard: Missing Auth
    if (!user) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-red-400 text-center">
                    <p className="mb-4">Authentication required.</p>
                    <button
                        onClick={() => setLocation('/login')}
                        className="text-blue-400 hover:text-blue-300 underline"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    // Guard: Missing Tenant Context (Internal/SuperAdmin)
    const isInternal = user.isInternal || ['superadmin', 'delegate', 'executive'].includes(user.role);

    if (!tenantId) {
        if (isInternal) {
            return (
                <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 max-w-md text-center">
                        <h2 className="text-xl font-semibold text-slate-200 mb-2">Tenant-Only Step</h2>
                        <p className="text-slate-400 mb-6">
                            The Baseline Intake form is tied to a specific firm. Please access this page from a Firm Detail view or impersonate a tenant session.
                        </p>
                        <button
                            onClick={() => setLocation('/superadmin/firms')}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors"
                        >
                            Return to Control Plane
                        </button>
                    </div>
                </div>
            );
        }

        // Guard: Missing Tenant Context (Unknown Error)
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-red-900/50 rounded-lg p-8 max-w-md text-center">
                    <h2 className="text-xl font-semibold text-red-400 mb-2">Context Unavailable</h2>
                    <p className="text-slate-400 mb-6">
                        We could not determine your firm context. Please try logging in again.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="text-slate-500 hover:text-slate-400 underline"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-100 mb-2">Baseline Intake</h1>
                    <p className="text-slate-400">
                        Capture your current business metrics to establish a baseline before team intakes begin.
                    </p>
                </div>

                {/* Form */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-8 card-glow-hover">
                    {/* Monthly Lead Volume */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Monthly Lead Volume
                        </label>
                        <input
                            type="number"
                            value={formData.monthlyLeadVolume || ''}
                            onChange={(e) => setFormData({ ...formData, monthlyLeadVolume: parseInt(e.target.value) || undefined })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="e.g., 50"
                        />
                    </div>

                    {/* Avg Response Time */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Average Response Time to New Leads (minutes)
                        </label>
                        <input
                            type="number"
                            value={formData.avgResponseTimeMinutes || ''}
                            onChange={(e) => setFormData({ ...formData, avgResponseTimeMinutes: parseInt(e.target.value) || undefined })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="e.g., 120"
                        />
                    </div>

                    {/* Close Rate */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Close Rate (%)
                        </label>
                        <input
                            type="number"
                            value={formData.closeRatePercent || ''}
                            onChange={(e) => setFormData({ ...formData, closeRatePercent: parseInt(e.target.value) || undefined })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="e.g., 25"
                            min="0"
                            max="100"
                        />
                    </div>

                    {/* Avg Job Value */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Average Job Value / Deal Size ($)
                        </label>
                        <input
                            type="number"
                            value={formData.avgJobValue || ''}
                            onChange={(e) => setFormData({ ...formData, avgJobValue: parseInt(e.target.value) || undefined })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="e.g., 5000"
                        />
                    </div>

                    {/* Current Tools */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-3">
                            Current Tools (select all that apply)
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {toolOptions.map(tool => (
                                <button
                                    key={tool}
                                    type="button"
                                    onClick={() => toggleTool(tool)}
                                    className={`px-4 py-3 rounded-xl border transition-all font-medium ${(formData.currentTools || []).includes(tool)
                                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20'
                                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600 hover:bg-slate-900'
                                        }`}
                                >
                                    {tool}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sales Reps Count */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Number of Sales Reps
                        </label>
                        <input
                            type="number"
                            value={formData.salesRepsCount || ''}
                            onChange={(e) => setFormData({ ...formData, salesRepsCount: parseInt(e.target.value) || undefined })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="e.g., 3"
                        />
                    </div>

                    {/* Ops/Admin Count */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Number of Ops/Admin Staff
                        </label>
                        <input
                            type="number"
                            value={formData.opsAdminCount || ''}
                            onChange={(e) => setFormData({ ...formData, opsAdminCount: parseInt(e.target.value) || undefined })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="e.g., 2"
                        />
                    </div>

                    {/* Primary Bottleneck */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Primary Bottleneck (describe briefly)
                        </label>
                        <textarea
                            value={formData.primaryBottleneck || ''}
                            onChange={(e) => setFormData({ ...formData, primaryBottleneck: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="e.g., Lead follow-up takes too long, manual data entry slows us down..."
                            rows={3}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-4">
                        <button
                            onClick={() => handleSave(false)}
                            disabled={saving}
                            className="px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold uppercase tracking-widest text-sm transition-all disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Draft'}
                        </button>
                        <button
                            onClick={() => handleSave(true)}
                            disabled={saving}
                            className="flex-1 px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold uppercase tracking-widest text-sm transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Mark Baseline Ready →'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
