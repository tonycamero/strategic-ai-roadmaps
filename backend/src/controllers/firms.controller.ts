import { Response } from 'express';
import { db } from '../db/index';
import { tenants } from '../db/schema';
import { asc } from 'drizzle-orm';
import type { AuthRequest } from '../middleware/auth';

/**
 * GET /api/firms
 * EXEC-TICKET-075-A: List all tenant firms for SA tenant browser.
 * Restricted to superadmin role only.
 */
export async function listFirms(req: AuthRequest, res: Response) {
  try {
    const rows = await db
      .select({
        id:        tenants.id,
        name:      tenants.name,
        status:    tenants.status,
        createdAt: tenants.createdAt,
      })
      .from(tenants)
      .orderBy(asc(tenants.name));

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('[Firms] Failed to list firms:', error);
    return res.status(500).json({ error: 'Failed to retrieve firms.' });
  }
}
