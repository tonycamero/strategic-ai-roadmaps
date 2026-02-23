import { Response } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { db } from '../db/index';
import { agentThreads, agentMessages, agentLogs, agentConfigs } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';

function isUuid(val: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(val);
}

/**
 * Agent Thread Controller
 *
 * SECURITY HARDENING:
 * - Tenant scope normally derived from req.tenantId (set by requireTenantAccess / deriveAuthority)
 * - Superadmin may explicitly pivot via query.tenantId (UUID required)
 * - All object access validated against thread.tenantId (IDOR protection)
 */

function resolveEffectiveTenantId(req: AuthRequest): { tenantId: string | null; error?: string } {
  const user = req.user;
  if (!user) return { tenantId: null, error: 'Unauthorized' };

  // Default: token-derived scope
  let tenantId = req.tenantId || null;

  // Superadmin explicit pivot only (must be UUID)
  const pivot = (user.role === 'superadmin' && req.query?.tenantId)
    ? String(req.query.tenantId)
    : null;

  if (pivot) {
    if (!isUuid(pivot)) return { tenantId: null, error: 'Invalid tenantId (UUID expected)' };
    tenantId = pivot;
  }

  if (!tenantId) return { tenantId: null, error: 'Tenant scope not resolved' };
  return { tenantId };
}

/**
 * List agent threads for a tenant
 * GET /api/agents/threads?roleType=owner[&tenantId=UUID (superadmin only)]
 */
export async function listThreads(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { tenantId, error } = resolveEffectiveTenantId(req);
    if (!tenantId) {
      const status = error === 'Unauthorized' ? 401 : 403;
      return res.status(status).json({ error });
    }

    const roleType = req.query?.roleType;
    const conditions = [eq(agentThreads.tenantId, tenantId)];

    if (roleType && typeof roleType === 'string') {
      conditions.push(eq(agentThreads.roleType, roleType));
    }

    const threads = await db
      .select({
        id: agentThreads.id,
        roleType: agentThreads.roleType,
        actorRole: agentThreads.actorRole,
        actorUserId: agentThreads.actorUserId,
        visibility: agentThreads.visibility,
        lastActivityAt: agentThreads.lastActivityAt,
        createdAt: agentThreads.createdAt,
        openaiThreadId: agentThreads.openaiThreadId,
      })
      .from(agentThreads)
      .where(and(...conditions))
      .orderBy(desc(agentThreads.lastActivityAt));

    await db.insert(agentLogs).values({
      agentConfigId: null,
      eventType: 'threads_list',
      metadata: {
        tenantId,
        roleType: typeof roleType === 'string' ? roleType : 'all',
        actorUserId: user.userId,
        actorRole: user.role,
        threadsCount: threads.length,
      },
    });

    return res.json({ threads });
  } catch (error) {
    console.error('[AgentThread] Error listing threads:', error);
    return res.status(500).json({ error: 'Failed to list threads' });
  }
}

/**
 * Get messages for a specific thread
 * GET /api/agents/threads/:id/messages[?tenantId=UUID (superadmin pivot only)]
 */
export async function getThreadMessages(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Missing thread id' });

    const { tenantId: effectiveTenantId, error } = resolveEffectiveTenantId(req);
    if (!effectiveTenantId) {
      const status = error === 'Unauthorized' ? 401 : 403;
      return res.status(status).json({ error });
    }

    const thread = await db.query.agentThreads.findFirst({
      where: eq(agentThreads.id, id),
    });

    if (!thread) return res.status(404).json({ error: 'Thread not found' });

    // 🔒 IDOR protection: enforce tenant match (including superadmin unless pivot matches)
    if (thread.tenantId !== effectiveTenantId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await db
      .select({
        id: agentMessages.id,
        role: agentMessages.role,
        content: agentMessages.content,
        createdAt: agentMessages.createdAt,
      })
      .from(agentMessages)
      .where(eq(agentMessages.agentThreadId, id))
      .orderBy(agentMessages.createdAt);

    await db.insert(agentLogs).values({
      agentConfigId: thread.agentConfigId,
      eventType: 'messages_list',
      metadata: {
        threadId: thread.openaiThreadId,
        tenantId: thread.tenantId,
        roleType: thread.roleType,
        actorUserId: user.userId,
        actorRole: user.role,
        messagesCount: messages.length,
      },
    });

    return res.json({
      thread: {
        id: thread.id,
        roleType: thread.roleType,
        actorRole: thread.actorRole,
        lastActivityAt: thread.lastActivityAt,
      },
      messages,
    });
  } catch (error) {
    console.error('[AgentThread] Error fetching messages:', error);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
}

/**
 * Get agent sync status for current tenant
 * GET /api/agents/sync-status[?tenantId=UUID (superadmin pivot only)]
 */
export async function getAgentSyncStatus(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { tenantId, error } = resolveEffectiveTenantId(req);
    if (!tenantId) {
      const status = error === 'Unauthorized' ? 401 : 403;
      return res.status(status).json({ error });
    }

    const configs = await db.query.agentConfigs.findMany({
      where: eq(agentConfigs.tenantId, tenantId),
      orderBy: [desc(agentConfigs.lastProvisionedAt)],
    });

    if (configs.length === 0) {
      return res.json({ tenantId, agents: [], lastSyncedAt: null });
    }

    const lastSyncedAt = configs[0].lastProvisionedAt;

    const agents = configs.map((config) => ({
      agentType: config.agentType,
      lastProvisionedAt: config.lastProvisionedAt,
      vectorStoreId: config.openaiVectorStoreId,
      assistantId: config.openaiAssistantId,
      version: config.version,
      isActive: config.isActive,
    }));

    return res.json({
      tenantId,
      agents,
      lastSyncedAt,
    });
  } catch (error) {
    console.error('[AgentThread] Error fetching sync status:', error);
    return res.status(500).json({ error: 'Failed to fetch sync status' });
  }

}