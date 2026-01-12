import { Response } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db';
import { users, intakes, tenants, roadmaps, auditEvents, tenantDocuments, discoveryCallNotes, roadmapSections, ticketPacks, ticketInstances, tenantMetricsDaily, webinarRegistrations, onboardingStates, implementationSnapshots, roadmapOutcomes, agentConfigs, agentThreads, webinarSettings, executiveBriefs } from '../db/schema';
import { eq, and, sql, count, desc, asc } from 'drizzle-orm';
import { AuthRequest } from '../middleware/auth';
import path from 'path';
import fs from 'fs/promises';
import { buildNormalizedIntakeContext } from '../services/intakeNormalizer';
import { generateSop01Outputs } from '../services/sop01Engine';
import { persistSop01OutputsForTenant } from '../services/sop01Persistence';
import { getLatestDiscoveryCallNotes, saveDiscoveryCallNotes } from '../services/discoveryCallService';
import { ingestDiagnostic } from '../services/diagnosticIngestion.service';
import type { DiagnosticMap } from '../types/diagnostic';
import { generateTicketPackForRoadmap } from '../services/ticketPackGenerator.service';
import { extractRoadmapMetadata } from '../services/roadmapMetadataExtractor.service';
import { ImplementationMetricsService } from '../services/implementationMetrics.service';
import { saveCaseStudy } from '../services/caseStudyExport.service';
import { getOrCreateRoadmapForTenant } from '../services/roadmapOs.service';
import { refreshVectorStoreContent } from '../services/tenantVectorStore.service';
import { getModerationStatus } from '../services/ticketModeration.service';

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// ============================================================================
// HELPER: Check SuperAdmin Permission
// ============================================================================

function requireSuperAdmin(req: AuthRequest, res: Response): boolean {
  if (!req.user || (req.user.role as string) !== 'superadmin') {
    res.status(403).json({ error: 'SuperAdmin access required' });
    return false;
  }
  return true;
}

/**
 * Authority check for Executive-only surfaces.
 * Maps roles to the Executive category.
 */
function requireExecutiveAuthority(req: AuthRequest, res: Response): boolean {
  const executiveRoles = ['superadmin', 'exec_sponsor', 'owner'];
  if (!req.user || !executiveRoles.includes(req.user.role as string)) {
    // Structural Gating: Return 404/Null to prevent inference of existence
    res.status(404).json({ error: 'Not Found' });
    return false;
  }
  return true;
}

// ============================================================================
// GET /api/superadmin/overview - Global Dashboard Stats
// ============================================================================

export async function getOverview(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;

    // Count total tenants
    const [{ totalFirms }] = await db
      .select({ totalFirms: count() })
      .from(tenants);

    // Count intake completions
    const [{ totalIntakes }] = await db
      .select({ totalIntakes: count() })
      .from(intakes);

    // Count tenants by status
    const statusStats = await db
      .select({
        status: tenants.status,
        count: count(),
      })
      .from(tenants)
      .groupBy(tenants.status);

    // Count roadmaps by status
    const roadmapStats = await db
      .select({
        status: roadmaps.status,
        count: count(),
      })
      .from(roadmaps)
      .groupBy(roadmaps.status);

    // Count roadmaps by pilot stage (exclude nulls)
    const pilotStats = await db
      .select({
        pilotStage: roadmaps.pilotStage,
        count: count(),
      })
      .from(roadmaps)
      .where(sql`${roadmaps.pilotStage} IS NOT NULL`)
      .groupBy(roadmaps.pilotStage);

    // Count by cohort
    const cohortStats = await db
      .select({
        cohortLabel: tenants.cohortLabel,
        count: count(),
      })
      .from(tenants)
      .where(sql`${tenants.cohortLabel} IS NOT NULL`)
      .groupBy(tenants.cohortLabel);

    return res.json({
      totalFirms: totalFirms || 0,
      totalIntakes: totalIntakes || 0,
      statusStats,
      roadmapStats,
      pilotStats,
      cohortStats,
    });
  } catch (error) {
    console.error('Get overview error:', error);
    return res.status(500).json({ error: 'Failed to fetch overview' });
  }
}

// ============================================================================
// GET /api/superadmin/tenants - Simple List for Dropdowns
// ============================================================================

export async function getTenants(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const tenantList = await db
      .select({
        id: tenants.id,
        name: tenants.name,
      })
      .from(tenants)
      .orderBy(asc(tenants.name));

    return res.json({ tenants: tenantList });
  } catch (error) {
    console.error('Get tenants error:', error);
    return res.status(500).json({ error: 'Failed to fetch tenants' });
  }
}

// ============================================================================
// GET /api/superadmin/roadmaps - List All Client Roadmaps
// ============================================================================

export async function getAllRoadmaps(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const { cohort, status, search } = req.query as {
      cohort?: string;
      status?: string;
      search?: string;
    };

    // Build where conditions
    const whereConditions = [];
    if (cohort) whereConditions.push(eq(tenants.cohortLabel, cohort));
    if (status) whereConditions.push(eq(roadmaps.status, status));
    if (search) whereConditions.push(sql`${tenants.name} ILIKE ${'%' + search + '%'}`);

    const rows = await db
      .select({
        id: roadmaps.id,
        tenantId: tenants.id,
        tenantName: tenants.name,
        cohortLabel: tenants.cohortLabel,
        segment: tenants.segment,
        region: tenants.region,
        status: roadmaps.status,
        pilotStage: roadmaps.pilotStage,
        createdAt: roadmaps.createdAt,
        deliveredAt: roadmaps.deliveredAt,
        pdfUrl: roadmaps.pdfUrl,
      })
      .from(roadmaps)
      .innerJoin(tenants, eq(roadmaps.tenantId, tenants.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(roadmaps.createdAt));

    return res.json({ roadmaps: rows });
  } catch (error) {
    console.error('Get all roadmaps error:', error);
    return res.status(500).json({ error: 'Failed to fetch roadmaps' });
  }
}

// ============================================================================
// GET /api/superadmin/firms - List All Firms with Lifecycle Data
// ============================================================================

export async function getFirms(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const cohortFilter = req.query.cohortLabel as string | undefined;

    // Base query for all tenants with owner info
    let query = db
      .select({
        tenantId: tenants.id,
        tenantName: tenants.name,
        cohortLabel: tenants.cohortLabel,
        segment: tenants.segment,
        region: tenants.region,
        status: tenants.status,
        notes: tenants.notes,
        tenantCreatedAt: tenants.createdAt,
        ownerUserId: users.id,
        ownerName: users.name,
        ownerEmail: users.email,
      })
      .from(tenants)
      .innerJoin(users, eq(tenants.ownerUserId, users.id));

    // Apply cohort filter if provided
    const allTenants = cohortFilter
      ? await query.where(eq(tenants.cohortLabel, cohortFilter))
      : await query;

    // For each tenant, get intake count
    const firmsWithStats = await Promise.all(
      allTenants.map(async (tenant) => {
        const [{ intakeCount }] = await db
          .select({ intakeCount: count() })
          .from(intakes)
          .where(eq(intakes.tenantId, tenant.tenantId));

        const [{ roadmapCount }] = await db
          .select({ roadmapCount: count() })
          .from(roadmaps)
          .where(eq(roadmaps.tenantId, tenant.tenantId));

        return {
          tenantId: tenant.tenantId,
          name: tenant.tenantName,
          ownerEmail: tenant.ownerEmail,
          cohortLabel: tenant.cohortLabel,
          segment: tenant.segment,
          region: tenant.region,
          status: tenant.status,
          intakeCount: intakeCount || 0,
          roadmapCount: roadmapCount || 0,
          createdAt: tenant.tenantCreatedAt,
        };
      })
    );

    return res.json({ firms: firmsWithStats });
  } catch (error) {
    console.error('Get firms error:', error);
    return res.status(500).json({ error: 'Failed to fetch firms' });
  }
}

// ============================================================================
// GET /api/superadmin/firms/:tenantId/client-context - Get Client Preview Context
// ============================================================================

export async function getClientContextForFirm(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const { tenantId } = req.params;

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const [owner] = await db
      .select()
      .from(users)
      .where(eq(users.id, tenant.ownerUserId))
      .limit(1);

    return res.json({
      tenantId: tenant.id,
      tenantName: tenant.name,
      cohortLabel: tenant.cohortLabel,
      segment: tenant.segment,
      region: tenant.region,
      ownerName: owner?.name || 'Owner',
      ownerEmail: owner?.email || '',
      ownerUserId: owner?.id,
    });
  } catch (error) {
    console.error('Get client context error:', error);
    return res.status(500).json({ error: 'Failed to fetch client context' });
  }
}

// ============================================================================
// GET /api/superadmin/firms/:tenantId/roadmap-sections - Get Roadmap Sections
// ============================================================================

export async function getRoadmapSectionsForFirm(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const { tenantId } = req.params;

    const [tenant] = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        cohortLabel: tenants.cohortLabel,
      })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const docs = await db
      .select()
      .from(tenantDocuments)
      .where(
        and(
          eq(tenantDocuments.tenantId, tenantId),
          eq(tenantDocuments.category, 'roadmap')
        )
      )
      .orderBy(asc(tenantDocuments.section));

    return res.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        cohortLabel: tenant.cohortLabel,
      },
      sections: docs.map((d) => ({
        id: d.id,
        title: d.title,
        section: d.section,
        description: d.description,
        createdAt: d.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get roadmap sections error:', error);
    return res.status(500).json({ error: 'Failed to fetch roadmap sections' });
  }
}

// ============================================================================
// POST /api/superadmin/firms/:tenantId/close-intake
// ============================================================================

export async function closeIntakeWindow(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;
    if (!requireExecutiveAuthority(req, res)) return;

    const { tenantId } = req.params;

    // Deterministic Snapshot ID
    const snapshotId = `intake_snap_${nanoid()}`;
    const closedAt = new Date();

    // 1. Freeze the Tenant State
    await db
      .update(tenants)
      .set({
        intakeWindowState: 'CLOSED',
        intakeSnapshotId: snapshotId,
        intakeClosedAt: closedAt,
      })
      .where(eq(tenants.id, tenantId));

    // 2. Audit Log (Critical for Authority Contract)
    await db.insert(auditEvents).values({
      tenantId,
      actorUserId: req.user?.id,
      actorRole: req.user?.role as string,
      eventType: 'intake_window_closed',
      entityType: 'tenant',
      entityId: tenantId,
      metadata: { snapshotId, closedAt },
    });

    return res.json({ ok: true, snapshotId, closedAt: closedAt.toISOString() });

  } catch (error) {
    console.error('Close intake window error:', error);
    return res.status(500).json({ error: 'Failed to close intake window' });
  }
}

