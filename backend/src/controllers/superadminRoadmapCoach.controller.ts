/**
 * Superadmin Roadmap Coach Controller
 * 
 * Sandbox endpoint for testing StrategyContext and assistant behavior.
 * Allows overriding context for demos and debugging.
 */

import { Request, Response } from 'express';
import { buildStrategyContext } from '../services/strategyContextBuilder.service.ts';
import type { PersonaRole } from '../types/strategyContext.ts';

interface SandboxRequest extends Request {
  body: {
    tenantId: string;
    personaRole: PersonaRole;
    userMessage: string;
    strategyOverrides?: {
      objectives?: string[];
      roadmapSignals?: any;
      tacticalFrame?: any;
    };
  };
}

/**
 * POST /api/superadmin/roadmap-coach/sandbox
 * 
 * Test the roadmap coach with custom StrategyContext.
 */
export async function sandboxRoadmapCoach(req: SandboxRequest, res: Response) {
  try {
    const { tenantId, personaRole, userMessage, strategyOverrides } = req.body;

    if (!tenantId || !personaRole || !userMessage) {
      return res.status(400).json({
        error: 'Missing required fields: tenantId, personaRole, userMessage',
      });
    }

    // Build base StrategyContext
    const baseContext = await buildStrategyContext({
      tenantId,
      personaRole,
      objectivesOverride: strategyOverrides?.objectives,
    });

    // Merge with overrides
    const mergedContext = {
      ...baseContext,
      ...(strategyOverrides?.roadmapSignals && {
        roadmapSignals: {
          ...baseContext.roadmapSignals,
          ...strategyOverrides.roadmapSignals,
        },
      }),
      ...(strategyOverrides?.tacticalFrame && {
        tacticalFrame: {
          ...baseContext.tacticalFrame,
          ...strategyOverrides.tacticalFrame,
        },
      }),
    };

    // Format as JSON block (matches query service format)
    const contextBlock = [
      '[STRATEGY_CONTEXT]',
      JSON.stringify(mergedContext, null, 2),
      '[END_CONTEXT]',
      '',
      'User Message:',
      userMessage,
    ].join('\n');

    return res.json({
      success: true,
      strategyContext: mergedContext,
      formattedContext: contextBlock,
      message: 'Sandbox context generated. Use this to test assistant behavior.',
    });
  } catch (error: any) {
    console.error('[SandboxRoadmapCoach] Error:', error);
    return res.status(500).json({
      error: 'Failed to generate sandbox context',
      details: error.message,
    });
  }
}

/**
 * GET /api/superadmin/roadmap-coach/context/:tenantId
 * 
 * View current StrategyContext for a tenant.
 */
export async function getStrategyContextForTenant(req: Request, res: Response) {
  try {
    const { tenantId } = req.params;
    const { personaRole = 'owner' } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId required' });
    }

    const context = await buildStrategyContext({
      tenantId,
      personaRole: personaRole as PersonaRole,
    });

    return res.json({
      success: true,
      strategyContext: context,
    });
  } catch (error: any) {
    console.error('[GetStrategyContext] Error:', error);
    return res.status(500).json({
      error: 'Failed to get strategy context',
      details: error.message,
    });
  }
}
