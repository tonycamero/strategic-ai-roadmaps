import { Request, Response } from 'express';
import { db } from '../db/index.ts';
import { agentThreads, agentMessages, tenants, agentLogs, agentConfigs } from '../db/schema.ts';
import { eq, and, desc } from 'drizzle-orm';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    ownerUserId: string;
    tenantId?: string;
  };
}

/**
 * List agent threads for a tenant
 * GET /api/agents/threads?roleType=owner (optional filter)
 */
export async function listThreads(req: AuthRequest, res: Response) {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { roleType } = req.query;
    let tenantId: string;

    // SuperAdmin can specify tenantId
    if (user.role === 'superadmin' && req.query.tenantId) {
      tenantId = req.query.tenantId as string;
    } else {
      // Owner/team - resolve tenant from ownerId
      const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.ownerUserId, user.ownerUserId),
      });

      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      tenantId = tenant.id;
    }

    // Build query conditions
    const conditions = [eq(agentThreads.tenantId, tenantId)];

    if (roleType && typeof roleType === 'string') {
      conditions.push(eq(agentThreads.roleType, roleType));
    }

    // Fetch threads
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

    // Log access
    await db.insert(agentLogs).values({
      agentConfigId: null,
      eventType: 'threads_list',
      metadata: {
        tenantId,
        roleType: roleType || 'all',
        actorUserId: user.userId,
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
 * GET /api/agents/threads/:id/messages
 */
export async function getThreadMessages(req: AuthRequest, res: Response) {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Fetch thread
    const thread = await db.query.agentThreads.findFirst({
      where: eq(agentThreads.id, id),
    });

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    // Verify access (non-superadmin must own the tenant)
    if (user.role !== 'superadmin') {
      const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.ownerUserId, user.ownerUserId),
      });

      if (!tenant || tenant.id !== thread.tenantId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Fetch messages
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

    // Log access
    await db.insert(agentLogs).values({
      agentConfigId: thread.agentConfigId,
      eventType: 'messages_list',
      metadata: {
        threadId: thread.openaiThreadId,
        tenantId: thread.tenantId,
        roleType: thread.roleType,
        actorUserId: user.userId,
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
 * GET /api/agents/sync-status?tenantId=xxx (optional for superadmin)
 */
export async function getAgentSyncStatus(req: AuthRequest, res: Response) {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let tenantId: string;

    // SuperAdmin can specify tenantId
    if (user.role === 'superadmin' && req.query.tenantId) {
      tenantId = req.query.tenantId as string;
    } else {
      // Owner/team - resolve tenant from ownerId
      const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.ownerUserId, user.ownerUserId),
      });

      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      tenantId = tenant.id;
    }

    // Get all agent configs for this tenant
    const configs = await db.query.agentConfigs.findMany({
      where: eq(agentConfigs.tenantId, tenantId),
      orderBy: [desc(agentConfigs.lastProvisionedAt)],
    });

    if (configs.length === 0) {
      return res.json({ agents: [], lastSyncedAt: null });
    }

    // Get most recent provision timestamp
    const lastSyncedAt = configs[0].lastProvisionedAt;

    // Build agent status list
    const agents = configs.map(config => ({
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
