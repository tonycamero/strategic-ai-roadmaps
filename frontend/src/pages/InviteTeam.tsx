import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useOnboarding } from '../context/OnboardingContext';
import { StakeholderModal } from '../components/onboarding/StakeholderModal';
import { IntakeVectorCard } from '../components/onboarding/IntakeVectorCard';
import { Plus, Send, AlertCircle, X, Lock } from 'lucide-react';

export default function InviteTeam() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { state: onboardingState, refresh: refreshOnboarding } = useOnboarding();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVector, setEditingVector] = useState<any>(null);
  const [isLocked, setIsLocked] = useState(false);

  const tenantId = onboardingState?.tenantId;

  // Fetch intake vectors
  const { data: vectorsData, isLoading, error } = useQuery({
    queryKey: ['intake-vectors', tenantId],
    queryFn: async () => {
      if (!tenantId) return { vectors: [] };
      const result = await api.listIntakeVectors(tenantId);
      return result;
    },
    enabled: !!tenantId,
  });

  const vectors = vectorsData?.vectors || [];

  const createVectorMutation = useMutation({
    mutationFn: (data: any) => tenantId ? api.createIntakeVector(tenantId, data) : Promise.reject('No tenant ID'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intake-vectors'] });
      setIsModalOpen(false);
      setEditingVector(null);
    },
    onError: (error: any) => {
      if (error?.status === 403) {
        setIsLocked(true);
      }
    }
  });

  const updateVectorMutation = useMutation({
    mutationFn: ({ vectorId, data }: { vectorId: string; data: any }) =>
      api.updateIntakeVector(vectorId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intake-vectors'] });
      setIsModalOpen(false);
      setEditingVector(null);
    },
    onError: (error: any) => {
      if (error?.status === 403) {
        setIsLocked(true);
      }
    }
  });

  const sendInviteMutation = useMutation({
    mutationFn: (vectorId: string) => api.sendIntakeVectorInvite(vectorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intake-vectors'] });
    },
    onError: (error: any) => {
      if (error?.status === 403) {
        setIsLocked(true);
      }
    }
  });

  const handleAddStakeholder = async (data: any) => {
    if (editingVector) {
      await updateVectorMutation.mutateAsync({ vectorId: editingVector.id, data });
    } else {
      await createVectorMutation.mutateAsync(data);
    }
  };

  const handleEditVector = (vector: any) => {
    setEditingVector(vector);
    setIsModalOpen(true);
  };

  const handleSendInvite = (vectorId: string) => {
    sendInviteMutation.mutate(vectorId);
  };

  // D3: Split gating semantics (define vs invite)
  const hasDefinedVectors = vectors.length >= 1;
  const allInvitedOrCompleted = vectors.length > 0 && vectors.every((v: any) => v.inviteStatus === 'SENT' || v.intakeStatus === 'COMPLETED');
  const canContinue = hasDefinedVectors && allInvitedOrCompleted;

  const remainingToContinue = Math.max(0, 1 - vectors.length);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white uppercase">Define Strategic Vectors</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Map your leadership core and share your operational hypothesis
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setEditingVector(null);
                setIsModalOpen(true);
              }}
              disabled={isLocked}
              className={`flex items-center gap-2 px-4 py-2 text-white text-xs font-bold rounded-lg transition-all shadow-lg uppercase tracking-widest ${isLocked
                ? 'bg-slate-700 cursor-not-allowed opacity-50'
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/20'
                }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Stakeholder
            </button>
            <button
              onClick={() => setLocation('/dashboard')}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Lock Banner */}
        {isLocked && (
          <div className="mb-6 p-4 bg-amber-900/20 border border-amber-700 rounded-xl flex items-center gap-3">
            <Lock className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-sm font-bold text-amber-200">Intake Window Closed</h3>
              <p className="text-xs text-amber-300/70 mt-0.5">
                Stakeholders cannot be edited or invited. Contact your administrator if changes are needed.
              </p>
            </div>
          </div>
        )}

        {/* Architecture Note */}
        <div className="mb-10 p-6 bg-slate-900/50 border border-slate-800 rounded-2xl flex gap-5 items-start">
          <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl">
            <Send className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200 mb-2 uppercase tracking-wide">The Vector Lens Protocol</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
              Don't just invite users—define their strategic vector. By capturing your <span className="text-blue-400 font-semibold italic">Perceived Constraints</span> for each role, we create the synthesis anchor for the AI roadmap. Your team will be asked to confirm or refute these hypotheses.
            </p>
          </div>
        </div>

        {/* Dynamic Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-slate-900/50 border border-slate-800 rounded-xl animate-pulse" />
            ))
          ) : vectors.length === 0 ? (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl">
              <div className="max-w-xs mx-auto space-y-4">
                <div className="p-4 bg-slate-900 rounded-full w-fit mx-auto">
                  <AlertCircle className="w-6 h-6 text-slate-700" />
                </div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Stakeholders Defined</h4>
                <p className="text-xs text-slate-600">Define at least 1 strategic vector to proceed. We recommend 3-5 for comprehensive synthesis (e.g. Ops, Sales, Delivery).</p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  disabled={isLocked}
                  className={`mt-4 px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg transition-all ${isLocked
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                >
                  Define First Vector
                </button>
              </div>
            </div>
          ) : (
            vectors.map((vector: any) => (
              <IntakeVectorCard
                key={vector.id}
                vector={vector}
                onEdit={handleEditVector}
                onSendInvite={handleSendInvite}
                isSendingInvite={sendInviteMutation.isPending}
                isLocked={isLocked}
              />
            ))
          )}
        </div>

        {/* Actions */}
        <div className="mt-12 flex items-center justify-between pt-8 border-t border-slate-800">
          <button
            onClick={() => setLocation('/dashboard')}
            className="px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-slate-300 transition-colors"
          >
            ← Return to Control
          </button>

          <div className="flex items-center gap-6">
            {!canContinue && vectors.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-900/10 border border-amber-500/20 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[10px] text-amber-200/70 font-bold uppercase tracking-wider">
                  {remainingToContinue > 0 ? `${remainingToContinue} more vector + ` : ''}all invited
                </span>
              </div>
            )}

            <button
              onClick={async () => {
                await refreshOnboarding();
                setLocation('/dashboard');
              }}
              disabled={!canContinue}
              className={`
                 px-10 py-3 rounded-full text-xs font-black uppercase tracking-[0.25em] transition-all
                 ${canContinue
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-900/30'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                }
              `}
            >
              Continue Onboarding →
            </button>
          </div>
        </div>
      </div>

      <StakeholderModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingVector(null);
        }}
        onSubmit={handleAddStakeholder}
        loading={createVectorMutation.isPending || updateVectorMutation.isPending}
        initialData={editingVector}
      />
    </div>
  );
}
