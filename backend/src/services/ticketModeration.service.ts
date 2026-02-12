/**
 * Ticket Moderation Service
 * 
 * Provides SuperAdmin moderation layer for SOP tickets before roadmap generation.
 * Allows approval/rejection of AI-generated tickets to ensure quality and prevent bloat.
 */

import { db } from '../db/index.ts';
import { sopTickets, ticketsDraft, ticketModerationSessions } from '../db/schema.ts';
import { eq, and, inArray, or, isNull, ne, notInArray, isNotNull, desc, asc, sql, count } from 'drizzle-orm';

export interface ModerationTicketDTO {
  id: string;
  tenantId: string;
  diagnosticId: string;
  ticketId: string;
  title: string;
  category: string;
  tier: string | null;
  valueCategory: string | null;
  owner: string;
  priority: string;
  sprint: number;
  timeEstimateHours: number;
  costEstimate: number;
  projectedHoursSavedWeekly: number;
  projectedLeadsRecoveredMonthly: number;
  approved: boolean;
  description: string;
  adminNotes: string | null;
  moderatedAt: Date | null;
  moderatedBy: string | null;
}

export async function getTicketsForDiagnostic(
  tenantId: string,
  diagnosticId: string
): Promise<ModerationTicketDTO[]> {
  // 1. Check for Active Draft Session (Stage 6 Canonical)
  const [activeSession] = await db
    .select()
    .from(ticketModerationSessions)
    .where(
      and(
        eq(ticketModerationSessions.tenantId, tenantId),
        eq(ticketModerationSessions.status, 'active')
      )
    )
    .limit(1);

  if (activeSession) {
    const drafts = await db
      .select({
        id: ticketsDraft.id,
        tenantId: ticketsDraft.tenantId,
        ticketId: ticketsDraft.findingId, // finding-id serves as ticket-id in drafts
        title: ticketsDraft.title,
        category: ticketsDraft.category, // Use rich category
        description: ticketsDraft.description,
        status: ticketsDraft.status,
        tier: ticketsDraft.tier,
        timeEstimateHours: ticketsDraft.timeEstimateHours,
        ghlImplementation: ticketsDraft.ghlImplementation,
      })
      .from(ticketsDraft)
      .where(eq(ticketsDraft.moderationSessionId, activeSession.id))
      .orderBy(asc(ticketsDraft.createdAt));

    return drafts.map((t) => ({
      id: t.id,
      tenantId: t.tenantId,
      diagnosticId: diagnosticId, // maintain context
      ticketId: t.ticketId,
      title: t.title,
      category: t.category || 'Diagnostic',
      tier: t.tier || 'recommended',
      valueCategory: 'Diagnostic',
      owner: 'Admin',
      priority: 'medium',
      sprint: 30, // Default 30-day sprint pending Roadmap Assembly
      timeEstimateHours: t.timeEstimateHours || 0,
      costEstimate: 0,
      projectedHoursSavedWeekly: 0,
      projectedLeadsRecoveredMonthly: 0,
      approved: t.status === 'accepted',
      description: t.description + (t.ghlImplementation ? `\n\nImplementation: ${t.ghlImplementation.substring(0, 100)}...` : ''), // Append snippet
      adminNotes: null,
      moderatedAt: null,
      moderatedBy: null,
    }));
  }

  // 2. Fallback to Legacy sop_tickets
  const rows = await db
    .select({
      id: sopTickets.id,
      tenantId: sopTickets.tenantId,
      diagnosticId: sopTickets.diagnosticId,
      ticketId: sopTickets.ticketId,
      title: sopTickets.title,
      category: sopTickets.category,
      tier: sopTickets.tier,
      valueCategory: sopTickets.valueCategory,
      owner: sopTickets.owner,
      priority: sopTickets.priority,
      sprint: sopTickets.sprint,
      timeEstimateHours: sopTickets.timeEstimateHours,
      costEstimate: sopTickets.costEstimate,
      projectedHoursSavedWeekly: sopTickets.projectedHoursSavedWeekly,
      projectedLeadsRecoveredMonthly: sopTickets.projectedLeadsRecoveredMonthly,
      approved: sopTickets.approved,
      description: sopTickets.description,
      adminNotes: sopTickets.adminNotes,
      moderatedAt: sopTickets.moderatedAt,
      moderatedBy: sopTickets.moderatedBy,
    })
    .from(sopTickets)
    .where(
      and(
        eq(sopTickets.tenantId, tenantId),
        eq(sopTickets.diagnosticId, diagnosticId), // Strictly filter for canonical tickets
        eq(sopTickets.moderationStatus, 'pending'),
        isNotNull(sopTickets.painSource),
        notInArray(sopTickets.status, ['archived', 'invalid'])
      )
    )
    .orderBy(
      sopTickets.tier,
      sopTickets.sprint,
      sopTickets.ticketId
    );

  return rows.map((t) => ({
    id: t.id,
    tenantId: t.tenantId,
    diagnosticId: t.diagnosticId,
    ticketId: t.ticketId,
    title: t.title,
    category: t.category,
    tier: t.tier,
    valueCategory: t.valueCategory,
    owner: t.owner,
    priority: t.priority,
    sprint: t.sprint === 1 ? 30 : (t.sprint ?? 30), // Map V2 placeholder (1) to active UI column (30)
    timeEstimateHours: t.timeEstimateHours,
    costEstimate: t.costEstimate,
    projectedHoursSavedWeekly: t.projectedHoursSavedWeekly,
    projectedLeadsRecoveredMonthly: t.projectedLeadsRecoveredMonthly,
    approved: t.approved,
    description: t.description,
    adminNotes: t.adminNotes ?? null,
    moderatedAt: t.moderatedAt ?? null,
    moderatedBy: t.moderatedBy ?? null,
  }));
}

