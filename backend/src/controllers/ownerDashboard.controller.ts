import { Request, Response } from 'express';
import { db } from '../db/index';
import { tenants, roadmaps, roadmapSections, roadmapOutcomes, implementationSnapshots, ticketPacks, ticketInstances, intakes, tenantDocuments, discoveryCallNotes, users, auditEvents } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { ImplementationMetricsService } from '../services/implementationMetrics.service';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    tenantId?: string | null;
  };
}

/**
 * Owner Dashboard - Role-Aware Dashboard Data
 * GET /api/dashboard/owner
 * Returns DashboardData format for OwnerDashboard/StaffDashboard components
 */
export async function getOwnerDashboard(req: AuthRequest, res: Response) {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Resolve tenant directly from token (or fallback to ownerUserId lookup)
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

    // Get owner user
    const ownerUser = await db.query.users.findFirst({
      where: eq(users.id, tenant.ownerUserId),
    });

    // Get team members (all users with same tenantId, excluding owner)
    const teamUsers = await db.query.users.findMany({
      where: eq(users.tenantId, tenantId),
    });
    const teamMembers = teamUsers.filter(u => u.id !== tenant.ownerUserId).map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt?.toISOString() || new Date().toISOString(),
    }));

    // Get intakes
    const allIntakes = await db
      .select()
      .from(intakes)
      .where(eq(intakes.tenantId, tenantId));

    const intakesWithUsers = await Promise.all(
      allIntakes.map(async (intake) => {
        const intakeUser = await db.query.users.findFirst({
          where: eq(users.id, intake.userId),
        });
        return {
          id: intake.id,
          role: intake.role,
          status: intake.status,
          answers: intake.answers || {},
          createdAt: intake.createdAt?.toISOString() || new Date().toISOString(),
          completedAt: intake.completedAt?.toISOString() || null,
          userName: intakeUser?.name || 'Unknown',
          userEmail: intakeUser?.email || '',
        };
      })
    );

    // Get roadmaps
    const allRoadmaps = await db
      .select()
      .from(roadmaps)
      .where(eq(roadmaps.tenantId, tenantId));

    const roadmapData = allRoadmaps.map(rm => ({
      id: rm.id,
      tenantId: rm.tenantId,
      pdfUrl: rm.pdfUrl || null,
      status: rm.status,
      pilotStage: rm.pilotStage || null,
      deliveredAt: rm.deliveredAt?.toISOString() || null,
      createdAt: rm.createdAt?.toISOString() || new Date().toISOString(),
    }));

    // Roadmap stats
    const roadmapStats = {
      total: allRoadmaps.length,
      delivered: allRoadmaps.filter(r => r.status === 'delivered').length,
      draft: allRoadmaps.filter(r => r.status === 'draft').length,
    };

    // Document summary
    const allDocs = await db
      .select()
      .from(tenantDocuments)
      .where(eq(tenantDocuments.tenantId, tenant.id));

    const documentSummary: Record<string, number> = {};
    allDocs.forEach(doc => {
      const category = doc.category || 'other';
      documentSummary[category] = (documentSummary[category] || 0) + 1;
    });

    // Activity summary
    const activitySummary = {
      intakeStarted: allIntakes.length,
      intakeCompleted: allIntakes.filter(i => i.status === 'completed').length,
      roadmapCreated: allRoadmaps.length,
      roadmapDelivered: allRoadmaps.filter(r => r.status === 'delivered').length,
      lastActivityAt: allIntakes[0]?.createdAt?.toISOString() || null,
    };

    // Onboarding summary (simple calculation)
    const totalPoints = allIntakes.filter(i => i.status === 'completed').length;
    const maxPoints = 4; // owner, ops, sales, delivery
    const onboardingSummary = {
      percentComplete: maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0,
      totalPoints,
      maxPoints,
    };

    // Recent activity (audit events)
    const recentEvents = await db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.tenantId, tenant.id))
      .orderBy(desc(auditEvents.createdAt))
      .limit(10);

    const recentActivity = await Promise.all(
      recentEvents.map(async (evt) => {
        let actor = null;
        if (evt.actorUserId) {
          actor = await db.query.users.findFirst({
            where: eq(users.id, evt.actorUserId),
          });
        }
        return {
          id: evt.id,
          eventType: evt.eventType,
          entityType: evt.entityType || null,
          entityId: evt.entityId || null,
          metadata: evt.metadata || {},
          createdAt: evt.createdAt?.toISOString() || new Date().toISOString(),
          actorName: actor?.name || 'System',
          actorRole: actor?.role || null,
        };
      })
    );

    // Assemble DashboardData response
    return res.json({
      tenantSummary: {
        id: tenant.id,
        name: tenant.name,
        cohortLabel: tenant.cohortLabel || null,
        segment: tenant.segment || null,
        region: tenant.region || null,
        status: tenant.status || 'active',
        businessType: tenant.businessType || 'default',
        teamHeadcount: tenant.teamHeadcount || null,
        baselineMonthlyLeads: tenant.baselineMonthlyLeads || null,
        firmSizeTier: tenant.firmSizeTier || null,
        createdAt: tenant.createdAt?.toISOString() || new Date().toISOString(),
        notes: tenant.notes || null,
        lastDiagnosticId: null, // TODO: wire up if you have diagnostics
      },
      owner: ownerUser
        ? {
            id: ownerUser.id,
            name: ownerUser.name,
            email: ownerUser.email,
            role: ownerUser.role,
            createdAt: ownerUser.createdAt?.toISOString() || new Date().toISOString(),
          }
        : null,
      teamMembers,
      onboardingSummary,
      activitySummary,
      roadmapStats,
      documentSummary,
      intakes: intakesWithUsers,
      roadmaps: roadmapData,
      recentActivity,
    });
  } catch (error) {
    console.error('[OwnerDashboard] Error:', error);
    return res.status(500).json({ error: 'Failed to load dashboard' });
  }
}

