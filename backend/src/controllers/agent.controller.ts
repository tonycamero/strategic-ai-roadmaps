import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { TrustAgentService } from '../services/trustAgent.service';

export async function handleAgentQuery(req: AuthRequest, res: Response) {
  try {
    const { question, tenantId, role, consoleContext } = req.body;

    // Validate input
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required and must be a string' });
    }

    // Determine tenantId from body or user context
    const effectiveTenantId = tenantId || req.user?.tenantId;
    
    if (!effectiveTenantId) {
      return res.status(400).json({ error: 'Tenant context missing' });
    }

    // Determine role (for reasoning adaptive narrative)
    const effectiveRole = role || req.user?.role || 'Owner';

    console.log('[Agent Controller] Processing grounded query:', { 
      question, 
      user: req.user?.userId, 
      tenantId: effectiveTenantId,
      role: effectiveRole 
    });

    // Query the grounded TrustAgent
    const reply = await TrustAgentService.query(effectiveTenantId, effectiveRole, question, consoleContext);

    res.json({ reply });
  } catch (error) {
    console.error('[Agent Controller] Error:', error);
    res.status(500).json({ error: 'Agent query failed. Please try again.' });
  }
}
