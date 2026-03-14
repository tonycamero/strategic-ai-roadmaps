import { Request, Response } from 'express';
import { TrustAgentService, TrustAgentRole } from '../services/trustAgent.service';

interface AuthRequest extends Request {
  params: { tenantId: string };
  user?: {
    userId: string;
    role: string;
    isInternal: boolean;
    tenantId?: string;
  };
}

/**
 * TrustAgent Controller
 * 
 * Exposes the Organizational Intelligence Layer analysis.
 * Endpoint: GET /api/agent/analysis/:tenantId
 */
export const getAnalysis = async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = req.params;
    const currentUser = req.user;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    // Role mapping: Map platform roles to TrustAgent reasoning roles
    let trustRole: TrustAgentRole = 'Owner';
    if (currentUser?.role === 'manager' || currentUser?.role === 'admin') {
      trustRole = 'Operations';
    } else if (currentUser?.role === 'sales') {
      trustRole = 'Sales';
    } else if (currentUser?.role === 'executor') {
      trustRole = 'Delivery';
    }

    // Authorization checks (reusing snapshot logic)
    const isInternalConsultant =
      currentUser?.isInternal &&
      ['superadmin', 'delegate'].includes(currentUser.role);

    const isTenantMember =
       currentUser?.tenantId === tenantId;

    if (!isInternalConsultant && !isTenantMember) {
      return res.status(403).json({ error: 'Agent analysis access restricted.' });
    }

    // === EXECUTION: CONSTRAINT INTERPRETER ===
    const analysis = await TrustAgentService.analyzeTenant(tenantId, trustRole);

    return res.status(200).json({
      success: true,
      data: analysis
    });

  } catch (error: any) {
    console.error('[TrustAgent] Analysis error:', error);
    
    // Fail-closed with diagnostic context
    return res.status(500).json({
      error: 'Internal Server Error',
      details: error.message || 'Failed to generate organizational intelligence.'
    });
  }
};