/**
 * Owner Transformation Dashboard - EPIC 3 F3.2
 * GET /api/dashboard/owner/transformation
 * Returns metrics data for transformation visualization
 */
export async function getOwnerTransformation(req: AuthRequest, res: Response) {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Resolve tenant
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

    // Get roadmap
    const roadmap = await db.query.roadmaps.findFirst({
      where: eq(roadmaps.tenantId, tenantId),
    });

    if (!roadmap) {
      return res.status(404).json({ 
        error: 'No roadmap found',
        emptyState: true,
      });
    }

    // Get outcome with snapshots
    const outcome = await db.query.roadmapOutcomes.findFirst({
      where: and(
        eq(roadmapOutcomes.tenantId, tenant.id),
        eq(roadmapOutcomes.roadmapId, roadmap.id)
      ),
      orderBy: [desc(roadmapOutcomes.createdAt)],
    });

    if (!outcome) {
      return res.json({
        tenant: { 
          id: tenant.id, 
          name: tenant.name,
          businessType: tenant.businessType || 'default',
        },
        roadmap: { id: roadmap.id },
        hasMetrics: false,
        message: 'No metrics data available yet',
      });
    }

    // Fetch all snapshots
    const snapshotIds = [
      outcome.baselineSnapshotId,
      outcome.at30dSnapshotId,
      outcome.at60dSnapshotId,
      outcome.at90dSnapshotId,
    ].filter(Boolean);

    const snapshots = await db
      .select()
      .from(implementationSnapshots)
      .where(and(
        eq(implementationSnapshots.tenantId, tenant.id),
        eq(implementationSnapshots.roadmapId, roadmap.id)
      ));

    const snapshotMap = Object.fromEntries(
      snapshots.map(s => [s.id, s])
    );

    const baseline = outcome.baselineSnapshotId ? snapshotMap[outcome.baselineSnapshotId] : null;
    const at30d = outcome.at30dSnapshotId ? snapshotMap[outcome.at30dSnapshotId] : null;
    const at60d = outcome.at60dSnapshotId ? snapshotMap[outcome.at60dSnapshotId] : null;
    const at90d = outcome.at90dSnapshotId ? snapshotMap[outcome.at90dSnapshotId] : null;

    // Build time series data for charts (day 0, 30, 60, 90)
    const timeSeries = [
      { day: 0, label: 'baseline', snapshot: baseline },
      { day: 30, label: '30d', snapshot: at30d },
      { day: 60, label: '60d', snapshot: at60d },
      { day: 90, label: '90d', snapshot: at90d },
    ].filter(t => t.snapshot !== null);

    // Extract ROI from realizedRoi JSON field
    const roi = outcome.realizedRoi || {};

    return res.json({
      tenant: { 
        id: tenant.id, 
        name: tenant.name,
        businessType: tenant.businessType || 'default',
      },
      roadmap: { id: roadmap.id },
      hasMetrics: true,
      outcome: {
        id: outcome.id,
        netRoiPercent: roi.net_roi_percent || null,
        timeSavingsHours: roi.time_savings_hours_annual || null,
        timeSavingsValue: roi.time_savings_value_annual || null,
        revenueImpact: roi.revenue_impact_annual || null,
        costAvoidance: roi.cost_avoidance_annual || null,
        createdAt: outcome.createdAt,
      },
      snapshots: {
        baseline,
        at30d,
        at60d,
        at90d,
      },
      timeSeries,
    });
  } catch (error) {
    console.error('[OwnerTransformation] Error:', error);
    return res.status(500).json({ error: 'Failed to load transformation metrics' });
  }
}

