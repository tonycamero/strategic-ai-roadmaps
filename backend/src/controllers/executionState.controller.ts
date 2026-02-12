import { Request, Response } from 'express';
import { getExecutionState } from '../services/executionState.service.ts';

/**
 * GET /api/superadmin/execution/:tenantId/:diagnosticId
 * Returns aggregated execution state for operator panel
 */
export async function getExecutionStateController(req: Request, res: Response) {
    try {
        const { tenantId, diagnosticId } = req.params;

        if (!tenantId || !diagnosticId) {
            return res.status(400).json({
                error: 'tenantId and diagnosticId are required'
            });
        }

        const state = await getExecutionState({ tenantId, diagnosticId });

        res.json(state);
    } catch (error: any) {
        console.error('[getExecutionState] Error:', error);
        res.status(500).json({
            error: error.message || 'Failed to retrieve execution state'
        });
    }
}
