import { Request, Response } from 'express';
import { db } from '../db';
import { ticketInstances, auditEvents } from '../db/schema';
import { eq } from 'drizzle-orm';
import { updateSectionStatus, recalculatePackTotals } from '../services/sectionStatusSync.service';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    ownerId: string;
  };
}

/**
 * PATCH /api/tickets/:ticketInstanceId/status
 * Update ticket status with full lifecycle tracking
 */
export async function updateTicketStatus(req: AuthRequest, res: Response) {
  try {
    const { ticketInstanceId } = req.params;
    const { status } = req.body;

    if (!['not_started', 'in_progress', 'blocked', 'done', 'skipped'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Get current ticket
    const ticket = await db.query.ticketInstances.findFirst({
      where: eq(ticketInstances.id, ticketInstanceId),
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Update ticket with timestamps
    const now = new Date();
    const updates: any = {
      status,
      updatedAt: now,
    };

    if (status === 'in_progress' && !ticket.startedAt) {
      updates.startedAt = now;
    }

    if (status === 'done' && !ticket.completedAt) {
      updates.completedAt = now;
    }

    await db
      .update(ticketInstances)
      .set(updates)
      .where(eq(ticketInstances.id, ticketInstanceId));

    // Lifecycle hooks
    await Promise.all([
      recalculatePackTotals(ticket.ticketPackId),
      ticket.sectionNumber !== null ? updateSectionStatus(ticket.ticketPackId, ticket.sectionNumber) : Promise.resolve(),
      logTicketEvent('ticket_status_changed', ticket, req.user?.userId, { oldStatus: ticket.status, newStatus: status }),
    ]);

    return res.json({ ok: true });
  } catch (error) {
    console.error('Update ticket status error:', error);
    return res.status(500).json({ error: 'Failed to update ticket status' });
  }
}

/**
 * PATCH /api/tickets/:ticketInstanceId/assignee
 */
export async function updateTicketAssignee(req: AuthRequest, res: Response) {
  try {
    const { ticketInstanceId } = req.params;
    const { assignee } = req.body;

    const ticket = await db.query.ticketInstances.findFirst({
      where: eq(ticketInstances.id, ticketInstanceId),
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    await db
      .update(ticketInstances)
      .set({ assignee, updatedAt: new Date() })
      .where(eq(ticketInstances.id, ticketInstanceId));

    await logTicketEvent('ticket_assigned', ticket, req.user?.userId, { assignee });

    return res.json({ ok: true });
  } catch (error) {
    console.error('Update ticket assignee error:', error);
    return res.status(500).json({ error: 'Failed to update assignee' });
  }
}

/**
 * PATCH /api/tickets/:ticketInstanceId/notes
 */
export async function updateTicketNotes(req: AuthRequest, res: Response) {
  try {
    const { ticketInstanceId } = req.params;
    const { notes } = req.body;

    const ticket = await db.query.ticketInstances.findFirst({
      where: eq(ticketInstances.id, ticketInstanceId),
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    await db
      .update(ticketInstances)
      .set({ notes, updatedAt: new Date() })
      .where(eq(ticketInstances.id, ticketInstanceId));

    await logTicketEvent('ticket_note_added', ticket, req.user?.userId, { noteLength: notes?.length || 0 });

    return res.json({ ok: true });
  } catch (error) {
    console.error('Update ticket notes error:', error);
    return res.status(500).json({ error: 'Failed to update notes' });
  }
}

/**
 * Helper: Log ticket lifecycle events to audit trail
 */
async function logTicketEvent(
  eventType: string,
  ticket: typeof ticketInstances.$inferSelect,
  userId?: string,
  metadata?: Record<string, any>
) {
  try {
    await db.insert(auditEvents).values({
      actorUserId: userId || null,
      eventType,
      entityType: 'ticket',
      entityId: ticket.id,
      metadata: {
        ticketId: ticket.ticketId,
        ticketPackId: ticket.ticketPackId,
        sectionNumber: ticket.sectionNumber,
        ...metadata,
      },
    });
  } catch (error) {
    console.error('Failed to log ticket event:', error);
  }
}
