/**
 * Agent Configuration Controller
 * 
 * HTTP handlers for agent config CRUD operations.
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.ts';
import {
  listConfigsForTenant,
  getConfigForTenantAndRole,
  updateConfig,
} from '../services/agentConfig.service.ts';

/**
 * GET /api/agents/configs/:tenantId
 * List all agent configs for a tenant
 */
export async function handleListConfigs(req: AuthRequest, res: Response) {
  try {
    const { tenantId } = req.params;

    // Auth: SuperAdmin can access any tenant, Owner only their own
    if (req.user?.role !== 'superadmin') {
      // TODO: Verify owner has access to this tenant
      // For now, just block non-superadmin
      return res.status(403).json({ error: 'Unauthorized: SuperAdmin access required' });
    }

    const configs = await listConfigsForTenant(tenantId);
    res.json({ configs });
  } catch (error) {
    console.error('[AgentConfig Controller] Error listing configs:', error);
    res.status(500).json({ error: 'Failed to list agent configs' });
  }
}

/**
 * GET /api/agents/configs/:tenantId/:roleType
 * Get a specific agent config
 */
export async function handleGetConfig(req: AuthRequest, res: Response) {
  try {
    const { tenantId, roleType } = req.params;

    // Auth: SuperAdmin can access any tenant, Owner only their own
    if (req.user?.role !== 'superadmin') {
      // TODO: Verify owner has access to this tenant
      return res.status(403).json({ error: 'Unauthorized: SuperAdmin access required' });
    }

    const config = await getConfigForTenantAndRole(tenantId, roleType);

    if (!config) {
      return res.status(404).json({ error: 'Agent config not found' });
    }

    res.json(config);
  } catch (error) {
    console.error('[AgentConfig Controller] Error getting config:', error);
    res.status(500).json({ error: 'Failed to get agent config' });
  }
}

/**
 * PUT /api/agents/configs/:id
 * Update an agent config (role-aware)
 */
export async function handleUpdateConfig(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const updated = await updateConfig(
      id,
      updates,
      req.user.role,
      req.user.userId
    );

    if (!updated) {
      return res.status(404).json({ error: 'Agent config not found' });
    }

    res.json(updated);
  } catch (error: any) {
    console.error('[AgentConfig Controller] Error updating config:', error);
    
    if (error.message?.includes('Unauthorized')) {
      return res.status(403).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to update agent config' });
  }
}
