throw new Error('DECOMMISSIONED: diagnosticRerun.controller.ts must remain unreachable. Use superadmin.controller canonical flow.');
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';

/**
 * POST /api/superadmin/diagnostic/rerun/:tenantId
 * Legacy SOP-01 rerun endpoint.
 * DECOMMISSIONED: All diagnostic generation must route through AgentOrchestrator.
 */
export async function rerunSop01ForFirm(req: AuthRequest, res: Response) {
  console.log('[SOP-01 RERUN] Legacy handler called. Returning 410 GONE.');
  return res.status(410).json({
    code: 'GONE',
    message:
      'This legacy rerun endpoint has been decommissioned. Please use the canonical diagnostic generation flow.',
  });
}