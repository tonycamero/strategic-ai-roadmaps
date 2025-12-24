import { Response } from 'express';
import { queryAgent, AgentContext } from '../services/agent.service';
import { AuthRequest } from '../middleware/auth';
import { db } from '../db';
import { tenants, users } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function handleAgentQuery(req: AuthRequest, res: Response) {
  try {
    const { message, context } = req.body;

    // Validate input
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required and must be a string' });
    }

    // LEGACY ENDPOINT: SuperAdmin Console Only
    // Owner/team should use /api/assistant/query instead
    if (req.user?.role !== 'superadmin') {
      return res.status(403).json({ 
        error: 'This endpoint is for SuperAdmin console only. Owners should use the Roadmap Assistant chat.'
      });
    }

    // Get user details and tenant for context (from request)
    let firmId: string | undefined = context?.firm_id;
    let userName: string | undefined;
    let firmName: string | undefined;

    if (firmId) {
      const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, firmId),
      });
      if (tenant) {
        firmName = tenant.name;
        const owner = await db.query.users.findFirst({
          where: eq(users.id, tenant.ownerUserId),
        });
        userName = owner?.name;
      }
    }

    // Build agent context
    const agentContext: AgentContext = {
      user_id: req.user.userId,
      firm_id: firmId || context?.firm_id,
      role: req.user.role,
    };

    console.log('[Agent Controller] Processing query:', { 
      message, 
      user: req.user.userId, 
      userName,
      firmId,
      firmName,
      role: req.user.role 
    });

    // Query the agent
    const response = await queryAgent(message, agentContext);

    res.json({ response });
  } catch (error) {
    console.error('[Agent Controller] Error:', error);
    res.status(500).json({ error: 'Agent query failed. Please try again.' });
  }
}
