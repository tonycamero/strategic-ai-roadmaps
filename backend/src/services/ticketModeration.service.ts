/**
 * Ticket Moderation Service
 * 
 * Provides SuperAdmin moderation layer for SOP tickets before roadmap generation.
 * Allows approval/rejection of AI-generated tickets to ensure quality and prevent bloat.
 */

import { db } from '../db';
import { sopTickets } from '../db/schema';
import { eq, and, inArray } from 'drizzle-orm';

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
  adminNotes: string | null;
  moderatedAt: Date | null;
  moderatedBy: string | null;
}

/**
 * Get all tickets for a diagnostic, grouped for moderation UI
 */
export async function getTicketsForDiagnostic(
  tenantId: string,
  diagnosticId: string
): Promise<ModerationTicketDTO[]> {
  const rows = await db
    .select()
    .from(sopTickets)
    .where(
      and(
        eq(sopTickets.tenantId, tenantId),
        eq(sopTickets.diagnosticId, diagnosticId)
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
    sprint: t.sprint,
    timeEstimateHours: t.timeEstimateHours,
    costEstimate: t.costEstimate,
    projectedHoursSavedWeekly: t.projectedHoursSavedWeekly,
    projectedLeadsRecoveredMonthly: t.projectedLeadsRecoveredMonthly,
    approved: t.approved,
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

/**
 * Bulk approve/reject tickets
 */
export async function updateTicketApproval(
  tenantId: string,
  { ticketIds, approved, adminNotes, moderatedBy }: UpdateTicketApprovalInput
): Promise<number> {
  if (!ticketIds.length) return 0;

  const result = await db
    .update(sopTickets)
    .set({
      approved,
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

/**
 * Get moderation status summary for a diagnostic
 */
export async function getModerationStatus(tenantId: string, diagnosticId: string) {
  const tickets = await getTicketsForDiagnostic(tenantId, diagnosticId);
  
  const approved = tickets.filter(t => t.approved);
  const rejected = tickets.filter(t => !t.approved && t.moderatedAt !== null);
  const pending = tickets.filter(t => t.moderatedAt === null);
  
  return {
    total: tickets.length,
    approved: approved.length,
    rejected: rejected.length,
    pending: pending.length,
    readyForRoadmap: pending.length === 0 && approved.length > 0
  };
}
