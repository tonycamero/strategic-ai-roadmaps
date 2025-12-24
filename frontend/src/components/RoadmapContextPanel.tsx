import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useState } from 'react';

interface RoadmapSection {
  id: string;
  sectionNumber: number;
  title: string;
  status: 'planned' | 'in_progress' | 'implemented';
  content?: string;
  metadata?: {
    ticketsCompleted?: number;
    ticketsTotal?: number;
    systemsImplemented?: string[];
    systemCompletion?: number;
  };
}

interface TicketInstance {
  id: string;
  ticketId: string;
  status: 'not_started' | 'in_progress' | 'blocked' | 'done';
  title?: string;
}

const STATUS_COLORS = {
  planned: 'bg-slate-700 text-slate-300',
  in_progress: 'bg-blue-900/40 text-blue-300 border-blue-800',
  implemented: 'bg-green-900/40 text-green-300 border-green-800',
};

const TICKET_STATUS_COLORS = {
  not_started: 'bg-slate-700 text-slate-400',
  in_progress: 'bg-blue-600 text-blue-100',
  blocked: 'bg-red-600 text-red-100',
  done: 'bg-green-600 text-green-100',
};

export function RoadmapContextPanel() {
  const [isExpanded, setIsExpanded] = useState(true);

  const { data: sectionsData, isLoading: sectionsLoading } = useQuery({
    queryKey: ['roadmap-sections'],
    queryFn: () => api.getRoadmapSections(),
    refetchInterval: 10000,
  });

  const { data: ticketsData, isLoading: ticketsLoading } = useQuery({
    queryKey: ['roadmap-tickets'],
    queryFn: () => api.getRoadmapTickets(),
    refetchInterval: 10000,
  });

  const sections = (sectionsData?.sections || []) as RoadmapSection[];
  const tickets = (ticketsData?.tickets || []) as TicketInstance[];

  // Calculate overall progress
  const totalSections = sections.length;
  const implementedSections = sections.filter(s => s.status === 'implemented').length;
  const sectionProgress = totalSections > 0 ? Math.round((implementedSections / totalSections) * 100) : 0;

  const totalTickets = tickets.length;
  const doneTickets = tickets.filter(t => t.status === 'done').length;
  const ticketProgress = totalTickets > 0 ? Math.round((doneTickets / totalTickets) * 100) : 0;

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed top-20 right-4 z-40 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors shadow-lg"
      >
        📊 Show Context
      </button>
    );
  }

  return (
    <div className="fixed top-20 right-4 w-96 max-h-[calc(100vh-120px)] z-40 bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-200">Roadmap Context</h3>
          <button
            onClick={() => setIsExpanded(false)}
            className="text-slate-400 hover:text-slate-200 text-xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {/* Overall Progress */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900/60 rounded-lg p-2 border border-slate-700">
            <div className="text-xs text-slate-400 mb-1">Sections</div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-slate-100">{sectionProgress}%</span>
              <span className="text-xs text-slate-400">
                {implementedSections}/{totalSections}
              </span>
            </div>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-2 border border-slate-700">
            <div className="text-xs text-slate-400 mb-1">Tickets</div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-slate-100">{ticketProgress}%</span>
              <span className="text-xs text-slate-400">
                {doneTickets}/{totalTickets}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Sections */}
        <div className="p-4 border-b border-slate-800">
          <h4 className="text-xs font-semibold text-slate-300 mb-3 uppercase tracking-wide">
            Roadmap Sections
          </h4>
          {sectionsLoading ? (
            <div className="text-xs text-slate-400">Loading...</div>
          ) : sections.length === 0 ? (
            <div className="text-xs text-slate-400">No sections available</div>
          ) : (
            <div className="space-y-2">
              {sections.slice(0, 10).map((section) => (
                <div
                  key={section.id}
                  className="bg-slate-800/60 rounded-lg p-2 border border-slate-700"
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1">
                      <div className="text-xs font-medium text-slate-200">
                        {section.sectionNumber}. {section.title}
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded border font-medium ${STATUS_COLORS[section.status]}`}
                    >
                      {section.status.replace('_', ' ')}
                    </span>
                  </div>
                  {section.metadata?.systemCompletion !== undefined && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all"
                          style={{ width: `${section.metadata.systemCompletion}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400">
                        {section.metadata.systemCompletion}%
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tickets */}
        <div className="p-4">
          <h4 className="text-xs font-semibold text-slate-300 mb-3 uppercase tracking-wide">
            Active Tickets
          </h4>
          {ticketsLoading ? (
            <div className="text-xs text-slate-400">Loading...</div>
          ) : tickets.length === 0 ? (
            <div className="text-xs text-slate-400">No tickets available</div>
          ) : (
            <div className="space-y-2">
              {/* Ticket Status Summary */}
              <div className="grid grid-cols-4 gap-1 mb-3">
                {Object.entries({
                  not_started: tickets.filter(t => t.status === 'not_started').length,
                  in_progress: tickets.filter(t => t.status === 'in_progress').length,
                  blocked: tickets.filter(t => t.status === 'blocked').length,
                  done: tickets.filter(t => t.status === 'done').length,
                }).map(([status, count]) => (
                  <div
                    key={status}
                    className={`text-center px-1 py-1 rounded text-xs font-medium ${TICKET_STATUS_COLORS[status as keyof typeof TICKET_STATUS_COLORS]}`}
                  >
                    {count}
                  </div>
                ))}
              </div>

              {/* Recent/Active Tickets */}
              {tickets
                .filter(t => t.status !== 'done')
                .slice(0, 8)
                .map((ticket) => (
                  <div
                    key={ticket.id}
                    className="bg-slate-800/60 rounded-lg p-2 border border-slate-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="text-xs text-slate-300 flex-1">
                        {ticket.title || `Ticket ${ticket.ticketId}`}
                      </div>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded font-medium ml-2 ${TICKET_STATUS_COLORS[ticket.status]}`}
                      >
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
