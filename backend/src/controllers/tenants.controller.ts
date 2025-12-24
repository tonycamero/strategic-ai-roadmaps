import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { db } from '../db';
import { tenants } from '../db/schema';
import { eq } from 'drizzle-orm';
import { OnboardingProgressService } from '../services/onboardingProgress.service';

const onboardingService = new OnboardingProgressService();

export async function getTenant(req: AuthRequest, res: Response) {
  try {
    console.log('[Tenant] getTenant called, user:', req.user);
    console.log('[Tenant] tenantId from middleware:', (req as any).tenantId);
    
    // Ensure user is authenticated
    if (!req.user) {
      console.log('[Tenant] No user in request, returning 401');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get tenant from middleware
    const tenantId = (req as any).tenantId;
    if (!tenantId) {
      return res.status(403).json({ error: 'Tenant not resolved' });
    }
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const response = {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        businessType: tenant.businessType || 'default',
        teamHeadcount: tenant.teamHeadcount,
        baselineMonthlyLeads: tenant.baselineMonthlyLeads,
        firmSizeTier: tenant.firmSizeTier,
        segment: tenant.segment,
        region: tenant.region,
      },
    };
    console.log('[Tenant] Returning tenant data:', response);
    return res.json(response);
  } catch (error) {
    console.error('[Tenant] Get error:', error);
    return res.status(500).json({ error: 'Failed to get tenant' });
  }
}

export async function updateBusinessType(req: AuthRequest, res: Response) {
  try {
    const { businessType } = req.body;

    // Validate businessType
    if (!businessType || !['default', 'chamber'].includes(businessType)) {
      return res.status(400).json({ error: 'Invalid businessType. Must be "default" or "chamber"' });
    }

    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get tenant from middleware
    const tenantId = (req as any).tenantId;
    if (!tenantId) {
      return res.status(403).json({ error: 'Tenant not resolved' });
    }
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Update tenant businessType
    const [updatedTenant] = await db
      .update(tenants)
      .set({
        businessType,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, tenant.id))
      .returning();

    // Mark onboarding step as complete if applicable
    try {
      await onboardingService.markStep(tenant.id, 'ORGANIZATION_TYPE', 'COMPLETED');
      console.log(`[BusinessType] Marked ORGANIZATION_TYPE step as completed for tenant ${tenant.id}`);
    } catch (onboardingError) {
      console.error('[BusinessType] Failed to update onboarding progress:', onboardingError);
      // Don't fail the request if onboarding update fails
    }

    return res.json({
      success: true,
      tenant: {
        id: updatedTenant.id,
        businessType: updatedTenant.businessType,
      },
    });
  } catch (error) {
    console.error('[BusinessType] Update error:', error);
    return res.status(500).json({ error: 'Failed to update business type' });
  }
}

export async function updateBusinessProfile(req: AuthRequest, res: Response) {
  try {
    const {
      name,
      teamHeadcount,
      baselineMonthlyLeads,
      firmSizeTier,
      segment,
      region,
    } = req.body;

    // Validate required fields
    if (!name || teamHeadcount === undefined || baselineMonthlyLeads === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: name, teamHeadcount, baselineMonthlyLeads',
      });
    }

    // Validate field types and ranges
    if (typeof teamHeadcount !== 'number' || teamHeadcount < 1) {
      return res.status(400).json({ error: 'teamHeadcount must be a positive number' });
    }

    if (typeof baselineMonthlyLeads !== 'number' || baselineMonthlyLeads < 0) {
      return res.status(400).json({ error: 'baselineMonthlyLeads must be a non-negative number' });
    }

    if (firmSizeTier && !['micro', 'small', 'mid', 'large'].includes(firmSizeTier)) {
      return res.status(400).json({ error: 'Invalid firmSizeTier value' });
    }

    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get tenant from middleware
    const tenantId = (req as any).tenantId;
    if (!tenantId) {
      return res.status(403).json({ error: 'Tenant not resolved' });
    }
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Update tenant
    const [updatedTenant] = await db
      .update(tenants)
      .set({
        name,
        teamHeadcount,
        baselineMonthlyLeads,
        firmSizeTier: firmSizeTier || tenant.firmSizeTier,
        segment: segment || tenant.segment,
        region: region || tenant.region,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, tenant.id))
      .returning();

    // Mark onboarding step as complete
    try {
      await onboardingService.markStep(tenant.id, 'BUSINESS_PROFILE', 'COMPLETED');
      console.log(`[BusinessProfile] Marked BUSINESS_PROFILE step as completed for tenant ${tenant.id}`);
    } catch (onboardingError) {
      console.error('[BusinessProfile] Failed to update onboarding progress:', onboardingError);
      // Don't fail the request if onboarding update fails
    }

    return res.json({
      success: true,
      tenant: {
        id: updatedTenant.id,
        name: updatedTenant.name,
        teamHeadcount: updatedTenant.teamHeadcount,
        baselineMonthlyLeads: updatedTenant.baselineMonthlyLeads,
        firmSizeTier: updatedTenant.firmSizeTier,
        segment: updatedTenant.segment,
        region: updatedTenant.region,
      },
    });
  } catch (error) {
    console.error('[BusinessProfile] Update error:', error);
    return res.status(500).json({ error: 'Failed to update business profile' });
  }
}
