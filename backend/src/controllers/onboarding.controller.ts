import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { onboardingProgressService } from '../services/onboardingProgress.service';
import { db } from '../db/index.ts';
import { tenants } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

/**
 * GET /api/tenants/:tenantId/onboarding
 * Fetch current onboarding state for a tenant
 */
export async function getOnboardingState(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { tenantId } = req.params;

    // Look up tenant by ID
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Verify authorization: user must be part of this tenant or superadmin
    const userTenantId = (req as any).tenantId;
    if (req.user.role !== 'superadmin' && userTenantId !== tenant.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const state = await onboardingProgressService.getState(tenant.id);
    return res.json(state);
  } catch (error) {
    console.error('Get onboarding state error:', error);
    return res.status(500).json({ error: 'Failed to fetch onboarding state' });
  }
}

/**
 * PATCH /api/tenants/:tenantId/onboarding/steps/:stepId
 * Update a specific step status (for manual testing or admin overrides)
 */
export async function updateStepStatus(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { tenantId, stepId } = req.params;
    const { status } = req.body;

    if (!status || !['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    // Verify tenant exists and user has access
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Verify authorization
    const userTenantId = (req as any).tenantId;
    if (req.user.role !== 'superadmin' && userTenantId !== tenant.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedState = await onboardingProgressService.markStep(
      tenantId,
      stepId as any,
      status
    );

    return res.json(updatedState);
  } catch (error) {
    console.error('Update step status error:', error);
    return res.status(500).json({ error: 'Failed to update step status' });
  }
}
