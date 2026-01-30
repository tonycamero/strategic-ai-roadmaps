import { useState, useEffect, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { api } from '../../lib/api';

export default function ExecutiveIntake() {
    const { logout } = useAuth();
    const { tenant } = useTenant();
    const [, setLocation] = useLocation();
    const [isUpdate, setIsUpdate] = useState(false);
    const queryClient = useQueryClient();
    const { refresh: refreshOnboarding } = useOnboarding();

    const [formData, setFormData] = useState({
        strategic_focus: '',
        operational_bottlenecks: '',
        cross_departmental_friction: '',
        transformation_appetite: '',
        resource_allocation: '',
        growth_constraints: '',
    });

    const { data: intakeData } = useQuery({
        queryKey: ['my-intake'],
        queryFn: () => api.getMyIntake(),
    });

    const coachingFeedback = (intakeData as any)?.intake?.coachingFeedback ?? {};

    useEffect(() => {
        if (intakeData?.intake) {
            setIsUpdate(true);
            setFormData(prev => ({
                ...prev,
                ...((intakeData.intake?.answers || {}) as any),
            }));
        }
    }, [intakeData]);

    const submitMutation = useMutation({
        mutationFn: api.submitIntake,
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['my-intake'] }),
                refreshOnboarding(),
            ]);
            setTimeout(() => {
                setLocation('/dashboard');
            }, 1500);
        },
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        submitMutation.mutate({ role: 'exec_sponsor', answers: formData });
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <div className="border-b border-slate-800 bg-slate-950/95 backdrop-blur">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-100">Executive Strategic Intake</h1>
                        <p className="text-sm text-slate-400">High-level perspective on organizational alignment and growth.</p>
                    </div>
                    <button
                        onClick={() => {
                            logout();
                            setLocation('/');
                        }}
                        className="text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <form onSubmit={handleSubmit} className="bg-slate-900 rounded-lg border border-slate-800 p-8 space-y-6">
                    {isUpdate && (
                        <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3 mb-4">
                            <p className="text-sm text-blue-300">
                                ℹ️ You've already submitted this form. You can update your responses anytime.
                            </p>
                        </div>
                    )}

                    {submitMutation.isSuccess && (
                        <div className="bg-green-900/20 border border-green-800 rounded-lg p-3 mb-4">
                            <p className="text-sm text-green-300">
                                ✅ Form {isUpdate ? 'updated' : 'submitted'} successfully!
                            </p>
                        </div>
                    )}

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-200 mb-2">
                                Strategic Focus & Objectives
                            </label>
                            <textarea
                                value={formData.strategic_focus}
                                onChange={(e) => handleChange('strategic_focus', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={3}
                                placeholder="What are your primary strategic objectives for the next 12-24 months?..."
                                required
                            />
                            <ConsultantFeedback feedback={coachingFeedback.strategic_focus} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-200 mb-2">
                                Organizational Bottlenecks
                            </label>
                            <textarea
                                value={formData.operational_bottlenecks}
                                onChange={(e) => handleChange('operational_bottlenecks', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={3}
                                placeholder="From your perspective, what is the single biggest bottleneck slowing down the entire organization?..."
                                required
                            />
                            <ConsultantFeedback feedback={coachingFeedback.operational_bottlenecks} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-200 mb-2">
                                Cross-Departmental Friction
                            </label>
                            <textarea
                                value={formData.cross_departmental_friction}
                                onChange={(e) => handleChange('cross_departmental_friction', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={3}
                                placeholder="Where are the biggest silos or hand-off failures between Sales, Ops, and Delivery?..."
                                required
                            />
                            <ConsultantFeedback feedback={coachingFeedback.cross_departmental_friction} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-200 mb-2">
                                Transformation Appetite
                            </label>
                            <select
                                value={formData.transformation_appetite}
                                onChange={(e) => handleChange('transformation_appetite', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            >
                                <option value="">Select organizational readiness...</option>
                                <option value="1-3">Conservative - Prefer stable, proven workflows</option>
                                <option value="4-6">Iterative - Willing to improve, but cautious of disruption</option>
                                <option value="7-8">Aggressive - Ready for significant process shifts for growth</option>
                                <option value="9-10">Pioneering - Actively seeking total transformation</option>
                            </select>
                            <ConsultantFeedback feedback={coachingFeedback.transformation_appetite} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-200 mb-2">
                                Resource Allocation Inefficiency
                            </label>
                            <textarea
                                value={formData.resource_allocation}
                                onChange={(e) => handleChange('resource_allocation', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={3}
                                placeholder="Where do you feel capital or labor resources are being most wasted today?..."
                                required
                            />
                            <ConsultantFeedback feedback={coachingFeedback.resource_allocation} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-200 mb-2">
                                Growth Constraints
                            </label>
                            <textarea
                                value={formData.growth_constraints}
                                onChange={(e) => handleChange('growth_constraints', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={3}
                                placeholder="What is the #1 internal barrier preventing you from doubling in size?..."
                                required
                            />
                            <ConsultantFeedback feedback={coachingFeedback.growth_constraints} />
                        </div>
                    </div>

                    {submitMutation.isError && (
                        <div className="bg-red-900/20 border border-red-800 text-red-300 px-4 py-3 rounded-lg text-sm">
                            Failed to submit form. Please try again.
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitMutation.isPending}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitMutation.isPending ? (isUpdate ? 'Updating...' : 'Submitting...') : (isUpdate ? 'Update Intake Form' : 'Submit Intake Form')}
                    </button>
                </form>
            </div>
        </div>
    );
}

function ConsultantFeedback({ feedback }: { feedback?: { comment: string; isFlagged: boolean } }) {
    if (!feedback || (!feedback.comment && !feedback.isFlagged)) return null;

    return (
        <div className={`mt-2 p-3 rounded-lg border text-sm transition-all ${feedback.isFlagged ? 'bg-red-900/10 border-red-800/50 ring-1 ring-red-500/20' : 'bg-slate-800/40 border-slate-800'}`}>
            <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        Consultant Coaching
                    </span>
                </div>
                {feedback.isFlagged && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-full">
                        <span className="w-1 h-1 rounded-full bg-red-400 animate-ping" />
                        <span className="text-[9px] font-bold uppercase tracking-tight text-red-400">
                            Needs Revision
                        </span>
                    </div>
                )}
            </div>
            {feedback.comment && (
                <p className="text-slate-300 italic leading-relaxed pl-3 border-l border-slate-700/50">
                    "{feedback.comment}"
                </p>
            )}
        </div>
    );
}
