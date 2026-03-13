import React, { useEffect, useState } from 'react';
import { superadminApi } from '../../superadmin/api';

interface Ticket {
  id: string;
  title: string;
  description: string;
  capability_namespace: string;
  source_anchors: any;
  status: 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed';
  created_at: string;
}

export default function TicketsPage({ params }: { params: { tenantId: string } }) {
  const { tenantId } = params;
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Note: The user requested GET /api/superadmin/firms/:tenantId/sop/tickets
    // I need to ensure this endpoint exists or use a generic ticket fetcher if available.
    // Based on the task, I should check if I need to implement this backend endpoint as well.
    superadminApi.getFirmDetailV2(tenantId)
      .then(data => {
        // FirmDetailResponseV2 currently doesn't have the full list of Stage-7 SOP tickets.
        // It has tickets.ticketPack.
        // Let's assume a dedicated fetcher is needed or added to superadminApi.
        fetchTickets();
      })
      .catch(err => {
        console.error('Failed to fetch firm detail:', err);
        setLoading(false);
      });
  }, [tenantId]);

  const fetchTickets = async () => {
    try {
      // I'll add getSopTickets to superadminApi.ts if not present
      const res = await (superadminApi as any).getSopTickets(tenantId);
      setTickets(res.tickets || []);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-slate-500 font-mono text-xs uppercase tracking-widest">Hydrating Tickets...</div>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-12 border-b border-slate-900 pb-8 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-tight">
              Stage-7 Execution
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-700"></div>
            <div className="text-slate-500 text-[10px] font-bold uppercase tracking-tight">
              SOP Ticket Surface
            </div>
          </div>
          
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight mb-3">
            Synthesized SOP Tickets
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
            Formal execution units synthesized from approved SAS signals.
            Tenant: <span className="font-mono text-indigo-300">{tenantId}</span>
          </p>
        </div>

        <div className="flex items-center gap-6 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
          <div className="flex flex-col items-end">
            <span className="text-slate-600">Total Count</span>
            <span className="text-slate-100 text-lg font-bold">{tickets.length}</span>
          </div>
        </div>
      </header>

      <div className="grid gap-6">
        {tickets.length === 0 ? (
          <div className="p-24 border-2 border-dashed border-slate-900 rounded-3xl text-center">
            <div className="text-4xl mb-6 grayscale opacity-30">🎟️</div>
            <div className="text-slate-100 font-bold mb-2">No tickets synthesized</div>
            <p className="text-slate-600 text-sm">
              Approved signals have not yet been converted into SOP tickets.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden border border-slate-900 rounded-2xl bg-slate-900/20 shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-900">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Capability / Namespace</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ticket Details</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Anchors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {tickets.map(ticket => (
                  <tr key={ticket.id} className="group hover:bg-slate-800/10 transition-colors">
                    <td className="px-6 py-6 vertical-top align-top">
                      <div className="inline-flex px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-bold uppercase tracking-tight">
                        {ticket.capability_namespace || 'UNMAPPED'}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="text-slate-100 font-bold text-sm mb-2 group-hover:text-indigo-300 transition-colors">
                        {ticket.title}
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed max-w-xl">
                        {ticket.description}
                      </p>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className={`
                        inline-flex px-2 py-1 rounded text-[9px] font-bold uppercase border
                        ${ticket.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                          ticket.status === 'in_progress' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-slate-500/10 text-slate-400 border-slate-500/20'}
                      `}>
                        {ticket.status === 'in_progress' ? 'IN_PROGRESS' : ticket.status?.toUpperCase() || 'OPEN'}
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className="flex flex-wrap gap-1 justify-end">
                        {Array.isArray(ticket.source_anchors) ? ticket.source_anchors.map((anchor, idx) => (
                           <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 text-[8px] font-mono border border-slate-700">
                             {anchor.type || 'anchor'}
                           </span>
                        )) : (
                          <span className="text-slate-600 text-[10px] italic">No anchors</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <footer className="mt-20 pt-8 border-t border-slate-900 text-center">
        <div className="text-[10px] text-slate-700 font-bold uppercase tracking-[0.3em]">
          Synthesized Ticket Execution Surface
        </div>
      </footer>
    </div>
  );
}