// ============================================================================
// GET /api/superadmin/firms/:tenantId - Firm Detail
// ============================================================================

export async function getFirmDetail(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const { tenantId } = req.params;

    // Get tenant info with owner
    const [tenantData] = await db
      .select({
        tenantId: tenants.id,
        tenantName: tenants.name,
        cohortLabel: tenants.cohortLabel,
        segment: tenants.segment,
        region: tenants.region,
        status: tenants.status,
        businessType: tenants.businessType,
        teamHeadcount: tenants.teamHeadcount,
        baselineMonthlyLeads: tenants.baselineMonthlyLeads,
        firmSizeTier: tenants.firmSizeTier,
        notes: tenants.notes,
        lastDiagnosticId: tenants.lastDiagnosticId,
        intakeWindowState: tenants.intakeWindowState,
        intakeSnapshotId: tenants.intakeSnapshotId,
        intakeClosedAt: tenants.intakeClosedAt,
        tenantCreatedAt: tenants.createdAt,
        ownerUserId: users.id,
        ownerName: users.name,
        ownerEmail: users.email,
        ownerRole: users.role,
      })
      .from(tenants)
      .innerJoin(users, eq(tenants.ownerUserId, users.id))
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenantData) {
      return res.status(404).json({ error: 'Firm not found' });
    }

    // Get team members (all users in this tenant)
    const teamMembers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.tenantId, tenantId));

    // Separate owner from team
    const owner = teamMembers.find(u => u.id === tenantData.ownerUserId);
    const team = teamMembers.filter(u => u.id !== tenantData.ownerUserId);

    // Get intakes for this firm
    const firmIntakes = await db
      .select()
      .from(intakes)
      .innerJoin(users, eq(intakes.userId, users.id))
      .where(eq(intakes.tenantId, tenantId));

    const formattedIntakes = firmIntakes.map(row => ({
      id: row.intakes.id,
      role: row.intakes.role,
      status: row.intakes.status,
      answers: row.intakes.answers,
      createdAt: row.intakes.createdAt,
      completedAt: row.intakes.completedAt,
      userName: row.users.name,
      userEmail: row.users.email,
    }));

    // Get roadmaps for this firm
    const firmRoadmaps = await db
      .select()
      .from(roadmaps)
      .where(eq(roadmaps.tenantId, tenantId))
      .orderBy(desc(roadmaps.createdAt));

    const latestRoadmap = firmRoadmaps[0] || null;

    // Get onboarding state
    const [onboarding] = await db
      .select()
      .from(onboardingStates)
      .where(eq(onboardingStates.tenantId, tenantId))
      .limit(1);

    // Get aggregate metrics (last 30 days)
    const metricsRows = await db
      .select({
        intakeStarted: sql<number>`COALESCE(SUM(${tenantMetricsDaily.intakeStartedCount}), 0)`,
        intakeCompleted: sql<number>`COALESCE(SUM(${tenantMetricsDaily.intakeCompletedCount}), 0)`,
        roadmapCreated: sql<number>`COALESCE(SUM(${tenantMetricsDaily.roadmapCreatedCount}), 0)`,
        roadmapDelivered: sql<number>`COALESCE(SUM(${tenantMetricsDaily.roadmapDeliveredCount}), 0)`,
        lastActivityAt: sql<Date | null>`MAX(${tenantMetricsDaily.lastActivityAt})`,
      })
      .from(tenantMetricsDaily)
      .where(eq(tenantMetricsDaily.tenantId, tenantId));

    const aggregateMetrics = metricsRows[0] || {
      intakeStarted: 0,
      intakeCompleted: 0,
      roadmapCreated: 0,
      roadmapDelivered: 0,
      lastActivityAt: null,
    };

    // Roadmap stats
    const roadmapStats = {
      total: firmRoadmaps.length,
      delivered: firmRoadmaps.filter((r) => r.status === 'delivered').length,
      draft: firmRoadmaps.filter((r) => r.status !== 'delivered').length,
    };

    // Documents summary by category
    const docs = await db
      .select({
        category: tenantDocuments.category,
        count: sql<number>`COUNT(*)`,
      })
      .from(tenantDocuments)
      .where(eq(tenantDocuments.tenantId, tenantId))
      .groupBy(tenantDocuments.category);

    const documentSummary: Record<string, number> = {};
    for (const row of docs) {
      documentSummary[row.category] = Number(row.count);
    }

    // Get recent audit events
    const recentAudits = await db
      .select()
      .from(auditEvents)
      .leftJoin(users, eq(auditEvents.actorUserId, users.id))
      .where(eq(auditEvents.tenantId, tenantId))
      .orderBy(desc(auditEvents.createdAt))
      .limit(20);

    const formattedAudits = recentAudits.map(row => ({
      id: row.audit_events.id,
      eventType: row.audit_events.eventType,
      entityType: row.audit_events.entityType,
      entityId: row.audit_events.entityId,
      metadata: row.audit_events.metadata,
      createdAt: row.audit_events.createdAt,
      actorName: row.users?.name || 'System',
      actorRole: row.audit_events.actorRole,
    }));

    // GATING: Fetch diagnostic status (for Roadmap readiness)
    let diagnosticStatus = { total: 0, pending: 0, approved: 0, rejected: 0, readyForRoadmap: false };
    if (tenantData.lastDiagnosticId) {
      diagnosticStatus = await getModerationStatus(tenantId, tenantData.lastDiagnosticId);
    }

    return res.json({
      tenantSummary: {
        id: tenantData.tenantId,
        name: tenantData.tenantName,
        cohortLabel: tenantData.cohortLabel,
        segment: tenantData.segment,
        region: tenantData.region,
        status: tenantData.status,
        businessType: tenantData.businessType,
        teamHeadcount: tenantData.teamHeadcount,
        baselineMonthlyLeads: tenantData.baselineMonthlyLeads,
        firmSizeTier: tenantData.firmSizeTier,
        createdAt: tenantData.tenantCreatedAt,
        notes: tenantData.notes,
        notes: tenantData.notes,
        lastDiagnosticId: tenantData.lastDiagnosticId,
        intakeWindowState: tenantData.intakeWindowState,
        intakeSnapshotId: tenantData.intakeSnapshotId,
        intakeClosedAt: tenantData.intakeClosedAt,
      },
      diagnosticStatus, // Added for Ticket 5 gating
      owner: owner ? {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        role: owner.role,
        createdAt: owner.createdAt,
      } : null,
      teamMembers: team,
      onboardingSummary: onboarding ? {
        percentComplete: onboarding.percentComplete,
        totalPoints: onboarding.totalPoints,
        maxPoints: onboarding.maxPoints,
      } : null,
      activitySummary: {
        intakeStarted: Number(aggregateMetrics.intakeStarted) || 0,
        intakeCompleted: Number(aggregateMetrics.intakeCompleted) || 0,
        roadmapCreated: Number(aggregateMetrics.roadmapCreated) || 0,
        roadmapDelivered: Number(aggregateMetrics.roadmapDelivered) || 0,
        lastActivityAt: aggregateMetrics.lastActivityAt,
      },
      roadmapStats,
      documentSummary,
      intakes: formattedIntakes,
      roadmaps: firmRoadmaps,
      latestRoadmap, // Canonical source of truth
      recentActivity: formattedAudits,
    });
  } catch (error) {
    console.error('Get firm detail error:', error);
    return res.status(500).json({ error: 'Failed to fetch firm detail' });
  }
}

// ============================================================================
// GET /api/superadmin/firms/:tenantId/detail - Firm Detail V2 (Single Source of Truth)
// ============================================================================

