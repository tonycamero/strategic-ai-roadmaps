import { Request, Response } from 'express';
import { resolveTenantLifecycleSnapshot } from '../services/tenantStateAggregation.service';

interface AuthRequest extends Request {
  params: { tenantId: string };
  user?: {
    userId: string;
    role: string;
    isInternal: boolean;
    tenantId?: string;
  };
}

export const getTenantSnapshot = async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = req.params;
    const currentUser = req.user;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    // Authority boundary is enforced by requireTenantAccess() middleware.
    // Any user who reaches this point has already been validated.
    // SuperAdmin may inspect any tenant; tenant roles may only access their own.
    // No secondary role check needed here — middleware is the single authority boundary.

    // === CANONICAL LIFECYCLE RESOLVER ===
    const snapshot = await resolveTenantLifecycleSnapshot(tenantId, currentUser?.userId);

    return res.status(200).json({
      success: true,
      data: snapshot
    });

  } catch (error) {
    console.error('[Snapshot] Unhandled error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      details: 'Failed to generate snapshot.'
    });
  }
};