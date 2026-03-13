import React, { useEffect, useState } from 'react';
import { superadminApi } from '../../superadmin/api';
import { SasSignalCard } from '../../components/sas/SasSignalCard';

interface Signal {
  id: string;
  type: string;
  content: string;
  anchors: any;
  created_at: string;
  moderation_status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export default function ModerationPage({ params }: { params: { tenantId: string } }) {
  const { tenantId } = params;
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [projection, setProjection] = useState<any>(null);
  const [synthesizing, setSynthesizing] = useState(false);

  const fetchData = async () => {
    try {
      const [signalsData, projectionData] = await Promise.all([
        superadminApi.getSasSignals(tenantId),
        superadminApi.getTruthProbe(tenantId)
      ]);
      setSignals(signalsData);
      setProjection(projectionData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tenantId]);

  const handleSynthesize = async () => {
    if (!window.confirm('Synthesize approved signals into SOP tickets?')) return;
    setSynthesizing(true);
    try {
      await superadminApi.synthesizeTickets(tenantId);
      window.location.href = `/superadmin/firms/${tenantId}/tickets`;
    } catch (err) {
      console.error('Synthesis failed:', err);
      alert('Synthesis failed: ' + (err as Error).message);
    } finally {
      setSynthesizing(false);
    }
  };

  const handleModeration = async (proposalId: string, decision: 'APPROVED' | 'REJECTED') => {
    try {
      if (decision === 'APPROVED') {
        await superadminApi.approveSasProposal(tenantId, proposalId);
      } else {
        await superadminApi.rejectSasProposal(tenantId, proposalId);
      }
      // Refresh local state and projection
      fetchData();
    } catch (err) {
      console.error('Moderation failed:', err);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-slate-500 font-mono text-xs uppercase tracking-widest">Hydrating Signals...</div>
      </div>
    </div>
  );

  const approvedCount = projection?.tickets?.approvedProposalCount || 0;
  const canSynthesize = projection?.derived?.canSynthesizeTickets || approvedCount > 0;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <header className="mb-12 border-b border-slate-900 pb-8">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-tight">
                Stage-6 Projection
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-700"></div>
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-tight">
                Read-Only Audit
              </div>
            </div>
            
            <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight mb-3">
              SAS Moderation Signals
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
              Visual audit of signals processed by the Assisted Synthesis agent.
              Approved signals advance to SOP tickets.
            </p>
          </div>

          {canSynthesize && (
            <button
              onClick={handleSynthesize}
              disabled={synthesizing}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
            >
              {synthesizing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Synthesizing...
                </>
              ) : (
                <>
                  <span className="text-lg">⚡</span>
                  Synthesize {approvedCount} Tickets
                </>
              )}
            </button>
          )}
        </div>
        
        <div className="mt-4 flex items-center gap-4 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
          <span>Tenant: {tenantId}</span>
          <span className="w-1 h-1 rounded-full bg-slate-800" />
          <span>Approved: <span className="text-emerald-400">{approvedCount}</span></span>
          <span className="w-1 h-1 rounded-full bg-slate-800" />
          <span>Pending: <span className="text-amber-400">{projection?.tickets?.pendingProposalCount || 0}</span></span>
        </div>
      </header>

      <div className="space-y-6">
        {signals.length === 0 ? (
          <div className="p-24 border-2 border-dashed border-slate-900 rounded-3xl text-center">
            <div className="text-4xl mb-6 grayscale opacity-30">📡</div>
            <div className="text-slate-100 font-bold mb-2">No signals detected</div>
            <p className="text-slate-600 text-sm">
              The `sas_proposals` telemetry for this tenant is currently empty.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {signals.map(signal => (
              <div key={signal.id} className="relative group">
                <SasSignalCard 
                  id={signal.id}
                  type={signal.type}
                  content={signal.content}
                  anchors={signal.anchors}
                  created_at={signal.created_at}
                />
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  {signal.moderation_status === 'APPROVED' ? (
                    <div className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase border border-emerald-500/20">
                      Approved
                    </div>
                  ) : signal.moderation_status === 'REJECTED' ? (
                    <div className="px-2 py-1 rounded bg-rose-500/10 text-rose-400 text-[10px] font-bold uppercase border border-rose-500/20">
                      Rejected
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleModeration(signal.id, 'APPROVED')}
                        className="p-1 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase border border-emerald-500/20 transition-all"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleModeration(signal.id, 'REJECTED')}
                        className="p-1 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-bold uppercase border border-rose-500/20 transition-all"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="mt-20 pt-8 border-t border-slate-900 text-center">
        <div className="text-[10px] text-slate-700 font-bold uppercase tracking-[0.3em]">
          End of Signal Stream — Governance Controlled
        </div>
      </footer>
    </div>
  );
}