export async function getFirmDetailV2(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const { tenantId } = req.params;

    // -----------------------------------------------------------------------
    // 1. Tenant + Owner
    // -----------------------------------------------------------------------
    const [tenantRow] = await db
      .select({
        tenantId: tenants.id,
        tenantName: tenants.name,
        cohortLabel: tenants.cohortLabel,
        segment: tenants.segment,
        region: tenants.region,
        status: tenants.status,
        businessType: tenants.businessType,
        teamHeadcount: tenants.teamHeadcount,
        baselineMonthlyLeads: tenants.baselineMonthlyLeads,
        firmSizeTier: tenants.firmSizeTier,
        notes: tenants.notes,
        lastDiagnosticId: tenants.lastDiagnosticId,
        discoveryComplete: tenants.discoveryComplete,
        tenantCreatedAt: tenants.createdAt,
        tenantUpdatedAt: tenants.updatedAt,
        ownerUserId: tenants.ownerUserId,
      })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenantRow) {
      return res.status(404).json({ error: 'Firm not found' });
    }

    const [owner] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, tenantRow.ownerUserId))
      .limit(1);

    // 2. ONBOARDING
    const [onboardingData] = await db
      .select()
      .from(onboardingStates)
      .where(eq(onboardingStates.tenantId, tenantId))
      .limit(1);

    // 3. ENGAGEMENT SUMMARY (last 30 days + lifetime)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const metricsLast30d = await db
      .select({
        intakeCompleted: sql<number>`COALESCE(SUM(${tenantMetricsDaily.intakeCompletedCount}), 0)`,
        roadmapsDelivered: sql<number>`COALESCE(SUM(${tenantMetricsDaily.roadmapDeliveredCount}), 0)`,
      })
      .from(tenantMetricsDaily)
      .where(
        and(
          eq(tenantMetricsDaily.tenantId, tenantId),
          sql`${tenantMetricsDaily.metricDate} >= ${thirtyDaysAgo.toISOString().split('T')[0]}`
        )
      );

    const metricsLifetime = await db
      .select({
        intakeCompleted: sql<number>`COALESCE(SUM(${tenantMetricsDaily.intakeCompletedCount}), 0)`,
        roadmapsDelivered: sql<number>`COALESCE(SUM(${tenantMetricsDaily.roadmapDeliveredCount}), 0)`,
      })
      .from(tenantMetricsDaily)
      .where(eq(tenantMetricsDaily.tenantId, tenantId));

    // 4. INTAKES (by role)
    const intakesData = await db
      .select({
        role: intakes.role,
        status: intakes.status,
        completedAt: intakes.completedAt,
      })
      .from(intakes)
      .where(eq(intakes.tenantId, tenantId));

    const intakesByRole: Record<string, { status: string; completedAt: Date | null } | null> = {
      owner: null,
      sales: null,
      ops: null,
      delivery: null,
    };

    intakesData.forEach((intake) => {
      if (['owner', 'sales', 'ops', 'delivery'].includes(intake.role)) {
        intakesByRole[intake.role] = {
          status: intake.status || 'not_started',
          completedAt: intake.completedAt,
        };
      }
    });

    // 5. DISCOVERY
    const [discoveryNote] = await db
      .select()
      .from(discoveryCallNotes)
      .where(eq(discoveryCallNotes.tenantId, tenantId))
      .orderBy(desc(discoveryCallNotes.createdAt))
      .limit(1);

    const summarySnippet = discoveryNote?.notes
      ? discoveryNote.notes.substring(0, 250) + (discoveryNote.notes.length > 250 ? '...' : '')
      : '';

    // 6. DIAGNOSTICS (SOP outputs)
    const sopOutputs = await db
      .select({
        id: tenantDocuments.id,
        title: tenantDocuments.title,
        createdAt: tenantDocuments.createdAt,
      })
      .from(tenantDocuments)
      .where(
        and(
          eq(tenantDocuments.tenantId, tenantId),
          eq(tenantDocuments.category, 'sop_output')
        )
      )
      .orderBy(desc(tenantDocuments.createdAt));

    // 7. ROADMAPS
    const roadmapsData = await db
      .select()
      .from(roadmaps)
      .where(eq(roadmaps.tenantId, tenantId))
      .orderBy(desc(roadmaps.createdAt));

    const lastRoadmap = roadmapsData[0] || null;

    // 8. TICKETS
    const [ticketPackData] = await db
      .select()
      .from(ticketPacks)
      .where(eq(ticketPacks.tenantId, tenantId))
      .orderBy(desc(ticketPacks.createdAt))
      .limit(1);

    let ticketInstData: any[] = [];
    let ticketsTotalsByStatus = { not_started: 0, in_progress: 0, blocked: 0, done: 0, skipped: 0 };

    if (ticketPackData) {
      ticketInstData = await db
        .select()
        .from(ticketInstances)
        .where(eq(ticketInstances.ticketPackId, ticketPackData.id));

      ticketInstData.forEach((ti) => {
        const status = ti.status as keyof typeof ticketsTotalsByStatus;
        if (ticketsTotalsByStatus[status] !== undefined) {
          ticketsTotalsByStatus[status]++;
        }
      });
    }

    // 9. IMPLEMENTATION SNAPSHOTS + OUTCOMES
    const baselineSnapshot = await db
      .select()
      .from(implementationSnapshots)
      .where(
        and(
          eq(implementationSnapshots.tenantId, tenantId),
          eq(implementationSnapshots.label, 'baseline')
        )
      )
      .orderBy(desc(implementationSnapshots.snapshotDate))
      .limit(1);

    const latestSnapshot = await db
      .select()
      .from(implementationSnapshots)
      .where(eq(implementationSnapshots.tenantId, tenantId))
      .orderBy(desc(implementationSnapshots.snapshotDate))
      .limit(1);

    const [outcomeData] = await db
      .select()
      .from(roadmapOutcomes)
      .where(eq(roadmapOutcomes.tenantId, tenantId))
      .orderBy(desc(roadmapOutcomes.createdAt))
      .limit(1);

    // 10. DOCUMENTS (categorized counts + recent)
    const documentsByCategory = await db
      .select({
        category: tenantDocuments.category,
        count: sql<number>`COUNT(*)`,
      })
      .from(tenantDocuments)
      .where(eq(tenantDocuments.tenantId, tenantId))
      .groupBy(tenantDocuments.category);

    const docTotalsByCategory: Record<string, number> = {};
    documentsByCategory.forEach((row) => {
      docTotalsByCategory[row.category] = Number(row.count);
    });

    const recentDocuments = await db
      .select({
        id: tenantDocuments.id,
        title: tenantDocuments.title,
        category: tenantDocuments.category,
        createdAt: tenantDocuments.createdAt,
      })
      .from(tenantDocuments)
      .where(eq(tenantDocuments.tenantId, tenantId))
      .orderBy(desc(tenantDocuments.createdAt))
      .limit(5);

    // 11. AGENTS (configs + threads)
    const agentConfigsData = await db
      .select({
        id: agentConfigs.id,
        agentType: agentConfigs.agentType,
        isActive: agentConfigs.isActive,
        lastProvisionedAt: agentConfigs.lastProvisionedAt,
      })
      .from(agentConfigs)
      .where(eq(agentConfigs.tenantId, tenantId));

    const activeConfigs = agentConfigsData.filter((c) => c.isActive).length;

    const agentThreadsData = await db
      .select({
        id: agentThreads.id,
        roleType: agentThreads.roleType,
        lastActivityAt: agentThreads.lastActivityAt,
      })
      .from(agentThreads)
      .where(eq(agentThreads.tenantId, tenantId))
      .orderBy(desc(agentThreads.lastActivityAt))
      .limit(10);

    // Assemble response
    const response = {
      tenant: {
        id: tenantRow.tenantId,
        name: tenantRow.tenantName,
        businessType: tenantRow.businessType,
        status: tenantRow.status,
        cohortLabel: tenantRow.cohortLabel,
        segment: tenantRow.segment,
        region: tenantRow.region,
        firmSizeTier: tenantRow.firmSizeTier,
        teamHeadcount: tenantRow.teamHeadcount,
        baselineMonthlyLeads: tenantRow.baselineMonthlyLeads,
        discoveryComplete: tenantRow.discoveryComplete,
        notes: tenantRow.notes,
        lastDiagnosticId: tenantRow.lastDiagnosticId,
        createdAt: tenantRow.tenantCreatedAt,
        updatedAt: tenantRow.tenantUpdatedAt,
        ownerUserId: tenantRow.ownerUserId,
      },
      // 12. EXECUTIVE BRIEF SIGNAL (STRUCTURAL ONLY)
      execBrief: await (async () => {
        const [brief] = await db
          .select({ status: executiveBriefs.status, id: executiveBriefs.id })
          .from(executiveBriefs)
          .where(sql`${executiveBriefs.tenantId} = ${tenantId}`)
          .limit(1);
        return brief ? { exists: true, status: brief.status } : { exists: false, status: null };
      })(),
      onboarding: onboardingData
        ? {
          percentComplete: onboardingData.percentComplete,
          totalPoints: onboardingData.totalPoints,
          maxPoints: onboardingData.maxPoints,
          steps: onboardingData.steps as any,
          badges: onboardingData.badges as any,
        }
        : null,
      engagementSummary: {
        last30d: {
          intakeCompleted: Number(metricsLast30d[0]?.intakeCompleted || 0),
          roadmapsDelivered: Number(metricsLast30d[0]?.roadmapsDelivered || 0),
        },
        lifetime: {
          intakeCompleted: Number(metricsLifetime[0]?.intakeCompleted || 0),
          roadmapsDelivered: Number(metricsLifetime[0]?.roadmapsDelivered || 0),
        },
      },
      intakes: {
        byRole: intakesByRole,
      },
      discovery: {
        hasDiscoveryNotes: !!discoveryNote,
        summarySnippet,
        lastUpdatedAt: discoveryNote?.updatedAt || null,
      },
      diagnostics: {
        sopOutputs,
      },
      roadmaps: {
        total: roadmapsData.length,
        lastRoadmap: lastRoadmap
          ? {
            id: lastRoadmap.id,
            status: lastRoadmap.status,
            deliveredAt: lastRoadmap.deliveredAt,
            createdAt: lastRoadmap.createdAt,
          }
          : null,
      },
      tickets: {
        hasTicketPack: !!ticketPackData,
        ticketPack: ticketPackData
          ? {
            id: ticketPackData.id,
            version: ticketPackData.version,
            status: ticketPackData.status,
            totalTickets: ticketPackData.totalTickets,
            totalSprints: ticketPackData.totalSprints,
            totalsByStatus: ticketsTotalsByStatus,
          }
          : null,
        instances: ticketInstData.slice(0, 10).map((ti) => ({
          id: ti.id,
          ticketId: ti.ticketId,
          status: ti.status,
          completedAt: ti.completedAt,
        })),
      },
      implementation: {
        baselineSnapshot: baselineSnapshot[0]
          ? {
            id: baselineSnapshot[0].id,
            snapshotDate: baselineSnapshot[0].snapshotDate,
            metrics: baselineSnapshot[0].metrics,
          }
          : null,
        latestSnapshot: latestSnapshot[0]
          ? {
            id: latestSnapshot[0].id,
            label: latestSnapshot[0].label,
            snapshotDate: latestSnapshot[0].snapshotDate,
            metrics: latestSnapshot[0].metrics,
          }
          : null,
        outcomes: outcomeData
          ? {
            id: outcomeData.id,
            status: outcomeData.status,
            deltas: outcomeData.deltas,
            realizedRoi: outcomeData.realizedRoi,
            updatedAt: outcomeData.updatedAt,
          }
          : null,
      },
      documents: {
        totalsByCategory: docTotalsByCategory,
        recent: recentDocuments,
      },
      agents: {
        totalConfigs: agentConfigsData.length,
        activeConfigs,
        recentThreads: agentThreadsData,
      },
      latestRoadmap: lastRoadmap, // Canonical source of truth
    };

    return res.json(response);
  } catch (error) {
    console.error('Get firm detail v2 error:', error);
    return res.status(500).json({ error: 'Failed to fetch firm detail v2' });
  }
}

