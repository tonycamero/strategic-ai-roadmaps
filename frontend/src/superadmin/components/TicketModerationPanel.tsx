import React, { useEffect, useState } from 'react';
import { useSuperAdminAuthority } from '../../hooks/useSuperAdminAuthority';
import { superadminApi } from '../api';

interface Ticket {
    id: string;
    ticketId: string;
    title: string;
    category: string;
    priority: string;
    sprint: number;
    tier: string | null;
    approved: boolean;
    adminNotes: string | null;
    moderatedAt: string | null;
    timeEstimateHours: number;
    description: string;
}

interface ModerationStatus {
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    readyForRoadmap: boolean;
}

interface TicketModerationPanelProps {
    tenantId: string;
    diagnosticId: string;
    onStatusChange?: (status: ModerationStatus) => void;
}

export function TicketModerationPanel({ tenantId, diagnosticId, onStatusChange }: TicketModerationPanelProps) {
    const { isExecutive } = useSuperAdminAuthority();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [status, setStatus] = useState<ModerationStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadTickets();
    }, [tenantId, diagnosticId]);

    const loadTickets = async () => {
        setLoading(true);
        try {
            const res = await superadminApi.getDiagnosticTickets(tenantId, diagnosticId);
            setTickets(res.tickets);
            setStatus(res.status);
            if (onStatusChange) onStatusChange(res.status);
        } catch (err) {
            console.error('Failed to load tickets', err);
        } finally {
            setLoading(false);
        }
    };

    const handleModerate = async (ticketId: string, approved: boolean) => {
        if (!isExecutive) return;
        setProcessingIds(prev => new Set(prev).add(ticketId));

        try {
            // Optimistic Update
            setTickets(prev => prev.map(t =>
                t.id === ticketId ? { ...t, approved, moderatedAt: new Date().toISOString() } : t
            ));

           if (approved) {
  await superadminApi.approveTickets({
    tenantId,
    diagnosticId,
    ticketIds: [ticketId],
  });
} else {
  await superadminApi.rejectTickets({
    tenantId,
    diagnosticId,
    ticketIds: [ticketId],
  });
}


            // Background refresh for consistency
            const res = await superadminApi.getDiagnosticTickets(tenantId, diagnosticId);
            setStatus(res.status);
            if (onStatusChange) onStatusChange(res.status);

        } catch (err) {
            console.error('Moderation failed', err);
            loadTickets(); // Revert
        } finally {
            setProcessingIds(prev => {
                const next = new Set(prev);
                next.delete(ticketId);
                return next;
            });
        }
    };

    if (loading) return <div className="p-12 text-center text-xs font-mono text-slate-500 uppercase tracking-widest animate-pulse">Loading Roadmapping Context...</div>;
    if (tickets.length === 0) return (
        <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-12 text-center">
            <div className="text-slate-500 text-xs font-mono uppercase tracking-widest mb-2">No Tickets Generated</div>
            <div className="text-[10px] text-slate-600">Run diagnostic synthesis to generate candidates.</div>
        </div>
    );

    // Group by Sprint
    const sprintgroups = {
        30: tickets.filter(t => t.sprint === 30),
        60: tickets.filter(t => t.sprint === 60),
        90: tickets.filter(t => t.sprint === 90)
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h3 className="text-xs uppercase tracking-widest text-slate-500 font-inter font-extrabold">
                        Strategic Roadmap Candidates
                    </h3>
                    <div className="px-2 py-0.5 bg-slate-800 rounded text-[9px] font-mono text-slate-400">
                        {status?.total} Items
                    </div>
                </div>

                {/* Stats */}
                <div className="flex gap-4 text-[10px] font-mono">
                    <span className="text-amber-500">{status?.pending} Pending</span>
                    <span className="text-emerald-500">{status?.approved} Approved</span>
                    <span className="text-slate-600">{status?.rejected} Rejected</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SprintColumn
                    title="Now (Sprint 30)"
                    tickets={sprintgroups[30]}
                    isExecutive={isExecutive}
                    processingIds={processingIds}
                    onModerate={handleModerate}
                />
                <SprintColumn
                    title="Next (Sprint 60)"
                    tickets={sprintgroups[60]}
                    isExecutive={isExecutive}
                    processingIds={processingIds}
                    onModerate={handleModerate}
                />
                <SprintColumn
                    title="Later (Sprint 90)"
                    tickets={sprintgroups[90]}
                    isExecutive={isExecutive}
                    processingIds={processingIds}
                    onModerate={handleModerate}
                />
            </div>
        </div>
    );
}

