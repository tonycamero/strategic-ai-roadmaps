import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { approveTickets, rejectTickets, getTicketsForDiagnostic } from '../services/ticketModeration.service';

function requireSuperAdmin(req: AuthRequest, res: Response): boolean {
  if (!req.user || (req.user.role as string) !== 'superadmin') {
    res.status(403).json({ error: 'SuperAdmin access required' });
    return false;
  }
  return true;
}

export async function getDiagnosticTickets(req: AuthRequest, res: Response) {
    try {
        if (!requireSuperAdmin(req, res)) return;
        const { tenantId } = (req as any).params;
        const { diagnosticId } = (req as any).query;

        if (!diagnosticId) {
            return res.status(400).json({ error: 'diagnosticId required' });
        }

        const tickets = await getTicketsForDiagnostic(tenantId, diagnosticId as string);
        return res.json({ tickets });
    } catch (error: any) {
        console.error('[Moderation] getDiagnosticTickets failed:', error);
        return res.status(500).json({ error: 'FETCH_FAILED', message: error.message });
    }
}

export async function approveDiagnosticTickets(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;
    // tenantId is sent in the body by the frontend (route has no :tenantId segment)
    const { tenantId, ticketIds, adminNotes } = (req as any).body;

    const count = await approveTickets(
      tenantId,
      ticketIds,
      (req as any).user!.userId,
      adminNotes
    );

    return res.json({ approved: count });
  } catch (error: any) {
    console.error('[Moderation] approveDiagnosticTickets failed:', error);
    return res.status(500).json({ error: 'APPROVE_FAILED', message: error.message });
  }
}

export async function rejectDiagnosticTickets(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;
    // tenantId is sent in the body by the frontend (route has no :tenantId segment)
    const { tenantId, ticketIds, adminNotes } = (req as any).body;

    const count = await rejectTickets(
      tenantId,
      ticketIds,
      (req as any).user!.userId,
      adminNotes
    );

    return res.json({ rejected: count });
  } catch (error: any) {
    console.error('[Moderation] rejectDiagnosticTickets failed:', error);
    return res.status(500).json({ error: 'REJECT_FAILED', message: error.message });
  }
}
