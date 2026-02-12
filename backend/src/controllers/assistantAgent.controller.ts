/**
 * Assistant Agent Controller (Owner/Team)
 * 
 * LEGACY - Section Assistant implementation
 * Handles queries from logged-in users (owner/team) to their firm's Assistant.
 * Uses capability profiles instead of interaction modes.
 * 
 * NOT USED IN PRODUCTION V1 - Replaced by roadmapQnA.controller.ts
 * Kept for potential future editor/writing mode where section-specific
 * context and editing capabilities would be useful.
 */

import { Request, Response } from 'express';
import { queryAssistant } from '../services/assistantQuery.service.ts';
import { computeCapabilityProfile } from '../shared/types/capability-profile.ts';
import { db } from '../db/index.ts';
import { tenants } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    ownerId: string;
    [key: string]: any;
  };
}

export async function handleOwnerAgentQuery(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = req.user;

    // Ensure user has required fields
    if (!user.userId || !user.tenantId) {
      return res.status(400).json({ error: 'Invalid user data' });
    }

    // Get tenant from user's tenantId
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, user.tenantId),
    });

    if (!tenant) {
      return res.status(400).json({ error: 'Tenant not found for this user' });
    }

    const { message, context } = req.body as {
      message: string;
      context?: { roadmapSection?: string };
    };

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Compute capability profile from user's role
    const capabilityProfile = computeCapabilityProfile(
      user.role,
      tenant.id,
      { route: req.path }
    );

    console.log('[AssistantAgent] Capability profile:', capabilityProfile);

    console.log('[AssistantAgent] Query from:', {
      userId: user.userId,
      tenantId: tenant.id,
      tenantName: tenant.name,
      role: user.role,
      persona: capabilityProfile.persona,
    });

    // Map database user role to v2 ActorRole
    const actorRole: 'owner' | 'team' | 'superadmin' = 
      user.role === 'superadmin' ? 'superadmin' :
      user.role === 'owner' ? 'owner' : 'team';

    // Prepend roadmap section context if provided
    let contextualMessage = message;
    if (context?.roadmapSection) {
      contextualMessage = `[User is viewing roadmap section: ${context.roadmapSection}]\n\n${message}`;
    }

    const result = await queryAssistant({
      tenantId: tenant.id,
      message: contextualMessage,
      actorUserId: user.userId,
      actorRole,
      capabilityProfile,
      context: context, // Pass context for StrategyContext builder
    });

    return res.json({
      reply: result.reply,
      runId: result.runId,
      threadId: result.threadId,
    });
  } catch (err: any) {
    console.error('[AssistantAgent] Error in handleOwnerAgentQuery:', err);
    return res.status(500).json({ 
      error: 'Failed to query agent',
      details: err.message 
    });
  }
}
