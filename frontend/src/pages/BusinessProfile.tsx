import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTenant } from '../context/TenantContext';
import { useOnboarding } from '../context/OnboardingContext';

export default function BusinessProfile() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { tenant, isLoading: tenantLoading } = useTenant();
  const { refresh: refreshOnboarding } = useOnboarding();

  const [formData, setFormData] = useState({
    name: '',
    teamHeadcount: 5,
    baselineMonthlyLeads: 40,
    firmSizeTier: 'small' as 'micro' | 'small' | 'mid' | 'large',
    segment: '',
    region: '',
  });

  // Populate form with existing tenant data when loaded
  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name || '',
        teamHeadcount: tenant.teamHeadcount || 5,
        baselineMonthlyLeads: tenant.baselineMonthlyLeads || 40,
        firmSizeTier: (tenant.firmSizeTier as 'micro' | 'small' | 'mid' | 'large') || 'small',
        segment: tenant.segment || '',
        region: tenant.region || '',
      });
    }
  }, [tenant]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/tenants/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      return res.json();
    },
    onSuccess: async () => {
      // Invalidate and refetch queries before navigating
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['owner-dashboard'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['onboarding-progress'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['tenant'], refetchType: 'all' }),
        refreshOnboarding(),
      ]);

      setLocation('/dashboard');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  if (tenantLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-100">Business Profile</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Help us understand your business
            </p>
          </div>
          <button
            onClick={() => setLocation('/dashboard')}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-200 mb-2">
              Company Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Hayes Real Estate Group"
            />
          </div>

          {/* Team Size */}
          <div>
            <label htmlFor="teamHeadcount" className="block text-sm font-medium text-slate-200 mb-2">
              Team Size <span className="text-red-400">*</span>
            </label>
            <p className="text-xs text-slate-400 mb-2">
              How many people work at your company (including yourself)?
            </p>
            <input
              type="number"
              id="teamHeadcount"
              value={formData.teamHeadcount}
              onChange={(e) => setFormData({ ...formData, teamHeadcount: parseInt(e.target.value) || 0 })}
              required
              min="1"
              max="10000"
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Firm Size Tier */}
          <div>
            <label htmlFor="firmSizeTier" className="block text-sm font-medium text-slate-200 mb-2">
              Firm Size Category
            </label>
            <select
              id="firmSizeTier"
              value={formData.firmSizeTier}
              onChange={(e) => setFormData({ ...formData, firmSizeTier: e.target.value as any })}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="micro">Micro (1-5 people)</option>
              <option value="small">Small (6-20 people)</option>
              <option value="mid">Mid (21-100 people)</option>
              <option value="large">Large (100+ people)</option>
            </select>
          </div>

          {/* Monthly Leads */}
          <div>
            <label htmlFor="baselineMonthlyLeads" className="block text-sm font-medium text-slate-200 mb-2">
              Monthly Leads <span className="text-red-400">*</span>
            </label>
            <p className="text-xs text-slate-400 mb-2">
              Approximately how many new leads do you receive per month?
            </p>
            <input
              type="number"
              id="baselineMonthlyLeads"
              value={formData.baselineMonthlyLeads}
              onChange={(e) => setFormData({ ...formData, baselineMonthlyLeads: parseInt(e.target.value) || 0 })}
              required
              min="0"
              max="100000"
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Industry/Segment */}
          <div>
            <label htmlFor="segment" className="block text-sm font-medium text-slate-200 mb-2">
              Industry / Segment
            </label>
            <p className="text-xs text-slate-400 mb-2">
              What industry or market segment do you serve?
            </p>
            <input
              type="text"
              id="segment"
              value={formData.segment}
              onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
              maxLength={255}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Real Estate, Professional Services, SaaS"
            />
          </div>

          {/* Region */}
          <div>
            <label htmlFor="region" className="block text-sm font-medium text-slate-200 mb-2">
              Primary Region
            </label>
            <p className="text-xs text-slate-400 mb-2">
              Where is your business primarily located?
            </p>
            <input
              type="text"
              id="region"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              maxLength={255}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Pacific Northwest, Northeast, California"
            />
          </div>

          {/* Error Message */}
          {updateProfileMutation.isError && (
            <div className="bg-red-900/20 border border-red-800 text-red-300 px-4 py-3 rounded-lg text-sm">
              {updateProfileMutation.error instanceof Error
                ? updateProfileMutation.error.message
                : 'Failed to update profile. Please try again.'}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setLocation('/dashboard')}
              className="flex-1 px-6 py-3 border border-slate-700 rounded-lg font-medium text-slate-300 hover:bg-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>

        {/* Info Card */}
        <div className="mt-8 bg-blue-900/20 border border-blue-800 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-200 mb-2">
                Why we need this information
              </h3>
              <p className="text-xs text-blue-300/80 mb-3">
                This information helps us tailor your Strategic AI Roadmap to your specific business context.
                We'll use it to calculate ROI projections, recommend appropriate automation systems, and ensure
                our recommendations scale with your team size and lead volume.
              </p>
              <p className="text-xs text-blue-300/60">
                Your data is private and will only be used to generate your custom roadmap.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
