import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth';
import { db } from '../db/index';
import { ticketInstances, ticketPacks } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * requireTicketAccess
 * IDOR protection for ticket instance routes.
 *
 * Rules:
 * - superadmin: allowed (no tenant scope required)
 * - non-superadmin: ticket instance must belong to req.tenantId via its ticketPack.tenantId
 */
export async function requireTicketAccess(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const ticketInstanceId = (req.params as any).ticketInstanceId as string | undefined;
    if (!ticketInstanceId) return res.status(400).json({ error: 'ticketInstanceId required' });

    // Superadmin bypass (explicitly allowed)
    if ((user.role as string) === 'superadmin') return next();

const tenantId =
  req.tenantId ||
  (user as any).tenantId ||
  (user as any).tenant?.id ||
  null;

if (!tenantId) return res.status(403).json({ error: 'Tenant scope not resolved' });

    // Resolve ticket instance -> ticket pack -> tenant
    const [row] = await db
      .select({
        ticketInstanceId: ticketInstances.id,
        ticketPackId: ticketInstances.ticketPackId,
        packTenantId: ticketPacks.tenantId,
      })
      .from(ticketInstances)
      .innerJoin(ticketPacks, eq(ticketInstances.ticketPackId, ticketPacks.id))
      .where(eq(ticketInstances.id, ticketInstanceId))
      .limit(1);

    if (!row) return res.status(404).json({ error: 'Ticket not found' });

    if (row.packTenantId !== tenantId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    return next();
  } catch (err) {
    console.error('[requireTicketAccess] error:', err);
    return res.status(500).json({ error: 'Failed to authorize ticket access' });
  }
}