// ============================================================================
// PATCH /api/superadmin/firms/:tenantId - Update Tenant
// ============================================================================

export async function updateFirmStatus(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const { tenantId } = req.params;
    const { name, cohortLabel, segment, region, status, notes } = req.body;

    const updates: any = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (cohortLabel !== undefined) updates.cohortLabel = cohortLabel;
    if (segment !== undefined) updates.segment = segment;
    if (region !== undefined) updates.region = region;
    if (status !== undefined) updates.status = status;
    if (notes !== undefined) updates.notes = notes;

    if (Object.keys(updates).length === 1) { // only updatedAt
      return res.status(400).json({ error: 'No updates provided' });
    }

    const [updated] = await db
      .update(tenants)
      .set(updates)
      .where(eq(tenants.id, tenantId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Firm not found' });
    }

    // Log audit event
    await db.insert(auditEvents).values({
      tenantId,
      actorUserId: req.user!.userId,
      actorRole: req.user!.role,
      eventType: 'TENANT_UPDATED',
      entityType: 'tenant',
      entityId: tenantId,
      metadata: { updates },
    });

    return res.json({ tenant: updated });
  } catch (error) {
    console.error('Update firm status error:', error);
    return res.status(500).json({ error: 'Failed to update firm status' });
  }
}

// ============================================================================
// GET /api/superadmin/export/intakes - Export All Intakes
// ============================================================================

export async function exportIntakes(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const format = (req.query.format as string) || 'json';
    const cohortFilter = req.query.cohortLabel as string | undefined;

    // Get all intakes with user and tenant info
    let query = db
      .select({
        intakeId: intakes.id,
        role: intakes.role,
        status: intakes.status,
        answers: intakes.answers,
        completedAt: intakes.completedAt,
        intakeCreatedAt: intakes.createdAt,
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        userRole: users.role,
        userCreatedAt: users.createdAt,
        tenantId: tenants.id,
        tenantName: tenants.name,
        cohortLabel: tenants.cohortLabel,
        segment: tenants.segment,
        region: tenants.region,
        tenantStatus: tenants.status,
        tenantCreatedAt: tenants.createdAt,
      })
      .from(intakes)
      .innerJoin(users, eq(intakes.userId, users.id))
      .innerJoin(tenants, eq(intakes.tenantId, tenants.id));

    const allIntakes = cohortFilter
      ? await query.where(eq(tenants.cohortLabel, cohortFilter))
      : await query;

    // Get team member counts for each tenant
    const tenantTeamCounts = new Map<string, number>();
    const uniqueTenantIds = [...new Set(allIntakes.map(i => i.tenantId))];

    for (const tid of uniqueTenantIds) {
      const [{ count: teamCount }] = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.tenantId, tid));

      tenantTeamCounts.set(tid, teamCount || 0);
    }

    // Log audit event
    await db.insert(auditEvents).values({
      tenantId: null,
      actorUserId: req.user!.userId,
      actorRole: req.user!.role,
      eventType: 'INTAKES_EXPORTED',
      entityType: 'intake',
      entityId: null,
      metadata: { format, cohortFilter, count: allIntakes.length },
    });

    if (format === 'csv') {
      // Flatten answers for CSV - get all unique question keys
      const allQuestionKeys = new Set<string>();
      allIntakes.forEach(intake => {
        if (intake.answers && typeof intake.answers === 'object') {
          Object.keys(intake.answers).forEach(key => allQuestionKeys.add(key));
        }
      });
      const questionKeysArray = Array.from(allQuestionKeys).sort();

      const csvRows: string[] = [];

      // Header row
      const headers = [
        'Intake ID',
        'Tenant Name',
        'Cohort',
        'Segment',
        'Region',
        'Tenant Status',
        'Tenant Created',
        'Team Size',
        'Team Member Name',
        'Team Member Email',
        'Team Member Role',
        'Team Member Joined',
        'Intake Role',
        'Intake Status',
        'Intake Started',
        'Intake Completed',
        ...questionKeysArray,
      ];
      csvRows.push(headers.join(','));

      // Data rows
      for (const intake of allIntakes) {
        const answers = intake.answers as Record<string, any> || {};
        const answerValues = questionKeysArray.map(key => {
          const val = answers[key];
          if (val === null || val === undefined) return '';
          const strVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
          return `"${strVal.replace(/"/g, '""')}"`;
        });

        csvRows.push([
          intake.intakeId,
          `"${intake.tenantName.replace(/"/g, '""')}"`,
          intake.cohortLabel || '',
          intake.segment || '',
          intake.region || '',
          intake.tenantStatus,
          new Date(intake.tenantCreatedAt).toISOString().split('T')[0],
          String(tenantTeamCounts.get(intake.tenantId) || 0),
          `"${intake.userName.replace(/"/g, '""')}"`,
          intake.userEmail,
          intake.userRole,
          new Date(intake.userCreatedAt).toISOString().split('T')[0],
          intake.role,
          intake.status || 'in_progress',
          new Date(intake.intakeCreatedAt).toISOString().split('T')[0],
          intake.completedAt ? new Date(intake.completedAt).toISOString().split('T')[0] : '',
          ...answerValues,
        ].join(','));
      }

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="intakes-export-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(csvRows.join('\n'));
    } else {
      // Return structured JSON with nice formatting
      const formattedIntakes = allIntakes.map(intake => ({
        intake: {
          id: intake.intakeId,
          role: intake.role,
          status: intake.status || 'in_progress',
          started: intake.intakeCreatedAt,
          completed: intake.completedAt,
          answers: intake.answers,
        },
        teamMember: {
          id: intake.userId,
          name: intake.userName,
          email: intake.userEmail,
          role: intake.userRole,
          joinedAt: intake.userCreatedAt,
        },
        tenant: {
          id: intake.tenantId,
          name: intake.tenantName,
          cohort: intake.cohortLabel,
          segment: intake.segment,
          region: intake.region,
          status: intake.tenantStatus,
          createdAt: intake.tenantCreatedAt,
          teamSize: tenantTeamCounts.get(intake.tenantId) || 0,
        },
      }));

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="intakes-export-${new Date().toISOString().split('T')[0]}.json"`);
      return res.json({
        exportedAt: new Date().toISOString(),
        totalIntakes: allIntakes.length,
        cohortFilter: cohortFilter || null,
        data: formattedIntakes,
      });
    }
  } catch (error) {
    console.error('Export intakes error:', error);
    return res.status(500).json({ error: 'Failed to export intakes' });
  }
}

// ============================================================================
// GET /api/superadmin/export/firms/:tenantId/intakes - Export Single Firm Intakes
// ============================================================================

export async function exportFirmIntakes(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const { tenantId } = req.params;
    const format = (req.query.format as string) || 'json';

    // Get tenant info with full details
    const [tenantData] = await db
      .select({
        tenantId: tenants.id,
        tenantName: tenants.name,
        ownerUserId: tenants.ownerUserId,
        cohortLabel: tenants.cohortLabel,
        segment: tenants.segment,
        region: tenants.region,
        status: tenants.status,
        createdAt: tenants.createdAt,
      })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenantData) {
      return res.status(404).json({ error: 'Firm not found' });
    }

    // Get all team members for this firm
    const teamMembers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.tenantId, tenantId));

    // Get intakes for this firm with user details
    const firmIntakes = await db
      .select({
        intakeId: intakes.id,
        role: intakes.role,
        status: intakes.status,
        answers: intakes.answers,
        completedAt: intakes.completedAt,
        intakeCreatedAt: intakes.createdAt,
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        userRole: users.role,
        userCreatedAt: users.createdAt,
      })
      .from(intakes)
      .innerJoin(users, eq(intakes.userId, users.id))
      .where(eq(intakes.tenantId, tenantId));

    // Log audit event
    await db.insert(auditEvents).values({
      tenantId,
      actorUserId: req.user!.userId,
      actorRole: req.user!.role,
      eventType: 'FIRM_INTAKES_EXPORTED',
      entityType: 'intake',
      entityId: null,
      metadata: { format, count: firmIntakes.length },
    });

    if (format === 'csv') {
      // Flatten answers for CSV - get all unique question keys
      const allQuestionKeys = new Set<string>();
      firmIntakes.forEach(intake => {
        if (intake.answers && typeof intake.answers === 'object') {
          Object.keys(intake.answers).forEach(key => allQuestionKeys.add(key));
        }
      });
      const questionKeysArray = Array.from(allQuestionKeys).sort();

      const csvRows: string[] = [];

      // Header row
      const headers = [
        'Intake ID',
        'Team Member Name',
        'Team Member Email',
        'Team Member Role',
        'Team Member Joined',
        'Intake Role',
        'Intake Status',
        'Intake Started',
        'Intake Completed',
        ...questionKeysArray,
      ];
      csvRows.push(headers.join(','));

      // Data rows
      for (const intake of firmIntakes) {
        const answers = intake.answers as Record<string, any> || {};
        const answerValues = questionKeysArray.map(key => {
          const val = answers[key];
          if (val === null || val === undefined) return '';
          const strVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
          return `"${strVal.replace(/"/g, '""')}"`;
        });

        csvRows.push([
          intake.intakeId,
          `"${intake.userName.replace(/"/g, '""')}"`,
          intake.userEmail,
          intake.userRole,
          new Date(intake.userCreatedAt).toISOString().split('T')[0],
          intake.role,
          intake.status || 'in_progress',
          new Date(intake.intakeCreatedAt).toISOString().split('T')[0],
          intake.completedAt ? new Date(intake.completedAt).toISOString().split('T')[0] : '',
          ...answerValues,
        ].join(','));
      }

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${tenantData.tenantName.replace(/[^a-z0-9]/gi, '_')}-intakes-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(csvRows.join('\n'));
    } else {
      // Return structured JSON with nice formatting
      const formattedData = {
        exportedAt: new Date().toISOString(),
        tenant: {
          id: tenantData.tenantId,
          name: tenantData.tenantName,
          cohort: tenantData.cohortLabel,
          segment: tenantData.segment,
          region: tenantData.region,
          status: tenantData.status,
          createdAt: tenantData.createdAt,
        },
        teamMembers: teamMembers.map(member => ({
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role,
          joinedAt: member.createdAt,
          hasCompletedIntake: firmIntakes.some(i => i.userId === member.id),
        })),
        intakes: firmIntakes.map(intake => ({
          id: intake.intakeId,
          teamMember: {
            id: intake.userId,
            name: intake.userName,
            email: intake.userEmail,
            role: intake.userRole,
          },
          intakeRole: intake.role,
          status: intake.status || 'in_progress',
          started: intake.intakeCreatedAt,
          completed: intake.completedAt,
          answers: intake.answers,
        })),
        summary: {
          totalTeamMembers: teamMembers.length,
          totalIntakes: firmIntakes.length,
          completedIntakes: firmIntakes.filter(i => i.completedAt).length,
          intakesByRole: firmIntakes.reduce((acc, intake) => {
            acc[intake.role] = (acc[intake.role] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
        },
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${tenantData.tenantName.replace(/[^a-z0-9]/gi, '_')}-intakes-${new Date().toISOString().split('T')[0]}.json"`);
      return res.json(formattedData);
    }
  } catch (error) {
    console.error('Export firm intakes error:', error);
    return res.status(500).json({ error: 'Failed to export firm intakes' });
  }
}

// ============================================================================
// POST /api/superadmin/firms/:tenantId/documents/upload - Upload Document for Tenant
// ============================================================================

export async function uploadDocumentForTenant(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const { tenantId } = req.params;

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { category, title, description, sopNumber, outputNumber, isPublic } = req.body;

    if (!category || !title) {
      return res.status(400).json({ error: 'Category and title are required' });
    }

    // Get tenant info
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Ensure uploads directory exists
    await fs.mkdir(UPLOADS_DIR, { recursive: true });

    // Generate unique filename
    const fileExt = path.extname(req.file.originalname);
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;
    const filePath = filename;
    const fullPath = path.join(UPLOADS_DIR, filePath);

    // Move file from temp location to uploads directory
    await fs.rename(req.file.path, fullPath);

    // Insert document record
    const [document] = await db
      .insert(tenantDocuments)
      .values({
        tenantId: tenant.id,
        ownerUserId: tenant.ownerUserId,
        filename,
        originalFilename: req.file.originalname,
        filePath,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        category,
        title,
        description: description || null,
        sopNumber: sopNumber || null,
        outputNumber: outputNumber || null,
        uploadedBy: req.user!.userId,
        isPublic: isPublic === 'true' || isPublic === true,
      })
      .returning();

    // Log audit event
    await db.insert(auditEvents).values({
      tenantId,
      actorUserId: req.user!.userId,
      actorRole: req.user!.role,
      eventType: 'DOCUMENT_UPLOADED',
      entityType: 'tenant_document',
      entityId: document.id,
      metadata: {
        filename: req.file.originalname,
        category,
        sopNumber,
        outputNumber,
      },
    });

    // Auto-refresh vector store after document upload (non-blocking)
    refreshVectorStoreContent(tenantId)
      .then(() => console.log('[Upload] Vector store refreshed successfully'))
      .catch((error: any) => console.warn('[Upload] Vector store refresh failed:', error.message));

    return res.json({ document });
  } catch (error) {
    console.error('Upload document for tenant error:', error);
    return res.status(500).json({ error: 'Failed to upload document' });
  }
}

// ============================================================================
// GET /api/superadmin/firms/:tenantId/documents - List Documents for Tenant
// ============================================================================

export async function listTenantDocuments(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const { tenantId } = req.params;

    // Get documents for this tenant
    const documents = await db
      .select()
      .from(tenantDocuments)
      .where(eq(tenantDocuments.tenantId, tenantId))
      .orderBy(desc(tenantDocuments.createdAt));

    return res.json({ documents });
  } catch (error) {
    console.error('List tenant documents error:', error);
    return res.status(500).json({ error: 'Failed to list documents' });
  }
}

