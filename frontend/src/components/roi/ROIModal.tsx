import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';

interface ROIModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface ROIInputs {
  monthlyRevenue: string;
  avgDealSize: string;
  staffCostPerHour: string;
  weeklyOpsHours: string;
  annualClientVolume: string;
}

async function submitROIData(inputs: ROIInputs) {
  const token = localStorage.getItem('token');
  
  // Parse inputs to numbers
  const monthlyRevenue = parseFloat(inputs.monthlyRevenue) || 0;
  const avgDealSize = parseFloat(inputs.avgDealSize) || 0;
  const staffCostPerHour = parseFloat(inputs.staffCostPerHour) || 0;
  const weeklyOpsHours = parseFloat(inputs.weeklyOpsHours) || 0;
  const annualClientVolume = parseFloat(inputs.annualClientVolume) || 0;

  // Calculate derived metrics for the backend
  // These are baseline assumptions that get improved via transformation
  const leadResponseMinutes = 60; // baseline assumption
  const leadToApptRate = 30; // baseline %
  const closeRate = 15; // baseline %
  const crmAdoptionRate = 40; // baseline %
  const nps = 20; // baseline NPS

  const metrics = {
    leadResponseMinutes,
    leadToApptRate,
    closeRate,
    crmAdoptionRate,
    weeklyOpsHours,
    nps,
  };

  const assumptions = {
    monthlyRevenue,
    avgDealSize,
    staffCostPerHour,
    annualClientVolume,
  };

  // Step 1: Create baseline snapshot
  const baselineResponse = await fetch('/api/dashboard/owner/roi/baseline', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      metrics,
      source: 'manual',
    }),
  });

  if (!baselineResponse.ok) {
    throw new Error('Failed to create baseline');
  }

  // Step 2: Create improved snapshot (30d assumption: 20% improvement across key metrics)
  const improvedMetrics = {
    leadResponseMinutes: leadResponseMinutes * 0.75, // 25% faster
    leadToApptRate: leadToApptRate * 1.15, // 15% improvement
    closeRate: closeRate * 1.10, // 10% improvement
    crmAdoptionRate: crmAdoptionRate * 1.30, // 30% improvement
    weeklyOpsHours: weeklyOpsHours * 0.85, // 15% reduction
    nps: nps + 15, // +15 points
  };

  const snapshotResponse = await fetch('/api/dashboard/owner/roi/snapshot', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      label: '30d',
      metrics: improvedMetrics,
      source: 'manual',
    }),
  });

  if (!snapshotResponse.ok) {
    throw new Error('Failed to create snapshot');
  }

  // Step 3: Compute outcome with assumptions
  const outcomeResponse = await fetch('/api/dashboard/owner/roi/compute-outcome', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ assumptions }),
  });

  if (!outcomeResponse.ok) {
    throw new Error('Failed to compute outcome');
  }

  return outcomeResponse.json();
}