function SprintColumn({
    title,
    tickets,
    isExecutive,
    processingIds,
    onModerate
}: {
    title: string,
    tickets: Ticket[],
    isExecutive: boolean,
    processingIds: Set<string>,
    onModerate: (id: string, approved: boolean) => void
}) {
    return (
        <div className="bg-slate-950/30 border border-slate-900/50 rounded-xl p-4 flex flex-col h-full min-h-[400px]">
            <div className="text-[10px] uppercase font-bold text-slate-500 mb-4 flex justify-between items-center">
                <span>{title}</span>
                <span className="bg-slate-900 px-1.5 py-0.5 rounded text-slate-600">{tickets.length}</span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1 custom-scrollbar">
                {tickets.map(ticket => (
                    <TicketCard
                        key={ticket.id}
                        ticket={ticket}
                        isExecutive={isExecutive}
                        isProcessing={processingIds.has(ticket.id)}
                        onModerate={onModerate}
                    />
                ))}
                {tickets.length === 0 && (
                    <div className="text-[9px] text-slate-700 italic text-center py-8 opacity-50">No tickets scheduled</div>
                )}
            </div>
        </div>
    );
}

function TicketCard({
    ticket,
    isExecutive,
    isProcessing,
    onModerate
}: {
    ticket: Ticket,
    isExecutive: boolean,
    isProcessing: boolean,
    onModerate: (id: string, approved: boolean) => void
}) {
    const isApproved = ticket.moderatedAt && ticket.approved;
    const isRejected = ticket.moderatedAt && !ticket.approved;
    const isPending = !ticket.moderatedAt;

    return (
        <div className={`p-3 rounded-lg border transition-all relative group ${isApproved ? 'bg-emerald-900/5 border-emerald-500/20' :
                isRejected ? 'bg-slate-900/20 border-slate-800 opacity-60' :
                    'bg-slate-800/40 border-slate-700 hover:border-slate-600'
            }`}>
            {isProcessing && (
                <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[1px] z-10 rounded-lg flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            <div className="flex justify-between items-start mb-2">
                <div className="flex flex-wrap gap-1.5">
                    <span className="text-[9px] font-mono text-slate-500 bg-slate-950 px-1 rounded">{ticket.ticketId}</span>
                    {ticket.tier === 'critical' && <span className="text-[8px] font-bold text-red-400 bg-red-900/10 px-1 rounded uppercase">Critical</span>}
                </div>
                {isExecutive && (
                    <div className={`flex gap-1 ${isPending ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'} transition-opacity`}>
                        <button
                            onClick={() => onModerate(ticket.id, true)}
                            className={`p-1 rounded hover:bg-emerald-900/30 ${isApproved ? 'text-emerald-400' : 'text-slate-600 hover:text-emerald-400'}`}
                            title="Approve"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </button>
                        <button
                            onClick={() => onModerate(ticket.id, false)}
                            className={`p-1 rounded hover:bg-red-900/30 ${isRejected ? 'text-red-400' : 'text-slate-600 hover:text-red-400'}`}
                            title="Reject"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                )}
            </div>

            <h4 className={`text-xs font-bold leading-snug mb-1 ${isRejected ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                {ticket.title}
            </h4>

            <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                {ticket.description}
            </p>

            <div className="mt-2 flex items-center justify-between">
                <div className="text-[9px] text-slate-600 uppercase tracking-wider">{ticket.category}</div>
                <div className="text-[9px] font-mono text-slate-600">{ticket.timeEstimateHours}h</div>
            </div>
        </div>
    );
}
