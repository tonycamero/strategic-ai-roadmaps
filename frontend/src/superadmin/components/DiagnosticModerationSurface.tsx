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
    moderatedBy: string | null;
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

interface DiagnosticModerationSurfaceProps {
    tenantId: string;
    diagnosticId: string;
    tickets: Ticket[];
    status: ModerationStatus | null;
    loading?: boolean;
    error?: string | null;
    onRefresh?: () => Promise<void>;
    onStatusChange?: (status: ModerationStatus) => void;
}

export function DiagnosticModerationSurface({
    tenantId,
    diagnosticId,
    tickets: propTickets,
    status: propStatus,
    loading = false,
    error: propError = null,
    onRefresh,
    onStatusChange
}: DiagnosticModerationSurfaceProps) {
    const { isExecutive } = useSuperAdminAuthority();
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Tickets AND Status are now prop-driven from the parent snapshot.
    // Local state is only for optimistic updates during moderation.
    const [localTickets, setLocalTickets] = useState<Ticket[]>(propTickets);
    const [localStatus, setLocalStatus] = useState<ModerationStatus | null>(propStatus);

    useEffect(() => {
        setLocalTickets(propTickets);
    }, [propTickets]);

    useEffect(() => {
        setLocalStatus(propStatus);
    }, [propStatus]);

    const handleModerate = async (ticketId: string, approved: boolean) => {
        if (!isExecutive) return;
        setProcessingId(ticketId);
        try {
            // Optimistic Update
            setLocalTickets(prev => prev.map(t =>
                t.id === ticketId ? { ...t, approved, moderatedAt: new Date().toISOString() } : t
            ));

            if (approved) {
                await superadminApi.approveTickets({ tenantId, diagnosticId, ticketIds: [ticketId] });
            } else {
                await superadminApi.rejectTickets({ tenantId, diagnosticId, ticketIds: [ticketId] });
            }

            if (onRefresh) {
                await onRefresh();
            }
        } catch (err) {
            console.error('Moderation failed', err);
            // Revert state on error by resetting to latest prop data
            setLocalTickets(propTickets);
        } finally {
            setProcessingId(null);
        }
    };



    if (propError) {
        return (
            <div className="p-4 bg-red-900/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-400 text-xs font-mono">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{propError}</span>
                <button onClick={onRefresh} className="ml-auto underline hover:text-red-300">Retry</button>
            </div>
        );
    }

    if (loading) return <div className="text-slate-500 text-xs animate-pulse">Loading diagnostic tickets...</div>;

    if (localTickets.length === 0) return <div className="text-slate-500 text-xs italic">No findings generated yet.</div>;

    return (
        <div className="space-y-4">
            {/* Status Header */}
            {localStatus && (
                <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                    <div className="flex gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase text-slate-500 font-bold">Pending</span>
                            <span className="text-lg font-mono text-amber-500 font-bold leading-none">{localStatus.pending}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase text-slate-500 font-bold">Approved</span>
                            <span className="text-lg font-mono text-emerald-500 font-bold leading-none">{localStatus.approved}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase text-slate-500 font-bold">Rejected</span>
                            <span className="text-lg font-mono text-red-500 font-bold leading-none">{localStatus.rejected}</span>
                        </div>
                    </div>

                    <div className="text-right">
                        <div className={`text-[10px] uppercase font-bold px-2 py-1 rounded inline-block ${localStatus.readyForRoadmap ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                            {localStatus.readyForRoadmap ? 'READY FOR ROADMAP' : 'MODERATION INCOMPLETE'}
                        </div>
                    </div>
                </div>
            )}

            {/* Ticket List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {localTickets.map(ticket => (
                    <div key={ticket.id} className={`group relative p-3 rounded-lg border transition-all ${ticket.moderatedAt
                        ? (ticket.approved
                            ? 'bg-emerald-900/5 border-emerald-900/30'
                            : 'bg-red-900/5 border-red-900/30 opacity-60 hover:opacity-100')
                        : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'
                        }`}>
                        <div className="flex justify-between items-start gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 rounded">
                                        {ticket.ticketId.startsWith('ai-gen-') ? 'DRAFT' : ticket.ticketId}
                                    </span>
                                    {ticket.tier && (
                                        <span className={`text-[9px] uppercase font-bold px-1.5 rounded border ${ticket.tier === 'critical' ? 'text-red-400 border-red-900/30 bg-red-900/10' :
                                            ticket.tier === 'recommended' ? 'text-emerald-400 border-emerald-900/30 bg-emerald-900/10' :
                                                'text-blue-400 border-blue-900/30 bg-blue-900/10'
                                            }`}>
                                            {ticket.tier}
                                        </span>
                                    )}
                                    {ticket.moderatedAt && (
                                        <span className={`text-[9px] uppercase font-bold ${ticket.approved ? 'text-emerald-500' : 'text-red-500'}`}>
                                            — {ticket.approved ? 'APPROVED' : 'REJECTED'}
                                        </span>
                                    )}
                                </div>
                                <h4 className="text-sm font-medium text-slate-200 truncate pr-4" title={ticket.title}>{ticket.title}</h4>
                                <p className="text-xs text-slate-500 line-clamp-2 mt-1">{ticket.description}</p>
                            </div>

                            {/* Actions (Executive Only) */}
                            {isExecutive && !ticket.moderatedAt && (
                                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleModerate(ticket.id, true)}
                                        disabled={!!processingId}
                                        className="p-1.5 bg-emerald-900/20 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded border border-emerald-500/30 transition-colors"
                                        title="Approve"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    </button>
                                    <button
                                        onClick={() => handleModerate(ticket.id, false)}
                                        disabled={!!processingId}
                                        className="p-1.5 bg-red-900/20 text-red-400 hover:bg-red-600 hover:text-white rounded border border-red-500/30 transition-colors"
                                        title="Reject"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
