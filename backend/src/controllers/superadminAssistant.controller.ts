/**
 * SuperAdmin Assistant Controller
 * 
 * Allows superadmins to tap into any firm's Assistant as if they're part
 * of the leadership team. Creates separate threads with visibility control.
 */

import { Request, Response } from 'express';
import { queryAssistant, type ThreadVisibility } from '../services/assistantQuery.service.ts';
import { db } from '../db/index.ts';
import { tenants } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    [key: string]: any;
  };
}

export async function handleSuperadminAgentQuery(req: AuthRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'SuperAdmin access required' });
    }

    const { tenantId, roleType, message, visibility } = req.body as {
      tenantId: string;
      roleType?: 'owner' | 'ops' | 'tc' | 'agent_support';
      message: string;
      visibility?: ThreadVisibility;
    };

    if (!tenantId || !message) {
      return res.status(400).json({ error: 'tenantId and message are required' });
    }

    // Sanity check tenant exists
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const effectiveRoleType = roleType || 'owner';
    const visibilityOverride: ThreadVisibility = visibility || 'superadmin_only';

    console.log('[SuperadminAssistant] Tap-in query from:', {
      adminUserId: req.user.userId,
      tenantId,
      tenantName: tenant.name,
      roleType: effectiveRoleType,
      visibility: visibilityOverride,
    });

    const result = await queryAssistant({
      tenantId,
      message,
      actorUserId: req.user.userId,
      actorRole: 'superadmin',
      capabilityProfile: {
        persona: 'owner',
        canWriteTickets: true,
        canChangeRoadmap: true,
        canSeeCrossTenant: true,
      },
      visibilityOverride,
    });

    return res.json({
      reply: result.reply,
      runId: result.runId,
      threadId: result.threadId,
      tenantName: tenant.name,
    });
  } catch (err: any) {
    console.error('[SuperadminAssistant] Error in handleSuperadminAgentQuery:', err);
    return res.status(500).json({ 
      error: 'Failed to query agent as SuperAdmin',
      details: err.message 
    });
  }
}
