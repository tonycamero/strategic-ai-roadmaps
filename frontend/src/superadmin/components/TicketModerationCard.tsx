import { useState, useEffect } from 'react';
import { superadminApi } from '../api';

interface TicketModerationCardProps {
  tenantId: string;
  diagnosticId: string | null;
  onComplete?: () => void;
}

export function TicketModerationCard({ tenantId, diagnosticId, onComplete }: TicketModerationCardProps) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [status, setStatus] = useState<any | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [moderating, setModerating] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (diagnosticId) {
      fetchTickets();
    }
  }, [diagnosticId]);

  async function fetchTickets() {
    if (!diagnosticId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await superadminApi.getDiagnosticTickets(tenantId, diagnosticId);
      setTickets(data.tickets || []);
      setStatus(data.status || null);
    } catch (err: any) {
      setError(err.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove() {
    if (selectedIds.length === 0 || !diagnosticId) return;
    setModerating(true);
    setError(null);
    try {
      const result = await superadminApi.approveTickets({
        tenantId,
        diagnosticId,
        ticketIds: selectedIds,
        adminNotes: adminNotes || undefined,
      });
      setStatus(result.status);
      setSelectedIds([]);
      setAdminNotes('');
      await fetchTickets();
    } catch (err: any) {
      setError(err.message || 'Failed to approve tickets');
    } finally {
      setModerating(false);
    }
  }

  async function handleReject() {
    if (selectedIds.length === 0 || !diagnosticId) return;
    setModerating(true);
    setError(null);
    try {
      const result = await superadminApi.rejectTickets({
        tenantId,
        diagnosticId,
        ticketIds: selectedIds,
        adminNotes: adminNotes || undefined,
      });
      setStatus(result.status);
      setSelectedIds([]);
      setAdminNotes('');
      await fetchTickets();
    } catch (err: any) {
      setError(err.message || 'Failed to reject tickets');
    } finally {
      setModerating(false);
    }
  }

  async function handleGenerateFinalRoadmap() {
    setGeneratingRoadmap(true);
    setError(null);
    try {
      await superadminApi.generateFinalRoadmap(tenantId);
      alert('Final roadmap generated successfully! Check the Documents section.');
      if (onComplete) onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to generate roadmap');
    } finally {
      setGeneratingRoadmap(false);
    }
  }

  function toggleTicket(ticketId: string) {
    setSelectedIds(prev =>
      prev.includes(ticketId)
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  }

  if (!diagnosticId) {
    return (
      <div className="border border-slate-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-200 mb-2">Ticket Moderation</h3>
        <p className="text-xs text-slate-400">
          No diagnostic found. Generate SOP-01 first.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="border border-slate-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-200 mb-2">Ticket Moderation</h3>
        <p className="text-xs text-slate-400">Loading tickets...</p>
      </div>
    );
  }

  return (
    <div className="border border-slate-800 rounded-xl p-6 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-200">Ticket Moderation</h3>
        <p className="text-xs text-slate-400 mt-1">
          Review and approve/reject implementation tickets before finalizing roadmap
        </p>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800 text-red-300 p-3 rounded-lg text-xs">
          {error}
        </div>
      )}

      {/* Status Summary */}
      {status && (
        <div className="grid grid-cols-4 gap-3 p-3 bg-slate-900/40 rounded-lg">
          <div>
            <div className="text-xs text-slate-500">Total</div>
            <div className="text-lg font-semibold text-slate-200">{status.total}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Approved</div>
            <div className="text-lg font-semibold text-green-400">{status.approved}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Rejected</div>
            <div className="text-lg font-semibold text-red-400">{status.rejected}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Pending</div>
            <div className="text-lg font-semibold text-yellow-400">{status.pending}</div>
          </div>
        </div>
      )}

      {status?.readyForRoadmap && (
        <div className="bg-green-900/20 border border-green-800 text-green-300 p-3 rounded-lg text-xs font-medium">
          ✓ Ready for Roadmap Generation
        </div>
      )}

      {/* Sprint Columns (Kanban Layout) */}
      {tickets.length > 0 && (() => {
        // Group tickets by sprint
        const sprint30 = tickets.filter(t => t.sprint === 30);
        const sprint60 = tickets.filter(t => t.sprint === 60);
        const sprint90 = tickets.filter(t => t.sprint === 90);

        // Sort function: priority desc → category asc → tier
        const priorityOrder = { critical: 0, high: 1, medium: 2 };
        const tierOrder = { core: 0, recommended: 1, advanced: 2 };
        const sortTickets = (a: any, b: any) => {
          if (a.priority !== b.priority) {
            return (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 999) - 
                   (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 999);
          }
          if (a.category !== b.category) {
            return a.category.localeCompare(b.category);
          }
          return (tierOrder[a.tier as keyof typeof tierOrder] ?? 999) - 
                 (tierOrder[b.tier as keyof typeof tierOrder] ?? 999);
        };

        sprint30.sort(sortTickets);
        sprint60.sort(sortTickets);
        sprint90.sort(sortTickets);

        const renderColumn = (sprintTickets: any[], sprintLabel: string) => {
          const approved = sprintTickets.filter(t => t.approved).length;
          const pending = sprintTickets.filter(t => !t.moderatedAt).length;
          
          return (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-300 mb-2">
                {sprintLabel}
                <span className="text-slate-500 font-normal ml-2">
                  {sprintTickets.length} tickets · {approved} approved · {pending} pending
                </span>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {sprintTickets.map(ticket => (
                  <div
                    key={ticket.id}
                    className={`border rounded-lg p-3 transition-colors ${
                      selectedIds.includes(ticket.id)
                        ? 'border-blue-600 bg-blue-900/20'
                        : 'border-slate-800 bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(ticket.id)}
                        onChange={() => toggleTicket(ticket.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-slate-200 mb-1 break-words">
                          {ticket.title}
                        </div>
                        <div className="flex flex-wrap items-center gap-1 mb-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                            ticket.priority === 'critical' ? 'bg-red-900/40 text-red-300 border-red-800' :
                            ticket.priority === 'high' ? 'bg-orange-900/40 text-orange-300 border-orange-800' :
                            'bg-yellow-900/40 text-yellow-300 border-yellow-800'
                          }`}>
                            {ticket.priority}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                            ticket.tier === 'core' ? 'bg-blue-900/40 text-blue-300 border-blue-800' :
                            ticket.tier === 'recommended' ? 'bg-purple-900/40 text-purple-300 border-purple-800' :
                            'bg-slate-900/40 text-slate-400 border-slate-700'
                          }`}>
                            {ticket.tier}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {ticket.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {ticket.approved && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-green-900/40 text-green-300 border border-green-800 rounded">
                              Approved
                            </span>
                          )}
                          {!ticket.approved && ticket.moderatedAt && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-red-900/40 text-red-300 border border-red-800 rounded">
                              Rejected
                            </span>
                          )}
                          {!ticket.moderatedAt && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-yellow-900/40 text-yellow-300 border border-yellow-800 rounded">
                              Pending
                            </span>
                          )}
                        </div>
                        {ticket.adminNotes && (
                          <div className="text-[10px] text-slate-500 mt-1 italic break-words">
                            Note: {ticket.adminNotes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        };

        return (
          <div className="flex gap-3">
            {renderColumn(sprint30, 'Sprint 30 (Now)')}
            {renderColumn(sprint60, 'Sprint 60 (Next)')}
            {renderColumn(sprint90, 'Sprint 90 (Later)')}
          </div>
        );
      })()}

      {tickets.length === 0 && (
        <div className="text-xs text-slate-400 text-center py-4">
          No tickets found for this diagnostic.
        </div>
      )}

      {/* Admin Notes */}
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Admin Notes (optional)</label>
        <textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Add notes about this moderation decision..."
          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={2}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleApprove}
          disabled={selectedIds.length === 0 || moderating}
          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium text-xs rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {moderating ? 'Processing...' : `Approve Selected (${selectedIds.length})`}
        </button>
        <button
          onClick={handleReject}
          disabled={selectedIds.length === 0 || moderating}
          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium text-xs rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {moderating ? 'Processing...' : `Reject Selected (${selectedIds.length})`}
        </button>
      </div>

      {/* Generate Final Roadmap */}
      {status?.readyForRoadmap && (
        <button
          onClick={handleGenerateFinalRoadmap}
          disabled={generatingRoadmap}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50"
        >
          {generatingRoadmap ? 'Generating...' : 'Generate Final Roadmap (Approved Tickets Only)'}
        </button>
      )}
    </div>
  );
}