// ============================================================================
// GET /api/superadmin/firms/:tenantId/workflow-status - Firm Workflow Status
// ============================================================================

export async function getFirmWorkflowStatus(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const { tenantId } = req.params;

    // Check if tenant exists
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // 1. Query intakes for this tenant
    const allIntakes = await db
      .select()
      .from(intakes)
      .where(eq(intakes.tenantId, tenantId));

    const rolesCompleted = new Set(
      allIntakes.filter(i => i.completedAt).map(i => i.role)
    );
    const requiredRoles = ['owner', 'ops', 'sales', 'delivery'];
    const intakesComplete = requiredRoles.every(role => rolesCompleted.has(role));

    // 2. Query SOP-01 documents
    const sop01Docs = await db
      .select()
      .from(tenantDocuments)
      .where(and(
        eq(tenantDocuments.tenantId, tenantId),
        eq(tenantDocuments.sopNumber, 'SOP-01')
      ));

    const requiredOutputs = ['Output-1', 'Output-2', 'Output-3', 'Output-4'];
    const sop01Complete = requiredOutputs.every(out =>
      sop01Docs.some(d => d.outputNumber === out)
    );

    // 3. Query discovery call notes
    const [discoveryNote] = await db
      .select()
      .from(discoveryCallNotes)
      .where(eq(discoveryCallNotes.tenantId, tenantId))
      .orderBy(desc(discoveryCallNotes.createdAt))
      .limit(1);

    const discoveryComplete = !!discoveryNote && !!tenant.discoveryComplete;

    // 4. Query roadmap documents
    const roadmapDocs = await db
      .select()
      .from(tenantDocuments)
      .where(and(
        eq(tenantDocuments.tenantId, tenantId),
        eq(tenantDocuments.category, 'roadmap')
      ));

    const requiredSections = [
      'summary',
      '01-executive-summary',
      '02-diagnostic-analysis',
      '03-system-architecture',
      '04-high-leverage-systems',
      '05-implementation-plan',
      '06-sop-pack',
      '07-metrics-dashboard',
      '08-appendix',
    ];
    const roadmapComplete = requiredSections.every(section =>
      roadmapDocs.some(d => d.section === section)
    );

    return res.json({
      intakes: {
        complete: intakesComplete,
        rolesCompleted: Array.from(rolesCompleted),
        totalIntakes: allIntakes.length,
      },
      sop01: {
        complete: sop01Complete,
        documents: sop01Docs.map(d => ({
          id: d.id,
          outputNumber: d.outputNumber,
        })),
      },
      discovery: {
        complete: discoveryComplete,
        hasNotes: !!discoveryNote,
        lastUpdatedAt: discoveryNote?.updatedAt?.toISOString() || null,
      },
      roadmap: {
        complete: roadmapComplete,
        sectionsCount: roadmapDocs.length,
      },
    });
  } catch (error) {
    console.error('Get firm workflow status error:', error);
    return res.status(500).json({ error: 'Failed to get workflow status' });
  }
}

// ============================================================================
// POST /api/superadmin/firms/:tenantId/generate-sop01 - Generate SOP-01 Diagnostic
// ============================================================================

export async function generateSop01ForFirm(req: AuthRequest, res: Response) {
  try {
    // SECURITY: This is an Executive Authority action (Ticket 4)
    if (!requireExecutiveAuthority(req, res)) return;

    const { tenantId } = req.params;

    // GATING: Finalization is BLOCKED unless Brief is ACKNOWLEDGED or WAIVED
    const [brief] = await db
      .select()
      .from(executiveBriefs)
      .where(eq(executiveBriefs.tenantId, tenantId))
      .limit(1);

    if (!brief || !(['ACKNOWLEDGED', 'WAIVED'].includes(brief.status))) {
      return res.status(403).json({
        error: 'Gated Action',
        details: 'Leadership alignment required. Executive Brief must be ACKNOWLEDGED or WAIVED before executing diagnostic synthesis.'
      });
    }

    // Build normalized intake context
    const normalized = await buildNormalizedIntakeContext(tenantId);

    // Generate SOP-01 outputs via AI
    const outputs = await generateSop01Outputs(normalized);

    // Persist to filesystem and database
    await persistSop01OutputsForTenant(tenantId, outputs);

    // 🎯 Onboarding Hook: Mark DIAGNOSTIC_GENERATED complete
    try {
      const { onboardingProgressService } = await import('../services/onboardingProgress.service');
      await onboardingProgressService.markStep(
        tenantId,
        'DIAGNOSTIC_GENERATED',
        'COMPLETED'
      );
    } catch (error) {
      console.error('Failed to update onboarding progress:', error);
    }

    // 🎯 NEW: Trigger inventory-driven ticket engine (BLOCKING - must complete before response)
    console.log('[SOP-01] Triggering inventory-driven ticket engine for tenant:', tenantId);

    // Fetch tenant data for DiagnosticMap
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) {
      console.warn('[SOP-01] Tenant not found, skipping ticket generation');
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Get discovery notes if available
    const discoveryNote = await getLatestDiscoveryCallNotes(tenantId);

    // Build minimal DiagnosticMap from intake data
    const diagnosticMap: DiagnosticMap = {
      tenantId,
      firmName: tenant.name,
      diagnosticDate: new Date().toISOString(),
      painClusters: [
        {
          category: 'Operations',
          description: 'Derived from intake data',
          severity: 3,
          affectedRoles: ['Owner', 'Sales', 'Ops'],
          estimatedTimeLostHoursWeekly: 10
        }
      ],
      workflowBottlenecks: [
        {
          process: 'Lead Follow-Up',
          currentState: 'Manual tracking',
          targetState: 'Automated workflow',
          impactScore: 4
        }
      ],
      systemsFragmentation: {
        currentTools: ['CRM', 'Spreadsheets'],
        redundancies: ['Manual data entry'],
        gapsIdentified: ['Automated follow-up']
      },
      aiOpportunityZones: [
        {
          zone: 'Lead Management',
          aiCapability: 'Automated routing and follow-up',
          estimatedImpact: 'High'
        }
      ],
      readinessScore: 70,
      implementationTier: tenant.firmSizeTier === 'micro' ? 'starter' :
        tenant.firmSizeTier === 'large' ? 'scale' : 'growth'
    };

    // Pass SOP-01 content to inventory engine
    const sop01Content = {
      sop01DiagnosticMarkdown: outputs.companyDiagnosticMap,
      sop01AiLeverageMarkdown: outputs.aiLeverageMap,
      sop01RoadmapSkeleton: outputs.roadmapSkeleton,
      discoveryNotesMarkdown: discoveryNote?.notes
    };

    // Run inventory-driven pipeline (BLOCKING)
    const result = await ingestDiagnostic(diagnosticMap, sop01Content);

    console.log(`[SOP-01] ✅ Inventory engine complete: ${result.ticketCount} tickets, ${result.roadmapSectionCount} sections`);

    // Auto-refresh vector store after everything is done (non-blocking)
    console.log('[SOP-01] Triggering vector store refresh for tenant:', tenantId);
    refreshVectorStoreContent(tenantId)
      .then(() => console.log('[SOP-01] Vector store refreshed successfully'))
      .catch((error: any) => console.warn('[SOP-01] Vector store refresh failed:', error.message));

    return res.json({ ok: true });
  } catch (error: any) {
    console.error('Generate SOP-01 for firm error:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate SOP-01' });
  }
}