/**
 * Helper function to get or create roadmap for tenant
 */
async function getOrCreateRoadmapForTenant(tenantId: string, createdByUserId: string) {
  let roadmap = await db.query.roadmaps.findFirst({
    where: eq(roadmaps.tenantId, tenantId),
  });

  if (!roadmap) {
    const [newRoadmap] = await db
      .insert(roadmaps)
      .values({
        tenantId,
        createdByUserId,
        status: 'draft',
        modelJson: {},      // REQUIRED
        sourceRefs: [],     // REQUIRED
      })
      .returning();
    roadmap = newRoadmap;
  }

  return roadmap;
}

/**
 * Helper function to get tenant
 */
async function getTenantById(tenantId: string) {
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  return tenant;
}

/**
 * Owner ROI: Create Baseline Snapshot
 * POST /api/dashboard/owner/roi/baseline
 */
export async function createOwnerBaselineSnapshot(req: AuthRequest, res: Response) {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { metrics, source = 'manual' } = req.body;

    const tenantId = (req as any).tenantId;
    if (!tenantId) {
      return res.status(403).json({ error: 'Tenant not resolved' });
    }
    const tenant = await getTenantById(tenantId);
    const roadmap = await getOrCreateRoadmapForTenant(tenantId, user.userId);

    const result = await ImplementationMetricsService.createBaselineSnapshot(
      tenant.id,
      roadmap.id,
      metrics,
      source
    );

    return res.json({ ok: true, ...result });
  } catch (error: any) {
    console.error('[OwnerROI] Create baseline error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create baseline' });
  }
}

/**
 * Owner ROI: Create Time Snapshot (30d, 60d, 90d)
 * POST /api/dashboard/owner/roi/snapshot
 */
export async function createOwnerTimeSnapshot(req: AuthRequest, res: Response) {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { label, metrics, source = 'manual' } = req.body;

    if (!['30d', '60d', '90d', 'custom'].includes(label)) {
      return res.status(400).json({ error: 'Invalid label. Must be 30d, 60d, 90d, or custom' });
    }

    const tenantId = (req as any).tenantId;
    if (!tenantId) {
      return res.status(403).json({ error: 'Tenant not resolved' });
    }
    const tenant = await getTenantById(tenantId);
    const roadmap = await getOrCreateRoadmapForTenant(tenantId, user.userId);

    const result = await ImplementationMetricsService.createTimeSnapshot(
      tenant.id,
      roadmap.id,
      label,
      metrics,
      source
    );

    return res.json({ ok: true, ...result });
  } catch (error: any) {
    console.error('[OwnerROI] Create snapshot error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create snapshot' });
  }
}

/**
 * Owner ROI: Compute Outcome (Deltas + ROI)
 * POST /api/dashboard/owner/roi/compute-outcome
 */
export async function computeOwnerOutcome(req: AuthRequest, res: Response) {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { assumptions } = req.body;

    const tenantId = (req as any).tenantId;
    if (!tenantId) {
      return res.status(403).json({ error: 'Tenant not resolved' });
    }
    const tenant = await getTenantById(tenantId);
    const roadmap = await getOrCreateRoadmapForTenant(tenantId, user.userId);

    const outcome = await ImplementationMetricsService.createOutcomeForRoadmap({
      tenantId: tenant.id,
      roadmapId: roadmap.id,
      assumptions,
    });

    return res.json({ ok: true, outcome });
  } catch (error: any) {
    console.error('[OwnerROI] Compute outcome error:', error);
    return res.status(500).json({ error: error.message || 'Failed to compute outcome' });
  }
}