export interface UpdateTicketApprovalInput {
  ticketIds: string[]; // sop_tickets.id (uuid)
  approved: boolean;
  adminNotes?: string;
  moderatedBy: string; // user ID of superadmin
}

export async function updateTicketApproval(
  tenantId: string,
  { ticketIds, approved, adminNotes, moderatedBy }: UpdateTicketApprovalInput
): Promise<number> {
  if (!ticketIds.length) return 0;

  // 1. Try to update tickets_draft (Stage 6)
  const draftUpdate = await db
    .update(ticketsDraft)
    .set({
      status: approved ? 'accepted' : 'rejected',
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(ticketsDraft.tenantId, tenantId),
        inArray(ticketsDraft.id, ticketIds)
      )
    )
    .returning({ id: ticketsDraft.id });

  if (draftUpdate.length > 0) {
    return draftUpdate.length;
  }

  // 2. Fallback to sop_tickets (Legacy)
  const ticketsToUpdate = await db
    .select({ id: sopTickets.id, painSource: sopTickets.painSource })
    .from(sopTickets)
    .where(
      and(
        eq(sopTickets.tenantId, tenantId),
        inArray(sopTickets.id, ticketIds)
      )
    );

  const nonCanonical = ticketsToUpdate.filter(t => !t.painSource);
  if (nonCanonical.length > 0) {
    throw new Error('INVALID_TICKET_NO_CANONICAL_PROVENANCE');
  }

  const result = await db
    .update(sopTickets)
    .set({
      approved,
      status: approved ? 'approved' : 'rejected',
      moderationStatus: approved ? 'approved' : 'rejected',
      adminNotes: adminNotes ?? null,
      moderatedAt: new Date(),
      moderatedBy,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(sopTickets.tenantId, tenantId),
        inArray(sopTickets.id, ticketIds)
      )
    )
    .returning({ id: sopTickets.id });

  return result.length;
}

/**
 * Convenience helpers
 */
export async function approveTickets(
  tenantId: string,
  ticketIds: string[],
  moderatedBy: string,
  adminNotes?: string
) {
  return updateTicketApproval(tenantId, { ticketIds, approved: true, adminNotes, moderatedBy });
}

export async function rejectTickets(
  tenantId: string,
  ticketIds: string[],
  moderatedBy: string,
  adminNotes?: string
) {
  return updateTicketApproval(tenantId, { ticketIds, approved: false, adminNotes, moderatedBy });
}

export async function getModerationStatus(tenantId: string, diagnosticId: string) {
  // 1. Check Draft Tickets first
  const draftStats = await db
    .select({
      status: ticketsDraft.status,
      count: count()
    })
    .from(ticketsDraft)
    .where(eq(ticketsDraft.tenantId, tenantId))
    .groupBy(ticketsDraft.status);

  if (draftStats.length > 0) {
    const total = draftStats.reduce((sum, s) => sum + (s.count ?? 0), 0);
    const approved = draftStats.filter(s => s.status === 'accepted').reduce((sum, s) => sum + (s.count ?? 0), 0);
    const rejected = draftStats.filter(s => s.status === 'rejected').reduce((sum, s) => sum + (s.count ?? 0), 0);
    const pending = draftStats.filter(s => s.status === 'pending').reduce((sum, s) => sum + (s.count ?? 0), 0);

    return {
      total,
      approved,
      rejected,
      pending,
      readyForRoadmap: pending === 0 && approved > 0
    };
  }

  // 2. Fallback to sop_tickets
  const tickets = await db
    .select({
      approved: sopTickets.approved,
      moderatedAt: sopTickets.moderatedAt,
      moderationStatus: sopTickets.moderationStatus
    })
    .from(sopTickets)
    .where(
      and(
        eq(sopTickets.tenantId, tenantId),
        eq(sopTickets.diagnosticId, diagnosticId),
        isNotNull(sopTickets.painSource),
        notInArray(sopTickets.status, ['archived', 'invalid'])
      )
    );

  const approved = tickets.filter(t => t.moderationStatus === 'approved');
  const rejected = tickets.filter(t => t.moderationStatus === 'rejected');
  const pending = tickets.filter(t => t.moderationStatus === 'pending');

  return {
    total: tickets.length,
    approved: approved.length,
    rejected: rejected.length,
    pending: pending.length,
    readyForRoadmap: pending.length === 0 && approved.length > 0
  };
}
