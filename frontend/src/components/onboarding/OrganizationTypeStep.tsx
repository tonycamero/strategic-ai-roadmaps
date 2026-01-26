import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useOnboarding } from '../../context/OnboardingContext';
import type { BusinessType } from '../../../../shared/src/config/businessTypeProfiles';

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
    id: 'manufacturing',
    title: 'Manufacturing / Industrial',
    description: 'Manufacturing facilities, industrial operations, and production companies.',
  },
  {
    id: 'enterprise',
    title: 'Enterprise',
    description: 'Large-scale organizations with complex operations and multiple departments.',
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">
          What type of organization are you?
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          We'll tune your intakes and metrics to match your world.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {OPTIONS.map((opt) => {
          const isActive = selected === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelected(opt.id)}
              className={[
                'flex flex-col items-start border rounded-lg p-5 text-left transition-all',
                isActive
                  ? 'border-blue-500 bg-blue-900/20 shadow-lg'
                  : 'border-slate-700 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-900',
              ].join(' ')}
            >
              <div
                className={[
                  'font-medium mb-2',
                  isActive ? 'text-blue-200' : 'text-slate-200',
                ].join(' ')}
              >
                {opt.title}
              </div>
              <div
                className={[
                  'text-sm',
                  isActive ? 'text-blue-300/90' : 'text-slate-400',
                ].join(' ')}
              >
                {opt.description}
              </div>
              {isActive && (
                <div className="mt-3 flex items-center text-xs font-medium text-blue-400">
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
                  Selected
                </div>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800 text-red-300 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="rounded-lg bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saveMutation.isPending ? 'Saving...' : 'Continue'}
        </button>
      </div>

      {/* Info Card */}
      <div className="mt-6 bg-blue-900/10 border border-blue-800/50 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-200 mb-2">
              Why we need this
            </h3>
            <p className="text-xs text-blue-300/80">
              Your organization type helps us customize role names, intake questions, and key metrics
              to match your industry. For example, Chambers will see "Membership Development" instead
              of "Sales" and track renewal rates instead of deal close rates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
