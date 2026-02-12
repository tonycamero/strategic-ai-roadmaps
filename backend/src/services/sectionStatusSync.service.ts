import { db } from '../db/index.ts';
import { ticketInstances, roadmapSections, ticketPacks } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

type SectionStatus = 'planned' | 'in_progress' | 'done' | 'blocked';

/**
 * Update roadmap section status based on its tickets' progress.
 * Called after any ticket status change.
 */
export async function updateSectionStatus(
  ticketPackId: string,
  sectionNumber: number
): Promise<void> {
  // Get all tickets for this section
  const tickets = await db
    .select()
    .from(ticketInstances)
    .where(eq(ticketInstances.ticketPackId, ticketPackId));

  const sectionTickets = tickets.filter(t => t.sectionNumber === sectionNumber);

  if (sectionTickets.length === 0) return;

  // Determine section status from ticket statuses
  const statuses = sectionTickets.map(t => t.status);
  const newStatus = deriveSectionStatus(statuses as SectionStatus[]);

  // Get roadmap from ticket pack
  const pack = await db.query.ticketPacks.findFirst({
    where: eq(ticketPacks.id, ticketPackId),
  });

  if (!pack?.roadmapId) return;

  // Update section status
  const sectionsToUpdate = await db
    .select()
    .from(roadmapSections)
    .where(eq(roadmapSections.roadmapId, pack.roadmapId));

  const targetSection = sectionsToUpdate.find(s => s.sectionNumber === sectionNumber);
  if (!targetSection) return;

  await db
    .update(roadmapSections)
    .set({
      status: newStatus,
      lastUpdatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(roadmapSections.id, targetSection.id));
}

/**
 * Derive section status from ticket statuses.
 * Priority: blocked > in_progress > done > planned
 */
function deriveSectionStatus(ticketStatuses: string[]): SectionStatus {
  if (ticketStatuses.includes('blocked')) return 'blocked';
  if (ticketStatuses.includes('in_progress')) return 'in_progress';
  
  const allDone = ticketStatuses.every(s => s === 'done' || s === 'skipped');
  if (allDone && ticketStatuses.length > 0) return 'done';
  
  return 'planned';
}

/**
 * Recalculate ticket pack totals after any ticket change.
 */
export async function recalculatePackTotals(ticketPackId: string): Promise<void> {
  const tickets = await db
    .select()
    .from(ticketInstances)
    .where(eq(ticketInstances.ticketPackId, ticketPackId));

  const totals = {
    tickets: tickets.length,
    not_started: tickets.filter(t => t.status === 'not_started').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    done: tickets.filter(t => t.status === 'done').length,
    blocked: tickets.filter(t => t.status === 'blocked').length,
  };

  // Determine overall pack status
  let packStatus: 'not_started' | 'in_progress' | 'completed' = 'not_started';
  if (totals.done === totals.tickets && totals.tickets > 0) {
    packStatus = 'completed';
  } else if (totals.in_progress > 0 || totals.done > 0) {
    packStatus = 'in_progress';
  }

  await db
    .update(ticketPacks)
    .set({
      totalTickets: totals.tickets,
      totals,
      status: packStatus,
      updatedAt: new Date(),
    })
    .where(eq(ticketPacks.id, ticketPackId));
}