// ============================================================================
// GET /api/superadmin/firms/:tenantId/discovery-notes - Get Discovery Notes
// ============================================================================

export async function getDiscoveryNotesForFirm(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const { tenantId } = req.params;
    const note = await getLatestDiscoveryCallNotes(tenantId);

    return res.json({
      notes: note?.notes ?? '',
      updatedAt: note?.updatedAt ?? null,
    });
  } catch (error) {
    console.error('Get discovery notes for firm error:', error);
    return res.status(500).json({ error: 'Failed to get discovery notes' });
  }
}

// ============================================================================
// POST /api/superadmin/firms/:tenantId/discovery-notes - Save Discovery Notes
// ============================================================================

export async function saveDiscoveryNotesForFirm(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const { tenantId } = req.params;
    const { notes } = req.body;

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    await saveDiscoveryCallNotes({
      tenantId,
      ownerUserId: tenant.ownerUserId,
      notes,
    });

    // Mark discovery as complete in tenant
    await db
      .update(tenants)
      .set({ discoveryComplete: true })
      .where(eq(tenants.id, tenantId));

    // 🎯 Onboarding Hook: Mark DISCOVERY_CALL complete
    try {
      const { onboardingProgressService } = await import('../services/onboardingProgress.service');
      await onboardingProgressService.markStep(
        tenantId,
        'DISCOVERY_CALL',
        'COMPLETED'
      );
    } catch (error) {
      console.error('Failed to update onboarding progress:', error);
    }

    // Auto-refresh vector store after saving discovery notes
    // Note: Discovery notes aren't in tenant_documents, but we refresh
    // to pick up any other docs that might have been added
    try {
      console.log('[Discovery] Auto-refreshing vector store for tenant:', tenantId);
      await refreshVectorStoreContent(tenantId);
      console.log('[Discovery] Vector store refreshed successfully');
    } catch (error: any) {
      console.warn('[Discovery] Vector store refresh failed:', error.message);
    }

    return res.json({ ok: true });
  } catch (error) {
    console.error('Save discovery notes for firm error:', error);
    return res.status(500).json({ error: 'Failed to save discovery notes' });
  }
}

// ============================================================================
// POST /api/superadmin/firms/:tenantId/generate-roadmap - Generate Roadmap (SOP-03)
// ============================================================================

// ============================================================================
// GET /api/superadmin/firms/:tenantId/roadmap-os - Get Roadmap OS View
// ============================================================================

export async function getRoadmapOsForFirm(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const { tenantId } = req.params;

    // Get roadmap for tenant
    const roadmap = await getOrCreateRoadmapForTenant(tenantId);

    // Get all sections
    const sections = await db
      .select()
      .from(roadmapSections)
      .where(eq(roadmapSections.roadmapId, roadmap.id))
      .orderBy(asc(roadmapSections.sectionNumber));

    return res.json({
      roadmap: {
        id: roadmap.id,
        tenantId: roadmap.tenantId,
        status: roadmap.status,
        pilotStage: roadmap.pilotStage,
        createdAt: roadmap.createdAt,
      },
      sections: sections.map(s => ({
        id: s.id,
        sectionNumber: s.sectionNumber,
        sectionName: s.sectionName,
        status: s.status,
        wordCount: s.wordCount,
        lastUpdatedAt: s.lastUpdatedAt,
        contentMarkdown: s.contentMarkdown, // Include for modal viewing
      })),
    });
  } catch (error: any) {
    console.error('Get roadmap OS for firm error:', error);
    return res.status(500).json({ error: 'Failed to get roadmap OS' });
  }
}

// ============================================================================
// GET /api/superadmin/firms/:tenantId/tickets - Get Ticket Pack with Sections
// ============================================================================

export async function getTicketsForFirm(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const { tenantId } = req.params;

    // Get roadmap
    const roadmap = await getOrCreateRoadmapForTenant(tenantId);

    // Get ticket pack
    const pack = await db.query.ticketPacks.findFirst({
      where: eq(ticketPacks.roadmapId, roadmap.id),
    });

    if (!pack) {
      return res.json({ ticketPack: null, sections: [] });
    }

    // Get all tickets
    const tickets = await db
      .select()
      .from(ticketInstances)
      .where(eq(ticketInstances.ticketPackId, pack.id));

    // Get all sections
    const sections = await db
      .select()
      .from(roadmapSections)
      .where(eq(roadmapSections.roadmapId, roadmap.id))
      .orderBy(asc(roadmapSections.sectionNumber));

    // Group tickets by section
    const sectionsWithTickets = sections.map(section => {
      const sectionTickets = tickets.filter(t => t.sectionNumber === section.sectionNumber);
      const total = sectionTickets.length;
      const done = sectionTickets.filter(t => t.status === 'done').length;

      return {
        sectionNumber: section.sectionNumber,
        sectionName: section.sectionName,
        status: section.status,
        tickets: sectionTickets.map(t => ({
          id: t.id,
          ticketId: t.ticketId,
          status: t.status,
          assignee: t.assignee,
          notes: t.notes,
          startedAt: t.startedAt,
          completedAt: t.completedAt,
        })),
        progress: total > 0 ? Math.round((done / total) * 100) : 0,
        totalTickets: total,
        doneTickets: done,
      };
    });

    return res.json({
      ticketPack: {
        id: pack.id,
        status: pack.status,
        totalTickets: pack.totalTickets,
        totals: pack.totals,
      },
      sections: sectionsWithTickets,
    });
  } catch (error: any) {
    console.error('Get tickets for firm error:', error);
    return res.status(500).json({ error: error.message || 'Failed to get tickets' });
  }
}

// ============================================================================
// POST /api/superadmin/firms/:tenantId/generate-tickets - Generate Ticket Pack
// ============================================================================

export async function generateTicketsForFirm(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const { tenantId } = req.params;

    // Get roadmap for tenant
    const roadmap = await getOrCreateRoadmapForTenant(tenantId);

    // Generate ticket pack
    const result = await generateTicketPackForRoadmap(roadmap.id, tenantId);

    return res.json({
      ok: true,
      ticketPackId: result.ticketPackId,
      ticketsGenerated: result.ticketsGenerated,
    });
  } catch (error: any) {
    console.error('Generate tickets for firm error:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate tickets' });
  }
}

// ============================================================================
// POST /api/superadmin/firms/:tenantId/extract-metadata - Extract Roadmap Metadata
// ============================================================================

export async function extractMetadataForFirm(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const { tenantId } = req.params;

    // Get roadmap for tenant
    const roadmap = await getOrCreateRoadmapForTenant(tenantId);

    // Extract metadata and update agent configs
    const metadata = await extractRoadmapMetadata(roadmap.id, tenantId);

    return res.json({
      ok: true,
      metadata,
    });
  } catch (error: any) {
    console.error('Extract metadata for firm error:', error);
    return res.status(500).json({ error: error.message || 'Failed to extract metadata' });
  }
}

// ============================================================================
// GET /api/superadmin/firms/:tenantId/metrics - Get Performance Metrics (T3.7)
// ============================================================================

export async function getMetricsForFirm(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const { tenantId } = req.params;

    // Get roadmap
    const roadmap = await getOrCreateRoadmapForTenant(tenantId);

    // Get all snapshots
    const snapshots = await ImplementationMetricsService.getSnapshotsForRoadmap({
      tenantId,
      roadmapId: roadmap.id,
    });

    // Get outcome (with deltas + ROI)
    const outcome = await ImplementationMetricsService.getOutcome({
      tenantId,
      roadmapId: roadmap.id,
    });

    return res.json({
      snapshots,
      outcome: outcome || null,
    });
  } catch (error: any) {
    console.error('Get metrics for firm error:', error);
    return res.status(500).json({ error: error.message || 'Failed to get metrics' });
  }
}

// ============================================================================
// POST /api/superadmin/firms/:tenantId/metrics/baseline - Create Baseline (T3.2)
// ============================================================================

export async function createBaselineForFirm(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const { tenantId } = req.params;
    const { metrics, source = 'manual' } = req.body;

    const roadmap = await getOrCreateRoadmapForTenant(tenantId);

    const result = await ImplementationMetricsService.createBaselineSnapshot(
      tenantId,
      roadmap.id,
      metrics,
      source
    );

    return res.json({ ok: true, ...result });
  } catch (error: any) {
    console.error('Create baseline error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create baseline' });
  }
}

// ============================================================================
// POST /api/superadmin/firms/:tenantId/metrics/snapshot - Create Time Snapshot (T3.3)
// ============================================================================

export async function createSnapshotForFirm(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const { tenantId } = req.params;
    const { label, metrics, source = 'manual' } = req.body;

    if (!['30d', '60d', '90d', 'custom'].includes(label)) {
      return res.status(400).json({ error: 'Invalid label. Must be 30d, 60d, 90d, or custom' });
    }

    const roadmap = await getOrCreateRoadmapForTenant(tenantId);

    const result = await ImplementationMetricsService.createTimeSnapshot(
      tenantId,
      roadmap.id,
      label,
      metrics,
      source
    );

    return res.json({ ok: true, ...result });
  } catch (error: any) {
    console.error('Create snapshot error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create snapshot' });
  }
}

