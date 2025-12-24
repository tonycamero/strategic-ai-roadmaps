import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';

interface Ticket {
  ticketId: string;
  title: string;
  category: string;
  valueCategory: string;
  tier: string;
  description: string;
  timeEstimateHours: number;
  costEstimate: number;
  projectedHoursSavedWeekly: number;
  projectedLeadsRecoveredMonthly: number;
  approved: boolean | null;
  moderatedAt: string | null;
  adminNotes: string | null;
}

interface ModerationStatus {
  totalTickets: number;
  approvedCount: number;
  rejectedCount: number;
  pendingCount: number;
  allModerated: boolean;
}

type TicketColumn = 'CORE' | 'RECOMMENDED' | 'ADVANCED' | 'REJECTED';

export default function TicketModeration() {
  const [, params] = useRoute<{ tenantId: string; diagnosticId: string }>('/superadmin/tickets/:tenantId/:diagnosticId');
  const [, setLocation] = useLocation();
  
  const tenantId = params?.tenantId;
  const diagnosticId = params?.diagnosticId;

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [status, setStatus] = useState<ModerationStatus | null>(null);
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch tickets
  useEffect(() => {
    fetchTickets();
    fetchStatus();
  }, [tenantId, diagnosticId]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/superadmin/tickets/${tenantId}/${diagnosticId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch tickets');

      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatus = async () => {
    try {
      const response = await fetch(
        `/api/superadmin/tickets/${tenantId}/${diagnosticId}/status`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch status');

      const data = await response.json();
      setStatus(data);
    } catch (err: any) {
      console.error('Failed to fetch moderation status:', err);
    }
  };

  const handleApprove = async () => {
    if (selectedTickets.size === 0) return;

    try {
      setActionLoading(true);
      const response = await fetch('/api/superadmin/tickets/approve', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ticketIds: Array.from(selectedTickets),
          adminNotes: 'Bulk approved'
        })
      });

      if (!response.ok) throw new Error('Failed to approve tickets');

      await fetchTickets();
      await fetchStatus();
      setSelectedTickets(new Set());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (selectedTickets.size === 0) return;

    try {
      setActionLoading(true);
      const response = await fetch('/api/superadmin/tickets/reject', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ticketIds: Array.from(selectedTickets),
          adminNotes: 'Bulk rejected'
        })
      });

      if (!response.ok) throw new Error('Failed to reject tickets');

      await fetchTickets();
      await fetchStatus();
      setSelectedTickets(new Set());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateFinalRoadmap = async () => {
    if (!status?.allModerated) {
      alert('All tickets must be moderated before generating final roadmap');
      return;
    }

    if (status.approvedCount === 0) {
      alert('At least one ticket must be approved to generate roadmap');
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(
        `/api/superadmin/firms/${tenantId}/generate-final-roadmap`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate final roadmap');
      }

      const result = await response.json();
      alert(`✅ Final roadmap generated! ${result.data.approvedTicketCount} tickets approved, ${result.data.sectionCount} sections created.`);
      setLocation(`/superadmin/firms/${tenantId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleTicket = (ticketId: string) => {
    setSelectedTickets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(ticketId)) {
        newSet.delete(ticketId);
      } else {
        newSet.add(ticketId);
      }
      return newSet;
    });
  };

  const getColumnTickets = (column: TicketColumn): Ticket[] => {
    if (column === 'REJECTED') {
      return tickets.filter((t) => t.approved === false);
    }
    return tickets.filter((t) => t.tier === column && t.approved !== false);
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Loading tickets...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Error</h1>
        <p>{error}</p>
        <button
          onClick={() => setLocation(`/superadmin/firms/${tenantId}`)}
          className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Back to Firm
        </button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Ticket Moderation</h1>
        <p className="text-gray-600 mb-4">
          Review and approve tickets before generating final roadmap
        </p>

        {status && (
          <div className="flex gap-4 mb-4">
            <div className="px-4 py-2 bg-blue-100 rounded">
              Total: <strong>{status.totalTickets}</strong>
            </div>
            <div className="px-4 py-2 bg-green-100 rounded">
              Approved: <strong>{status.approvedCount}</strong>
            </div>
            <div className="px-4 py-2 bg-red-100 rounded">
              Rejected: <strong>{status.rejectedCount}</strong>
            </div>
            <div className="px-4 py-2 bg-yellow-100 rounded">
              Pending: <strong>{status.pendingCount}</strong>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleApprove}
            disabled={selectedTickets.size === 0 || actionLoading}
            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700"
          >
            Approve Selected ({selectedTickets.size})
          </button>

          <button
            onClick={handleReject}
            disabled={selectedTickets.size === 0 || actionLoading}
            className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700"
          >
            Reject Selected ({selectedTickets.size})
          </button>

          <button
            onClick={handleGenerateFinalRoadmap}
            disabled={!status?.allModerated || status.approvedCount === 0 || actionLoading}
            className="ml-auto px-6 py-2 bg-blue-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 font-semibold"
          >
            {status?.allModerated
              ? '🎉 Generate Final Roadmap'
              : `⏳ Moderate All (${status?.pendingCount || 0} pending)`}
          </button>

          <button
            onClick={() => setLocation(`/superadmin/firms/${tenantId}`)}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Back
          </button>
        </div>
      </div>

      {/* 4-Column Kanban */}
      <div className="grid grid-cols-4 gap-4">
        {(['CORE', 'RECOMMENDED', 'ADVANCED', 'REJECTED'] as TicketColumn[]).map((column) => {
          const columnTickets = getColumnTickets(column);
          return (
            <div key={column} className="border rounded-lg p-4 bg-gray-50">
              <h2 className="font-bold text-lg mb-3 uppercase">{column}</h2>
              <div className="space-y-3">
                {columnTickets.map((ticket) => (
                  <TicketCard
                    key={ticket.ticketId}
                    ticket={ticket}
                    isSelected={selectedTickets.has(ticket.ticketId)}
                    onToggle={() => toggleTicket(ticket.ticketId)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface TicketCardProps {
  ticket: Ticket;
  isSelected: boolean;
  onToggle: () => void;
}

function TicketCard({ ticket, isSelected, onToggle }: TicketCardProps) {
  const isModerated = ticket.moderatedAt !== null;
  const isApproved = ticket.approved === true;

  return (
    <div
      className={`border rounded p-3 bg-white cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } ${isModerated ? 'opacity-75' : ''}`}
      onClick={onToggle}
    >
      <div className="flex items-start gap-2 mb-2">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          className="mt-1"
          disabled={isModerated}
        />
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{ticket.title}</h3>
          <p className="text-xs text-gray-500 mt-1">
            {ticket.category} • {ticket.valueCategory}
          </p>
        </div>
      </div>

      <div className="text-xs space-y-1 text-gray-600">
        <div>⏱️ {ticket.timeEstimateHours}h • ${ticket.costEstimate}</div>
        <div>
          💰 {ticket.projectedHoursSavedWeekly}h/wk saved •{' '}
          {ticket.projectedLeadsRecoveredMonthly} leads/mo
        </div>
      </div>

      {isModerated && (
        <div className={`mt-2 text-xs font-semibold ${isApproved ? 'text-green-600' : 'text-red-600'}`}>
          {isApproved ? '✅ APPROVED' : '❌ REJECTED'}
        </div>
      )}
    </div>
  );
}