export function ROIModal({ onClose, onSuccess }: ROIModalProps) {
  const [inputs, setInputs] = useState<ROIInputs>({
    monthlyRevenue: '',
    avgDealSize: '',
    staffCostPerHour: '',
    weeklyOpsHours: '',
    annualClientVolume: '',
  });

  const [errors, setErrors] = useState<Partial<ROIInputs>>({});

  const mutation = useMutation({
    mutationFn: submitROIData,
    onSuccess: () => {
      onSuccess();
    },
    onError: (error: Error) => {
      console.error('ROI submission error:', error);
      alert('Failed to calculate ROI. Please try again.');
    },
  });

  const validateInputs = (): boolean => {
    const newErrors: Partial<ROIInputs> = {};
    
    if (!inputs.monthlyRevenue || parseFloat(inputs.monthlyRevenue) <= 0) {
      newErrors.monthlyRevenue = 'Required (positive number)';
    }
    if (!inputs.avgDealSize || parseFloat(inputs.avgDealSize) <= 0) {
      newErrors.avgDealSize = 'Required (positive number)';
    }
    if (!inputs.staffCostPerHour || parseFloat(inputs.staffCostPerHour) <= 0) {
      newErrors.staffCostPerHour = 'Required (positive number)';
    }
    if (!inputs.weeklyOpsHours || parseFloat(inputs.weeklyOpsHours) <= 0) {
      newErrors.weeklyOpsHours = 'Required (positive number)';
    }
    if (!inputs.annualClientVolume || parseFloat(inputs.annualClientVolume) <= 0) {
      newErrors.annualClientVolume = 'Required (positive number)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInputs()) {
      return;
    }

    mutation.mutate(inputs);
  };

  const handleChange = (field: keyof ROIInputs, value: string) => {
    setInputs(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-950 border border-slate-800 rounded-xl max-w-lg w-full p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">ROI Calculator</h2>
            <p className="text-sm text-slate-400 mt-1">Provide your business numbers</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-2xl leading-none transition-colors"
            disabled={mutation.isPending}
          >
            ×
          </button>
        </div>

        <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4 mb-6">
          <p className="text-xs text-blue-200 leading-relaxed">
            These numbers are private and only used to calculate your personalized ROI model. 
            They help us show the financial impact of your transformation.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Monthly Revenue */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Monthly Revenue ($)
            </label>
            <input
              type="number"
              value={inputs.monthlyRevenue}
              onChange={(e) => handleChange('monthlyRevenue', e.target.value)}
              className={`w-full px-4 py-3 bg-slate-900 border ${errors.monthlyRevenue ? 'border-red-500' : 'border-slate-800'} rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
              placeholder="50000"
              disabled={mutation.isPending}
              step="100"
              min="0"
            />
            {errors.monthlyRevenue && (
              <p className="text-xs text-red-400 mt-1">{errors.monthlyRevenue}</p>
            )}
          </div>

          {/* Average Deal Size */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Average Deal Size ($)
            </label>
            <input
              type="number"
              value={inputs.avgDealSize}
              onChange={(e) => handleChange('avgDealSize', e.target.value)}
              className={`w-full px-4 py-3 bg-slate-900 border ${errors.avgDealSize ? 'border-red-500' : 'border-slate-800'} rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
              placeholder="5000"
              disabled={mutation.isPending}
              step="100"
              min="0"
            />
            {errors.avgDealSize && (
              <p className="text-xs text-red-400 mt-1">{errors.avgDealSize}</p>
            )}
          </div>

          {/* Staff Cost Per Hour */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Staff Cost Per Hour ($)
            </label>
            <input
              type="number"
              value={inputs.staffCostPerHour}
              onChange={(e) => handleChange('staffCostPerHour', e.target.value)}
              className={`w-full px-4 py-3 bg-slate-900 border ${errors.staffCostPerHour ? 'border-red-500' : 'border-slate-800'} rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
              placeholder="50"
              disabled={mutation.isPending}
              step="1"
              min="0"
            />
            {errors.staffCostPerHour && (
              <p className="text-xs text-red-400 mt-1">{errors.staffCostPerHour}</p>
            )}
          </div>

          {/* Weekly Ops Hours */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Weekly Operations Hours
            </label>
            <input
              type="number"
              value={inputs.weeklyOpsHours}
              onChange={(e) => handleChange('weeklyOpsHours', e.target.value)}
              className={`w-full px-4 py-3 bg-slate-900 border ${errors.weeklyOpsHours ? 'border-red-500' : 'border-slate-800'} rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
              placeholder="40"
              disabled={mutation.isPending}
              step="1"
              min="0"
            />
            {errors.weeklyOpsHours && (
              <p className="text-xs text-red-400 mt-1">{errors.weeklyOpsHours}</p>
            )}
          </div>

          {/* Annual Client Volume */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Annual Client Volume
            </label>
            <input
              type="number"
              value={inputs.annualClientVolume}
              onChange={(e) => handleChange('annualClientVolume', e.target.value)}
              className={`w-full px-4 py-3 bg-slate-900 border ${errors.annualClientVolume ? 'border-red-500' : 'border-slate-800'} rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
              placeholder="100"
              disabled={mutation.isPending}
              step="1"
              min="0"
            />
            {errors.annualClientVolume && (
              <p className="text-xs text-red-400 mt-1">{errors.annualClientVolume}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-700 rounded-lg font-medium text-slate-300 hover:bg-slate-900 transition-colors"
              disabled={mutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? 'Calculating...' : 'Calculate ROI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
