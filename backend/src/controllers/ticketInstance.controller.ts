import { Request, Response } from 'express';
import { TicketPackService } from '../services/ticketPack.service.ts';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    ownerId: string;
  };
}

/**
 * Update ticket instance status
 * PATCH /ticket-instances/:id/status
 */
export async function updateTicketStatus(req: AuthRequest, res: Response) {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Missing required field: status' });
    }

    // Validate status enum
    const validStatuses = ['not_started', 'in_progress', 'blocked', 'done', 'skipped'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    // TODO: Add tenant/owner verification for non-superadmin users

    const result = await TicketPackService.updateTicketStatus({
      ticketInstanceId: id,
      status,
      notes,
    });

    return res.json({
      ticket: result.ticket,
      pack: result.pack,
    });
  } catch (error) {
    console.error('[TicketInstance] Error updating status:', error);
    if (error instanceof Error && error.message === 'Ticket instance not found') {
      return res.status(404).json({ error: 'Ticket instance not found' });
    }
    return res.status(500).json({ error: 'Failed to update ticket status' });
  }
}

/**
 * Get tickets for a pack
 * GET /ticket-instances?packId=xxx
 */
export async function getTicketsForPack(req: AuthRequest, res: Response) {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { packId } = req.query;

    if (!packId || typeof packId !== 'string') {
      return res.status(400).json({ error: 'Missing required query param: packId' });
    }

    const result = await TicketPackService.getPackWithTickets(packId);

    if (!result.pack) {
      return res.status(404).json({ error: 'Ticket pack not found' });
    }

    // Compute system-level completion
    const systemCompletion = TicketPackService.computeSystemCompletion(result.tickets);

    return res.json({
      pack: result.pack,
      tickets: result.tickets,
      systemCompletion,
    });
  } catch (error) {
    console.error('[TicketInstance] Error fetching tickets:', error);
    return res.status(500).json({ error: 'Failed to fetch tickets' });
  }
}
