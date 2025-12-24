/**
 * Debug Logs Controller
 * 
 * Provides access to agent_logs for debugging infrastructure issues.
 * Restricted to superadmin or owner debugging their own tenant.
 */

import { Request, Response } from 'express';
import { db } from '../db';
import { agentLogs, agentConfigs } from '../db/schema';
import { and, eq, desc, gte } from 'drizzle-orm';

/**
 * GET /api/debug/logs
 * Query parameters:
 * - tenant: tenant ID to filter (optional for superadmin, required for others)
 * - eventType: filter by event type (optional)
 * - since: ISO timestamp to filter events after (optional)
 * - limit: max results (default 100, max 500)
 */
export async function getDebugLogs(req: Request, res: Response) {
  try {
    const { tenant: tenantId, eventType, since, limit = '100' } = req.query;
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Access control: superadmin can view any tenant, owners can only view their own
    let targetTenantId = tenantId as string | undefined;

    if (user.role !== 'superadmin') {
      // Non-superadmin must filter by their own tenant
      targetTenantId = user.ownerId;
      
      if (tenantId && tenantId !== targetTenantId) {
        return res.status(403).json({ error: 'Access denied: can only view logs for your own tenant' });
      }
    }

    if (!targetTenantId) {
      return res.status(400).json({ error: 'tenant parameter required' });
    }

    // Build query conditions
    const conditions: any[] = [];

    // Get agent configs for this tenant to filter logs
    const configs = await db.query.agentConfigs.findMany({
      where: eq(agentConfigs.tenantId, targetTenantId),
      columns: { id: true },
    });

    if (configs.length === 0) {
      return res.json({ logs: [], total: 0 });
    }

    const configIds = configs.map(c => c.id);

    // Filter by agent configs belonging to this tenant
    // Note: We'll need to use SQL for this since Drizzle doesn't have direct 'in' support
    // For now, fetch all logs and filter in memory (small dataset for pilots)

    if (eventType) {
      conditions.push(eq(agentLogs.eventType, eventType as string));
    }

    if (since) {
      const sinceDate = new Date(since as string);
      if (!isNaN(sinceDate.getTime())) {
        conditions.push(gte(agentLogs.createdAt, sinceDate));
      }
    }

    // Fetch logs
    const maxLimit = Math.min(parseInt(limit as string) || 100, 500);
    
    const allLogs = await db.query.agentLogs.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(agentLogs.createdAt)],
      limit: maxLimit * 2, // Fetch extra to filter by config IDs
    });

    // Filter by tenant's config IDs
    const filteredLogs = allLogs
      .filter(log => log.agentConfigId && configIds.includes(log.agentConfigId))
      .slice(0, maxLimit);

    // Log this debug access
    await db.insert(agentLogs).values({
      agentConfigId: configs[0].id, // Use first config as reference
      eventType: 'debug_logs_access',
      metadata: {
        accessedBy: user.id,
        accessedByRole: user.role,
        eventTypeFilter: eventType,
        resultCount: filteredLogs.length,
      },
    });

    return res.json({
      logs: filteredLogs,
      total: filteredLogs.length,
      tenantId: targetTenantId,
    });
  } catch (error: any) {
    console.error('[DebugLogs] Error fetching logs:', error);
    return res.status(500).json({ error: 'Failed to fetch logs' });
  }
}

/**
 * GET /api/debug/logs/types
 * Get available event types for filtering
 */
export async function getLogEventTypes(req: Request, res: Response) {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get distinct event types from recent logs
    const recentLogs = await db.query.agentLogs.findMany({
      orderBy: [desc(agentLogs.createdAt)],
      limit: 1000,
    });

    const eventTypes = [...new Set(recentLogs.map(log => log.eventType))].sort();

    return res.json({ eventTypes });
  } catch (error: any) {
    console.error('[DebugLogs] Error fetching event types:', error);
    return res.status(500).json({ error: 'Failed to fetch event types' });
  }
}
