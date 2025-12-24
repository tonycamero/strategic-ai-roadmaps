import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ROIModal } from './ROIModal';
import { ROIResultPanel } from './ROIResultPanel';

interface ROIData {
  hasMetrics: boolean;
  outcome?: {
    id: string;
    netRoiPercent: number | null;
    timeSavingsHours: number | null;
    timeSavingsValue: number | null;
    revenueImpact: number | null;
    costAvoidance: number | null;
  };
}

async function fetchROIData(): Promise<ROIData> {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/dashboard/owner/transformation', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch ROI data');
  }
  
  return response.json();
}

export function ROICard() {
  const [showModal, setShowModal] = useState(false);
  
  const { data, isLoading, refetch } = useQuery<ROIData>({
    queryKey: ['roi-data'],
    queryFn: fetchROIData,
    refetchInterval: 30000,
    retry: false, // Don't retry if no roadmap exists yet
  });

  const handleModalSuccess = () => {
    setShowModal(false);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-6">
        <div className="text-slate-400 text-sm">Loading ROI data...</div>
      </div>
    );
  }

  // State 1: No ROI data yet - show CTA
  if (!data?.hasMetrics || !data?.outcome) {
    return (
      <>
        <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-xl border border-purple-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-purple-100">
                ROI Insights
              </h2>
              <p className="text-sm text-purple-200/70 mt-1">
                Unlock personalized ROI projections (optional)
              </p>
            </div>
            <span className="text-3xl">💰</span>
          </div>
          
          <div className="bg-slate-900/60 rounded-lg p-4 mb-4">
            <p className="text-sm text-slate-300 leading-relaxed">
              Your personalized ROI insights are ready when you are. 
              Provide a few business numbers to see your transformation's financial impact.
            </p>
            <p className="text-xs text-slate-400 mt-2">
              These numbers are private and only used to calculate your ROI model.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            Enter Numbers
          </button>
        </div>

        {showModal && (
          <ROIModal 
            onClose={() => setShowModal(false)} 
            onSuccess={handleModalSuccess}
          />
        )}
      </>
    );
  }

  // State 2: ROI data exists - show results
  return (
    <>
      <ROIResultPanel 
        outcome={data.outcome} 
        onRecalculate={() => setShowModal(true)}
      />

      {showModal && (
        <ROIModal 
          onClose={() => setShowModal(false)} 
          onSuccess={handleModalSuccess}
        />
      )}
    </>
  );
}
