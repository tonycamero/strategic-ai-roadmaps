/**
 * Advisor Threads Controller
 * 
 * Allows owners to view SuperAdmin Tap-In threads marked as 'shared'
 */

import { Request, Response } from 'express';
import { db } from '../db';
import { tenants, agentThreads, agentMessages } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    tenantId: string;
  };
}

/**
 * List shared advisor threads for the owner's firm
 * GET /api/owner/advisor-threads
 */
export async function listSharedAdvisorThreads(req: AuthRequest, res: Response) {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get tenant from token
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, user.tenantId),
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Query shared superadmin threads for this tenant
    const threads = await db.query.agentThreads.findMany({
      where: and(
        eq(agentThreads.tenantId, tenant.id),
        eq(agentThreads.actorRole, 'superadmin'),
        eq(agentThreads.visibility, 'shared'),
      ),
      orderBy: [desc(agentThreads.lastActivityAt)],
    });

    // For each thread, get first assistant message as preview
    const threadsWithPreviews = await Promise.all(
      threads.map(async (thread) => {
        const messages = await db.query.agentMessages.findMany({
          where: eq(agentMessages.agentThreadId, thread.id),
          orderBy: [desc(agentMessages.createdAt)],
          limit: 5,
        });

        // Find first assistant message for preview
        const assistantMsg = messages.find(m => m.role === 'assistant');
        const preview = assistantMsg 
          ? assistantMsg.content.substring(0, 150) + (assistantMsg.content.length > 150 ? '...' : '')
          : 'Advisor note';

        return {
          id: thread.id,
          roleType: thread.roleType,
          createdAt: thread.createdAt.toISOString(),
          lastActivityAt: thread.lastActivityAt.toISOString(),
          preview,
        };
      })
    );

    return res.json({
      threads: threadsWithPreviews,
    });
  } catch (error) {
    console.error('[AdvisorThreads] Error listing shared threads:', error);
    return res.status(500).json({ error: 'Failed to load advisor threads' });
  }
}
