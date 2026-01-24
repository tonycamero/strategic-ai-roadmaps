import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';

export async function getDiagnosticTickets(req: AuthRequest, res: Response) {
    return res.json({ tickets: [] });
}

export async function approveDiagnosticTickets(req: AuthRequest, res: Response) {
    return res.json({ ok: true });
}

export async function rejectDiagnosticTickets(req: AuthRequest, res: Response) {
    return res.json({ ok: true });
}
