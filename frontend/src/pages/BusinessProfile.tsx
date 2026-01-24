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
        <div className="text-slate-500 animate-pulse font-bold tracking-widest uppercase text-xs">Loading Context...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-400">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-100">Business Profile</h1>
            <p className="text-xs text-slate-500 mt-0.5 uppercase tracking-wider">
              System Context Configuration
            </p>
          </div>
          <button
            onClick={() => setLocation('/dashboard')}
            className="text-slate-500 hover:text-blue-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Company Name */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 card-glow-hover">
            <label htmlFor="name" className="block text-sm font-bold text-slate-100 mb-2 uppercase tracking-widest">
              Company Name <span className="text-blue-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="e.g., Hayes Real Estate Group"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Team Size */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 card-glow-hover">
              <label htmlFor="teamHeadcount" className="block text-sm font-bold text-slate-100 mb-1 uppercase tracking-widest">
                Team Size <span className="text-blue-500">*</span>
              </label>
              <p className="text-xs text-slate-500 mb-4 uppercase">
                Total Personnel
              </p>
              <input
                type="number"
                id="teamHeadcount"
                value={formData.teamHeadcount}
                onChange={(e) => setFormData({ ...formData, teamHeadcount: parseInt(e.target.value) || 0 })}
                required
                min="1"
                max="10000"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Firm Size Tier */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 card-glow-hover">
              <label htmlFor="firmSizeTier" className="block text-sm font-bold text-slate-100 mb-1 uppercase tracking-widest">
                Firm Category
              </label>
              <p className="text-xs text-slate-500 mb-4 uppercase">
                Operational Scale
              </p>
              <select
                id="firmSizeTier"
                value={formData.firmSizeTier}
                onChange={(e) => setFormData({ ...formData, firmSizeTier: e.target.value as any })}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
              >
                <option value="micro">Micro (1-5 people)</option>
                <option value="small">Small (6-20 people)</option>
                <option value="mid">Mid (21-100 people)</option>
                <option value="large">Large (100+ people)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Monthly Leads */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 card-glow-hover">
              <label htmlFor="baselineMonthlyLeads" className="block text-sm font-bold text-slate-100 mb-1 uppercase tracking-widest">
                Monthly Leads <span className="text-blue-500">*</span>
              </label>
              <p className="text-xs text-slate-500 mb-4 uppercase">
                Average Intake Volume
              </p>
              <input
                type="number"
                id="baselineMonthlyLeads"
                value={formData.baselineMonthlyLeads}
                onChange={(e) => setFormData({ ...formData, baselineMonthlyLeads: parseInt(e.target.value) || 0 })}
                required
                min="0"
                max="100000"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Industry/Segment */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 card-glow-hover">
              <label htmlFor="segment" className="block text-sm font-bold text-slate-100 mb-1 uppercase tracking-widest">
                Sector
              </label>
              <p className="text-xs text-slate-500 mb-4 uppercase">
                Industry Vertical
              </p>
              <input
                type="text"
                id="segment"
                value={formData.segment}
                onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                maxLength={255}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="e.g., SaaS, Professional Services"
              />
            </div>
          </div>

          {/* Region */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 card-glow-hover">
            <label htmlFor="region" className="block text-sm font-bold text-slate-100 mb-1 uppercase tracking-widest">
              Primary Region
            </label>
            <p className="text-xs text-slate-500 mb-4 uppercase">
              Geographic Focus
            </p>
            <input
              type="text"
              id="region"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              maxLength={255}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="e.g., Pacific Northwest, EMEA"
            />
          </div>

          {/* Error Message */}
          {updateProfileMutation.isError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-medium shadow-lg shadow-red-500/10">
              {updateProfileMutation.error instanceof Error
                ? updateProfileMutation.error.message
                : 'Failed to synchronize profile. Please try again.'}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => setLocation('/dashboard')}
              className="flex-1 px-6 py-4 border border-slate-800 rounded-xl font-bold text-slate-500 hover:text-slate-100 hover:bg-slate-900 transition-all uppercase tracking-widest text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-sm"
            >
              {updateProfileMutation.isPending ? 'Synchronizing...' : 'Finalize Profile'}
            </button>
          </div>
        </form>

        {/* Info Card */}
        <div className="mt-12 bg-slate-900 border border-slate-800 rounded-2xl p-8 relative overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-900/20 flex items-center justify-center shrink-0">
              <span className="text-xl">💡</span>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-100 mb-3 uppercase tracking-widest">
                Data Sovereignty & ROI Logic
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                This information helps us tailor your Strategic AI Roadmap to your specific business context.
                We'll use it to calculate ROI projections, recommend appropriate automation systems, and ensure
                our recommendations scale with your team size and lead volume.
              </p>
              <div className="flex items-center gap-2 text-xs text-blue-500 font-bold uppercase tracking-widest">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                Data is encrypted and restricted to governance generation
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