// ============================================================================
// POST /api/superadmin/firms/:tenantId/metrics/compute-outcome - Compute Deltas + ROI (T3.4, T3.5)
// ============================================================================

export async function computeOutcomeForFirm(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const { tenantId } = req.params;
    const { assumptions } = req.body;

    const roadmap = await getOrCreateRoadmapForTenant(tenantId);

    const outcome = await ImplementationMetricsService.createOutcomeForRoadmap({
      tenantId,
      roadmapId: roadmap.id,
      assumptions,
    });

    return res.json({ ok: true, outcome });
  } catch (error: any) {
    console.error('Compute outcome error:', error);
    return res.status(500).json({ error: error.message || 'Failed to compute outcome' });
  }
}

// ============================================================================
// POST /api/superadmin/firms/:tenantId/export/case-study - Export Case Study (T3.10)
// ============================================================================

export async function exportCaseStudyForFirm(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const { tenantId } = req.params;

    // Get tenant info
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Generate and save case study
    const result = await saveCaseStudy(
      tenantId,
      tenant.ownerUserId,
      tenant.name,
      req.user!.userId
    );

    return res.json({
      ok: true,
      documentId: result.documentId,
      markdown: result.markdown,
    });
  } catch (error: any) {
    console.error('Export case study error:', error);
    return res.status(500).json({ error: error.message || 'Failed to export case study' });
  }
}

// ============================================================================
// POST /api/superadmin/tenants/:tenantId/refresh-vector-store - Manually Refresh Vector Store (V2)
// ============================================================================

export async function refreshVectorStoreForTenant(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const { tenantId } = req.params;

    console.log(`[SuperAdmin] Refreshing vector store for tenant: ${tenantId}`);

    // Verify tenant exists
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Trigger vector store refresh
    await refreshVectorStoreContent(tenantId);

    console.log(`[SuperAdmin] Vector store refreshed for: ${tenant.name}`);

    return res.json({
      ok: true,
      message: `Vector store refreshed for ${tenant.name}`,
      tenantId,
    });
  } catch (error: any) {
    console.error('Refresh vector store error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to refresh vector store',
      details: error.stack,
    });
  }
}

// ============================================================================
// POST /api/superadmin/firms/:tenantId/generate-roadmap - Generate Roadmap via Diagnostic Ingestion
// ============================================================================

export async function generateRoadmapForFirm(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const { tenantId } = req.params;

    console.log(`[SuperAdmin] Generating roadmap for tenant: ${tenantId}`);

    // Get tenant info
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Load ALL SOP-01 documents for rich context
    const sop01Docs = await db
      .select()
      .from(tenantDocuments)
      .where(and(
        eq(tenantDocuments.tenantId, tenantId),
        eq(tenantDocuments.sopNumber, 'SOP-01')
      ));

    // Find each output
    const diagnosticDoc = sop01Docs.find(d => d.outputNumber === 'Output-1');
    const aiLeverageDoc = sop01Docs.find(d => d.outputNumber === 'Output-2');
    const roadmapSkeletonDoc = sop01Docs.find(d => d.outputNumber === 'Output-4');

    if (!diagnosticDoc) {
      return res.status(400).json({
        error: 'SOP-01 diagnostic not found',
        message: 'Please generate SOP-01 first using the "Generate SOP-01" button'
      });
    }

    // Read all SOP-01 content from files
    const sop01DiagnosticMarkdown = await fs.readFile(diagnosticDoc.filePath, 'utf-8');
    const sop01AiLeverageMarkdown = aiLeverageDoc
      ? await fs.readFile(aiLeverageDoc.filePath, 'utf-8')
      : '';
    const sop01RoadmapSkeleton = roadmapSkeletonDoc
      ? await fs.readFile(roadmapSkeletonDoc.filePath, 'utf-8')
      : '';

    // Load discovery notes if available
    const [discoveryNote] = await db
      .select()
      .from(discoveryCallNotes)
      .where(eq(discoveryCallNotes.tenantId, tenantId))
      .orderBy(desc(discoveryCallNotes.createdAt))
      .limit(1);

    const discoveryNotesMarkdown = discoveryNote?.notes || undefined;

    console.log(`[SuperAdmin] Loaded SOP-01 documents:`);
    console.log(`  - Diagnostic Map: ${sop01DiagnosticMarkdown.length} chars`);
    console.log(`  - AI Leverage Map: ${sop01AiLeverageMarkdown.length} chars`);
    console.log(`  - Roadmap Skeleton: ${sop01RoadmapSkeleton.length} chars`);
    console.log(`  - Discovery Notes: ${discoveryNotesMarkdown?.length || 0} chars`);

    // Gating Check: Ensure Intake is CLOSED and Executive Brief is ACKNOWLEDGED or WAIVED
    const [brief] = await db
      .select()
      .from(executiveBriefs)
      .where(eq(executiveBriefs.tenantId, tenantId))
      .limit(1);

    const isIntakeClosed = tenant.intakeWindowState === 'CLOSED';
    const isBriefResolved = brief && ['ACKNOWLEDGED', 'WAIVED'].includes(brief.status);

    if (!isIntakeClosed) {
      return res.status(400).json({
        error: 'Intake window is not closed.',
        message: 'You must close the Intake Window before generating diagnostics.'
      });
    }

    if (!isBriefResolved) {
      return res.status(400).json({
        error: 'Executive Brief not resolved.',
        message: 'Executive Brief must be ACKNOWLEDGED or WAIVED before synthesis can proceed.'
      });
    }

    // Build simplified DiagnosticMap structure
    // Note: We pass both structured data + raw SOP-01 markdown to the pipeline
    const diagnosticMap: DiagnosticMap = {
      tenantId,
      firmName: tenant.name,
      diagnosticDate: new Date().toISOString(),
      painClusters: [
        {
          category: 'Operations',
          description: 'Manual processes and workflow bottlenecks',
          severity: 4,
          affectedRoles: ['owner', 'ops'],
          estimatedTimeLostHoursWeekly: 10
        }
      ],
      workflowBottlenecks: [
        {
          process: 'Lead Management',
          currentState: 'Manual tracking and delayed follow-ups',
          targetState: 'Automated capture and instant response',
          impactScore: 5
        }
      ],
      systemsFragmentation: {
        currentTools: ['Email', 'Spreadsheets', 'Basic CRM'],
        redundancies: ['Multiple data entry', 'Duplicate records'],
        gapsIdentified: ['No automation', 'Limited reporting']
      },
      aiOpportunityZones: [
        {
          zone: 'Lead Management',
          aiCapability: 'Automated lead capture and routing',
          estimatedImpact: 'Reduce response time from hours to minutes'
        }
      ],
      readinessScore: 70,
      implementationTier: 'growth'
    };

    console.log(`[SuperAdmin] Built DiagnosticMap for: ${tenant.name}`);

    // Pass rich context to diagnostic ingestion:
    // - DiagnosticMap (structured)
    // - SOP-01 markdown content (narrative)
    // - Discovery notes (additional context)
    const result = await ingestDiagnostic(
      diagnosticMap,
      {
        sop01DiagnosticMarkdown,
        sop01AiLeverageMarkdown,
        sop01RoadmapSkeleton,
        discoveryNotesMarkdown
      }
    );

    console.log(`[SuperAdmin] ✅ Roadmap generated successfully`);
    console.log(`[SuperAdmin] Diagnostic ID: ${result.diagnosticId}`);
    console.log(`[SuperAdmin] Tickets: ${result.ticketCount}`);
    console.log(`[SuperAdmin] Sections: ${result.roadmapSectionCount}`);

    // Auto-refresh vector store after roadmap generation (non-blocking)
    console.log('[Roadmap] Triggering vector store refresh for tenant:', tenantId);
    refreshVectorStoreContent(tenantId)
      .then(() => console.log('[Roadmap] Vector store refreshed successfully'))
      .catch((error: any) => console.warn('[Roadmap] Vector store refresh failed:', error.message));

    return res.json({
      ok: true,
      diagnosticId: result.diagnosticId,
      ticketCount: result.ticketCount,
      roadmapSectionCount: result.roadmapSectionCount,
      assistantProvisioned: result.assistantProvisioned
    });
  } catch (error: any) {
    console.error('[SuperAdmin] Generate roadmap error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate roadmap',
      details: error.stack
    });
  }
}

// ============================================================================
// GET /api/superadmin/metrics/daily-rollup - 30-Day Trends (F3.3)
// ============================================================================

export async function getDailyMetricsRollup(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const days = parseInt(req.query.days as string) || 30;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Query tenantMetricsDaily for the date range
    const metricsData = await db
      .select()
      .from(tenantMetricsDaily)
      .where(
        sql`${tenantMetricsDaily.metricDate} >= ${startDate.toISOString().split('T')[0]}`
      )
      .orderBy(asc(tenantMetricsDaily.metricDate));

    // Aggregate by date
    const dailyAggregates = metricsData.reduce((acc, row) => {
      const dateKey = row.metricDate;
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          intakeStarted: 0,
          intakeCompleted: 0,
          roadmapCreated: 0,
          roadmapDelivered: 0,
          pilotOpen: 0,
          pilotWon: 0,
        };
      }
      acc[dateKey].intakeStarted += row.intakeStartedCount;
      acc[dateKey].intakeCompleted += row.intakeCompletedCount;
      acc[dateKey].roadmapCreated += row.roadmapCreatedCount;
      acc[dateKey].roadmapDelivered += row.roadmapDeliveredCount;
      acc[dateKey].pilotOpen += row.pilotOpenCount;
      acc[dateKey].pilotWon += row.pilotWonCount;
      return acc;
    }, {} as Record<string, any>);

    const timeSeries = Object.values(dailyAggregates);

    return res.json({
      days,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      timeSeries,
    });
  } catch (error) {
    console.error('Get daily metrics rollup error:', error);
    return res.status(500).json({ error: 'Failed to fetch daily metrics rollup' });
  }
}

