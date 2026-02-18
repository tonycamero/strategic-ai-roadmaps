import { db } from '../db/index';
import { roadmapSections, ticketPacks, ticketInstances } from '../db/schema';
import { eq } from 'drizzle-orm';

interface GeneratedTicket {
  ticketId: string;
  sectionNumber: number;
  title: string;
  description: string;
}

/**
 * Generate ticket pack for a roadmap.
 * Creates 3-5 atomic tasks per section based on content.
 * Idempotent: clears existing tickets and regenerates.
 */
export async function generateTicketPackForRoadmap(
  roadmapId: string,
  tenantId: string
): Promise<{ ticketPackId: string; ticketsGenerated: number }> {
  // Get all sections for this roadmap
  const sections = await db
    .select()
    .from(roadmapSections)
    .where(eq(roadmapSections.roadmapId, roadmapId))
    .orderBy(roadmapSections.sectionNumber);

  if (sections.length === 0) {
    throw new Error('No roadmap sections found for roadmapId: ' + roadmapId);
  }

  // Get or create ticket pack
  let ticketPack = await db.query.ticketPacks.findFirst({
    where: eq(ticketPacks.roadmapId, roadmapId),
  });

  if (!ticketPack) {
    const [newPack] = await db
      .insert(ticketPacks)
      .values({
        tenantId,
        roadmapId,
        version: 'v1.0',
        status: 'not_started',
      })
      .returning();
    ticketPack = newPack;
  }

  // Delete existing tickets (idempotent)
  await db
    .delete(ticketInstances)
    .where(eq(ticketInstances.ticketPackId, ticketPack.id));

  // Generate tickets for each section
  const allTickets: GeneratedTicket[] = [];
  
  for (const section of sections) {
    const tickets = generateTicketsFromSection(section);
    allTickets.push(...tickets);
  }

  // Insert all tickets
  for (const ticket of allTickets) {
    await db.insert(ticketInstances).values({
      ticketPackId: ticketPack.id,
      ticketId: ticket.ticketId,
      sectionNumber: ticket.sectionNumber,
      status: 'not_started',
      notes: `${ticket.title}\n\n${ticket.description}`,
    });
  }

  // Update pack totals
  await db
    .update(ticketPacks)
    .set({
      totalTickets: allTickets.length,
      totals: {
        tickets: allTickets.length,
        not_started: allTickets.length,
        in_progress: 0,
        done: 0,
        blocked: 0,
      },
      updatedAt: new Date(),
    })
    .where(eq(ticketPacks.id, ticketPack.id));

  return {
    ticketPackId: ticketPack.id,
    ticketsGenerated: allTickets.length,
  };
}

/**
 * Generate 3-5 tickets from a roadmap section.
 * Simple heuristic-based generation (can be replaced with AI later).
 */
function generateTicketsFromSection(section: typeof roadmapSections.$inferSelect): GeneratedTicket[] {
  const tickets: GeneratedTicket[] = [];
  const content = section.contentMarkdown;
  const sectionNum = section.sectionNumber;

  // Extract headings and list items as potential tickets
  const headings = content.match(/^#{2,4}\s+(.+)$/gm) || [];
  const listItems = content.match(/^[-*]\s+(.+)$/gm) || [];

  // Strategy: Create tickets from major headings and action items
  let ticketIndex = 1;

  // From headings (major tasks)
  for (const heading of headings.slice(0, 3)) {
    const title = heading.replace(/^#{2,4}\s+/, '').trim();
    tickets.push({
      ticketId: `S${sectionNum}-T${ticketIndex++}`,
      sectionNumber: sectionNum,
      title,
      description: `Complete: ${title}`,
    });
  }

  // From list items (specific actions)
  for (const item of listItems.slice(0, 2)) {
    const title = item.replace(/^[-*]\s+/, '').trim();
    if (title.length > 10 && title.length < 100) {
      tickets.push({
        ticketId: `S${sectionNum}-T${ticketIndex++}`,
        sectionNumber: sectionNum,
        title,
        description: `Action: ${title}`,
      });
    }
  }

  // Ensure at least 2 tickets per section
  if (tickets.length === 0) {
    tickets.push({
      ticketId: `S${sectionNum}-T1`,
      sectionNumber: sectionNum,
      title: `Review ${section.sectionName}`,
      description: `Review and plan implementation for ${section.sectionName}`,
    });
    tickets.push({
      ticketId: `S${sectionNum}-T2`,
      sectionNumber: sectionNum,
      title: `Execute ${section.sectionName}`,
      description: `Execute key action items from ${section.sectionName}`,
    });
  }

  return tickets.slice(0, 5); // Max 5 tickets per section
}
