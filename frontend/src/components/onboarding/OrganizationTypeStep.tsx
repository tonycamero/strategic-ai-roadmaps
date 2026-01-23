import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useOnboarding } from '../../context/OnboardingContext';
import type { BusinessType } from '@roadmap/shared';

interface OrganizationTypeStepProps {
  onContinue: () => void;
  initialBusinessType?: BusinessType;
}

const OPTIONS: Array<{ id: BusinessType; title: string; description: string }> = [
  {
    id: 'default',
    title: 'Professional Services Firm',
    description: 'CPAs, agencies, insurance, real estate, and similar service businesses.',
  },
  {
    id: 'chamber',
    title: 'Chamber of Commerce / Business Association',
    description: 'Regional chambers, business alliances, and industry associations.',
  },
];

export const OrganizationTypeStep: React.FC<OrganizationTypeStepProps> = ({
  onContinue,
  initialBusinessType = 'default',
}) => {
  const [selected, setSelected] = useState<BusinessType>(initialBusinessType);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { refresh: refreshOnboarding } = useOnboarding();

  const saveMutation = useMutation({
    mutationFn: async (businessType: BusinessType) => {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/tenants/business-type', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ businessType }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save organization type');
      }

      return res.json();
    },
    onSuccess: async () => {
      // Invalidate all relevant caches and refresh onboarding state
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['owner-dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['tenant'] }),
        refreshOnboarding(),
      ]);
      onContinue();
    },
    onError: (err: Error) => {
      console.error('Failed to save organization type:', err);
      setError(err.message || 'Could not save organization type. Please try again.');
    },
  });

  const handleSave = () => {
    setError(null);
    saveMutation.mutate(selected);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-100 mb-3">
          What type of organization are you?
        </h1>
        <p className="text-slate-400 text-lg">
          We'll tune your intakes and metrics to match your world.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {OPTIONS.map((opt) => {
          const isActive = selected === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelected(opt.id)}
              className={[
                'flex flex-col items-start border rounded-2xl p-6 text-left transition-all relative overflow-hidden group card-glow-hover',
                isActive
                  ? 'border-blue-500 bg-blue-600/10 shadow-[0_0_30px_rgba(37,99,235,0.1)]'
                  : 'border-slate-800 bg-slate-900 hover:border-slate-700',
              ].join(' ')}
            >
              {isActive && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[40px] -mr-16 -mt-16" />
              )}
              <div
                className={[
                  'text-lg font-bold mb-2 relative z-10 transition-colors',
                  isActive ? 'text-blue-500' : 'text-slate-100 group-hover:text-blue-400',
                ].join(' ')}
              >
                {opt.title}
              </div>
              <div
                className={[
                  'text-sm relative z-10 leading-relaxed',
                  isActive ? 'text-slate-300 font-medium' : 'text-slate-500',
                ].join(' ')}
              >
                {opt.description}
              </div>
              {isActive && (
                <div className="mt-4 flex items-center text-xs font-bold text-blue-500 uppercase tracking-widest relative z-10">
                  <svg
                    className="w-4 h-4 mr-1.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  System Selected
                </div>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <div className="flex justify-end pt-6">
        <button
          type="button"
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="rounded-xl bg-blue-600 hover:bg-blue-500 px-10 py-4 text-sm font-bold text-white transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest"
        >
          {saveMutation.isPending ? 'Synchronizing...' : 'Save & Continue'}
        </button>
      </div>

      {/* Info Card */}
      <div className="mt-12 bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-900/20 flex items-center justify-center shrink-0">
            <span className="text-xl">💡</span>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-100 mb-2 uppercase tracking-widest">
              Context-Aware Governance
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Your organization type helps us customize role names, intake questions, and key metrics
              to match your industry. For example, <span className="text-blue-400 font-medium">Chambers</span> will see "Membership Development" instead
              of "Sales" and track renewal rates instead of deal close rates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