// ============================================================================
// GET /api/superadmin/leads - View all lead request submissions
// ============================================================================

export async function getLeadRequests(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const status = req.query.status as string | undefined;
    const source = req.query.source as string | undefined;

    let query = db.select().from(webinarRegistrations);

    if (status) {
      query = query.where(eq(webinarRegistrations.status, status)) as any;
    }
    if (source) {
      query = query.where(eq(webinarRegistrations.source, source)) as any;
    }

    const leads = await query.orderBy(desc(webinarRegistrations.createdAt));

    return res.json({ leads });
  } catch (error) {
    console.error('Get lead requests error:', error);
    return res.status(500).json({ error: 'Failed to fetch lead requests' })
  }
}

// ============================================================================
// PATCH /api/superadmin/leads/:id - Update lead status/notes
// ============================================================================

export async function updateLeadRequest(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const leadId = req.params.id;
    if (!leadId) {
      return res.status(400).json({ error: 'Invalid lead ID' });
    }

    const { status, notes } = req.body;

    if (!status && notes === undefined) {
      return res.status(400).json({ error: 'Must provide status or notes' });
    }

    const updateFields: any = {};
    if (status) updateFields.status = status;
    if (notes !== undefined) updateFields.notes = notes;

    const updated = await db
      .update(webinarRegistrations)
      .set(updateFields)
      .where(eq(webinarRegistrations.id, leadId))
      .returning();

    if (!updated || updated.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    return res.json({ ok: true, lead: updated[0] });
  } catch (error) {
    console.error('Update lead request error:', error);
    return res.status(500).json({ error: 'Failed to update lead request' });
  }
}

// ============================================================================
// WEBINAR REGISTRATION MANAGEMENT
// ============================================================================

import bcrypt from 'bcryptjs';

// GET /api/superadmin/webinar/registrations - View all webinar registrations
export async function getWebinarRegistrations(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const status = req.query.status as string | undefined;
    const source = req.query.source as string | undefined;

    let query = db.select().from(webinarRegistrations);

    if (status) {
      query = query.where(eq(webinarRegistrations.status, status)) as any;
    }
    if (source) {
      query = query.where(eq(webinarRegistrations.source, source)) as any;
    }

    const registrations = await query.orderBy(desc(webinarRegistrations.createdAt));

    return res.json({ registrations });
  } catch (error) {
    console.error('Get webinar registrations error:', error);
    return res.status(500).json({ error: 'Failed to fetch webinar registrations' });
  }
}

// PATCH /api/superadmin/webinar/registrations/:id - Update registration status/notes
export async function updateWebinarRegistration(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const registrationId = req.params.id;

    const { status, notes } = req.body;

    if (!status && notes === undefined) {
      return res.status(400).json({ error: 'Must provide status or notes' });
    }

    const updateFields: any = {};
    if (status) updateFields.status = status;
    if (notes !== undefined) updateFields.notes = notes;

    const updated = await db
      .update(webinarRegistrations)
      .set(updateFields)
      .where(eq(webinarRegistrations.id, registrationId))
      .returning();

    if (!updated || updated.length === 0) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    return res.json({ ok: true, registration: updated[0] });
  } catch (error) {
    console.error('Update webinar registration error:', error);
    return res.status(500).json({ error: 'Failed to update registration' });
  }
}

// GET /api/superadmin/webinar/settings - Get webinar settings (password version)
export async function getWebinarSettings(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const settings = await db.select().from(webinarSettings).limit(1);

    if (settings.length === 0) {
      return res.status(404).json({ error: 'Webinar settings not found' });
    }

    return res.json({
      passwordVersion: settings[0].passwordVersion,
      updatedAt: settings[0].updatedAt,
    });
  } catch (error) {
    console.error('Get webinar settings error:', error);
    return res.status(500).json({ error: 'Failed to fetch webinar settings' });
  }
}

// PATCH /api/superadmin/webinar/password - Update webinar password
export async function updateWebinarPassword(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const { newPassword } = req.body;

    if (!newPassword || newPassword.trim().length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Get current settings to increment version
    const currentSettings = await db.select().from(webinarSettings).limit(1);

    if (currentSettings.length === 0) {
      // Create initial settings if not exist
      const created = await db
        .insert(webinarSettings)
        .values({
          passwordHash,
          passwordVersion: 1,
          updatedAt: new Date(),
        })
        .returning();

      return res.json({
        ok: true,
        passwordVersion: created[0].passwordVersion,
        message: 'Webinar password created successfully',
      });
    }

    // Update existing settings
    const newVersion = currentSettings[0].passwordVersion + 1;

    const updated = await db
      .update(webinarSettings)
      .set({
        passwordHash,
        passwordVersion: newVersion,
        updatedAt: new Date(),
      })
      .where(eq(webinarSettings.id, currentSettings[0].id))
      .returning();

    return res.json({
      ok: true,
      passwordVersion: updated[0].passwordVersion,
      message: 'Webinar password updated successfully',
    });
  } catch (error) {
    console.error('Update webinar password error:', error);
    return res.status(500).json({ error: 'Failed to update webinar password' });
  }
}



// ============================================================================
// EXECUTIVE BRIEF CRUD (EXECUTIVE AUTHORITY ONLY)
// ============================================================================

export async function getExecutiveBrief(req: AuthRequest, res: Response) {
  try {
    if (!requireExecutiveAuthority(req, res)) return;
    const { tenantId } = req.params;

    const [brief] = await db
      .select()
      .from(executiveBriefs)
      .where(eq(executiveBriefs.tenantId, tenantId))
      .limit(1);

    return res.json({ brief: brief || null });
  } catch (error) {
    console.error('Get exec brief error:', error);
    return res.status(500).json({ error: 'Failed to fetch executive brief' });
  }
}

export async function upsertExecutiveBrief(req: AuthRequest, res: Response) {
  try {
    if (!requireExecutiveAuthority(req, res)) return;
    const { tenantId } = req.params;
    const { content } = req.body;
    const userId = req.user!.userId;

    if (!tenantId || !userId) {
      return res.status(400).json({ error: 'Missing tenantId or userId' });
    }

    // Check if it exists using explicit SQL cast for safety if needed
    const [existing] = await db
      .select()
      .from(executiveBriefs)
      .where(eq(executiveBriefs.tenantId, tenantId))
      .limit(1);

    if (existing) {
      // Logic constraint: Cannot edit if ACKNOWLEDGED or WAIVED
      if (['ACKNOWLEDGED', 'WAIVED'].includes(existing.status)) {
        return res.status(403).json({ error: 'Cannot edit locked brief' });
      }

      const [updated] = await db
        .update(executiveBriefs)
        .set({
          content: content || '',
          lastUpdatedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(executiveBriefs.id, existing.id))
        .returning();

      // Audit Log: Update
      await db.insert(auditEvents).values({
        tenantId,
        actorUserId: userId,
        actorRole: req.user?.role as string,
        eventType: 'brief_updated',
        entityType: 'executive_brief',
        entityId: updated.id,
        metadata: { status: updated.status }
      });

      return res.json({ brief: updated });
    } else {
      const [created] = await db
        .insert(executiveBriefs)
        .values({
          tenantId: tenantId,
          content: content || '',
          status: 'DRAFT',
          createdBy: userId,
          lastUpdatedBy: userId,
        })
        .returning();

      // Audit Log: Create
      await db.insert(auditEvents).values({
        tenantId,
        actorUserId: userId,
        actorRole: req.user?.role as string,
        eventType: 'brief_created',
        entityType: 'executive_brief',
        entityId: created.id,
        metadata: { status: 'DRAFT' }
      });

      return res.json({ brief: created });
    }
  } catch (error: any) {
    console.error('Upsert exec brief error:', error);
    return res.status(500).json({
      error: 'Failed to save executive brief',
      details: error?.message || 'Unknown database error'
    });
  }
}

export async function transitionExecutiveBriefStatus(req: AuthRequest, res: Response) {
  try {
    if (!requireExecutiveAuthority(req, res)) return;
    const { tenantId } = req.params;
    const { status, reason } = req.body; // Added reason
    const userId = req.user!.userId;

    const [existing] = await db
      .select()
      .from(executiveBriefs)
      .where(eq(executiveBriefs.tenantId, tenantId))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: 'Brief not found' });
    }

    // Get Tenant for Snapshot ID
    const [tenant] = await db
      .select({ intakeSnapshotId: tenants.intakeSnapshotId })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    // Valid transitions logic
    const current = existing.status;
    let allowed = false;

    if (current === 'DRAFT' && status === 'READY_FOR_EXEC_REVIEW') allowed = true;
    if (current === 'READY_FOR_EXEC_REVIEW' && (status === 'ACKNOWLEDGED' || status === 'WAIVED')) allowed = true;

    if (!allowed) {
      return res.status(400).json({ error: `Transition from ${current} to ${status} not permitted` });
    }

    const [updated] = await db
      .update(executiveBriefs)
      .set({
        status,
        lastUpdatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(executiveBriefs.id, existing.id))
      .returning();

    // Map status to audit event type
    let auditEventType = 'brief_updated';
    if (status === 'READY_FOR_EXEC_REVIEW') auditEventType = 'brief_submitted_for_exec';
    if (status === 'ACKNOWLEDGED') auditEventType = 'brief_acknowledged';
    if (status === 'WAIVED') auditEventType = 'brief_waived';

    // Audit Log
    await db.insert(auditEvents).values({
      tenantId,
      actorUserId: userId,
      actorRole: req.user?.role as string,
      eventType: auditEventType,
      entityType: 'executive_brief',
      entityId: updated.id,
      metadata: {
        previousStatus: current,
        newStatus: status,
        intakeSnapshotId: tenant?.intakeSnapshotId,
        reason: status === 'WAIVED' ? reason : undefined
      }
    });

    return res.json({ brief: updated });
  } catch (error) {
    console.error('Transition exec brief error:', error);
    return res.status(500).json({ error: 'Failed to transition brief status' });
  }
}
