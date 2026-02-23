import { Request, Response } from 'express';
import { queryAssistant, type ThreadVisibility } from '../services/assistantQuery.service';
import { db } from '../db/index';
import { tenants } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * SuperAdmin Assistant Controller
 *
 * Allows superadmins to query any tenant's assistant using a separate thread namespace
 * (visibility-controlled).
 *
 * SECURITY:
 * - Hard-checks superadmin role.
 * - Validates tenant exists.
 * - Does NOT attempt tenant-membership checks (superadmin is cross-tenant by definition).
 * - Uses req.user.userId from JWT (not caller-provided).
 */

type RoleType = 'owner' | 'ops' | 'tc' | 'agent_support';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email?: string;
    role: string;
    tenantId?: string | null;
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
      roleType?: RoleType;
      message: string;
      visibility?: ThreadVisibility;
    };

    if (!tenantId || typeof tenantId !== 'string') {
      return res.status(400).json({ error: 'tenantId is required' });
    }
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    });
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const effectiveRoleType: RoleType = roleType ?? 'owner';
    const visibilityOverride: ThreadVisibility = visibility ?? 'superadmin_only';

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
      // IMPORTANT: This is a capability override, not identity spoofing.
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
      details: err?.message ?? String(err),
    });
  }

}