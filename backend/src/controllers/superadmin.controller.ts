<<<<<<< HEAD
<<<<<<< HEAD
import { Response } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db';
import {
  users, intakes, tenants, roadmaps, auditEvents, tenantDocuments,
  discoveryCallNotes, roadmapSections, ticketPacks, ticketInstances,
  tenantMetricsDaily, webinarRegistrations, implementationSnapshots,
  roadmapOutcomes, agentConfigs, agentThreads, webinarSettings,
  diagnostics, executiveBriefs, sopTickets, ticketModerationSessions,
  ticketsDraft
} from '../db/schema';
import { eq, and, sql, count, desc, asc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
=======
import { Response } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db';
import { users, intakes, tenants, roadmaps, auditEvents, tenantDocuments, discoveryCallNotes, roadmapSections, ticketPacks, ticketInstances, tenantMetricsDaily, webinarRegistrations, implementationSnapshots, roadmapOutcomes, agentConfigs, agentThreads, webinarSettings, diagnostics, executiveBriefs } from '../db/schema';
import { eq, and, sql, count, desc, asc } from 'drizzle-orm';
>>>>>>> 1e46cab (chore: lock executive brief render + pdf contracts)
import { AuthRequest } from '../middleware/auth';
import path from 'path';
import fs from 'fs/promises';
import { generateTicketPackForRoadmap } from '../services/ticketPackGenerator.service';
import { extractRoadmapMetadata } from '../services/roadmapMetadataExtractor.service';
import { ImplementationMetricsService } from '../services/implementationMetrics.service';
import { getOrCreateRoadmapForTenant } from '../services/roadmapOs.service';
import { refreshVectorStoreContent } from '../services/tenantVectorStore.service';
import { getModerationStatus } from '../services/ticketModeration.service';
import { AUDIT_EVENT_TYPES } from '../constants/auditEventTypes';
<<<<<<< HEAD
import { AuthorityCategory, CanonicalDiscoveryNotes } from '@roadmap/shared';
import { generateRawTickets, ParsedTicket, InventoryEmptyError } from '../services/diagnosticIngestion.service';
import { Sop01Outputs } from '../services/sop01Engine';

// META-TICKET v2: Gate & SOP Architecture Imports
import {
  canLockIntake,
  canGenerateDiagnostics,
  canLockDiagnostic,
  canPublishDiagnostics,
  canIngestDiscoveryNotes,
  canGenerateSopTickets,
  canAssembleRoadmap
} from '../services/gate.service';
import { generateSop01Outputs } from '../services/sop01Engine';
import { persistSop01OutputsForTenant } from '../services/sop01Persistence';
import { buildNormalizedIntakeContext } from '../services/intakeNormalizer';

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// ============================================================================
// HELPER: Permissions & Authority
=======
import { AuthorityCategory } from '@roadmap/shared';
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// ============================================================================
// HELPER: Check SuperAdmin Permission
>>>>>>> 1e46cab (chore: lock executive brief render + pdf contracts)
// ============================================================================

/**
 * Helper to ensure the user is part of the Consulting Team (SuperAdmin or Delegate)
 */
function requireConsultant(req: AuthRequest, res: Response): boolean {
  const allowedRoles = ['superadmin', 'delegate', 'exec_sponsor'];
  if (!req.user || !req.user.isInternal || !allowedRoles.includes(req.user.role as string)) {
    res.status(403).json({ error: 'Consulting Team access required' });
    return false;
  }
  return true;
}

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

<<<<<<< HEAD
export async function getOverview(
  req: AuthRequest<any, any, any, { cohortLabel?: string }>,
  res: Response
) {
  try {
    if (!requireSuperAdmin(req, res)) return;

    // Hard guard: if core schemas are missing, that's a server/config issue
    if (!tenants || !intakes || !roadmaps) {
      console.error('CRITICAL: Schema tables are undefined!', {
        tenants: !!tenants,
        intakes: !!intakes,
        roadmaps: !!roadmaps,
      });
      return res
        .status(503)
        .json({ error: 'DB_UNAVAILABLE', message: 'Schema tables undefined' });
    }

    // Count total tenants
    const firmRes = await db.select({ totalFirms: count() }).from(tenants);
    const totalFirms = firmRes?.[0]?.totalFirms ?? 0;

    // Count intake completions
    const intakeRes = await db.select({ totalIntakes: count() }).from(intakes);
    const totalIntakes = intakeRes?.[0]?.totalIntakes ?? 0;
=======
export async function getOverview(req: AuthRequest<any, any, any, { cohortLabel?: string }>, res: Response) {
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
>>>>>>> 1e46cab (chore: lock executive brief render + pdf contracts)

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

<<<<<<< HEAD
    // Drizzle will throw if any selected field is undefined.
    // These columns may not exist in some schema snapshots, so guard them.
    const pilotStageCol = (roadmaps as any).pilotStage;
    const cohortLabelCol = (tenants as any).cohortLabel;

    // Count roadmaps by pilot stage (exclude nulls)
    const pilotStats = pilotStageCol
      ? await db
        .select({
          pilotStage: pilotStageCol,
          count: count(),
        })
        .from(roadmaps)
        .where(sql`${pilotStageCol} IS NOT NULL`)
        .groupBy(pilotStageCol)
      : [];

    // Count by cohort
    const cohortStats = cohortLabelCol
      ? await db
        .select({
          cohortLabel: cohortLabelCol,
          count: count(),
        })
        .from(tenants)
        .where(sql`${cohortLabelCol} IS NOT NULL`)
        .groupBy(cohortLabelCol)
      : [];

    return res.json({
      totalFirms,
      totalIntakes,
=======
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
>>>>>>> 1e46cab (chore: lock executive brief render + pdf contracts)
      statusStats,
      roadmapStats,
      pilotStats,
      cohortStats,
    });
<<<<<<< HEAD
  } catch (error: any) {
    console.error('Get overview error:', error?.message ?? error, error?.stack);
    return res
      .status(503)
      .json({ error: 'DB_UNAVAILABLE', message: 'Failed to fetch overview' });
  }
}


=======
  } catch (error) {
    console.error('Get overview error:', error);
    return res.status(500).json({ error: 'Failed to fetch overview' });
  }
}

>>>>>>> 1e46cab (chore: lock executive brief render + pdf contracts)
// ============================================================================
// GET ACTIVITY FEED
// ============================================================================

export async function getActivityFeed(req: AuthRequest<any, any, any, { limit?: string }>, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const limit = parseInt(req.query.limit || '50', 10);

    // Fetch recent audit events with actor and tenant information
    const events = await db
      .select({
        id: auditEvents.id,
        eventType: auditEvents.eventType,
        entityType: auditEvents.entityType,
        metadata: auditEvents.metadata,
        createdAt: auditEvents.createdAt,
        actorName: users.name,
        actorRole: auditEvents.actorRole,
        tenantId: tenants.id,
        tenantName: tenants.name,
      })
      .from(auditEvents)
      .leftJoin(users, eq(auditEvents.actorUserId, users.id))
      .leftJoin(tenants, eq(auditEvents.tenantId, tenants.id))
      .orderBy(desc(auditEvents.createdAt))
      .limit(limit);

    // Transform events into activity feed format
    const activities = events.map((event) => {
      const actor = event.actorName || 'System';
      const action = formatEventAction(event.eventType, event.metadata);
      const target = event.tenantName || 'System';

      return {
        id: event.id,
        actor,
        action,
        target,
        tenantId: event.tenantId,
        timestamp: event.createdAt,
        type: event.entityType || 'system',
      };
    });

    return res.json({ activities });
  } catch (error) {
    console.error('Get activity feed error:', error);
    return res.status(500).json({ error: 'Failed to fetch activity feed' });
  }
}

// Helper function to format event types into readable actions
function formatEventAction(eventType: string, metadata: any): string {
  const metadataObj = metadata as Record<string, any> || {};

  switch (eventType) {
    case 'intake_completed':
      return 'completed Intake';
    case 'intake_reopened':
      return 'reopened Intake';
    case 'diagnostic_generated':
      return 'generated SOP-01 Diagnostic';
    case 'roadmap_created':
      return 'created Roadmap';
    case 'roadmap_status_changed':
      return `updated Roadmap to ${metadataObj.newStatus || 'new status'}`;
    case 'discovery_acknowledged':
      return 'acknowledged Discovery';
    case 'intake_window_closed':
      return 'closed Intake Window';
    case 'intake_window_reopened':
      return 'reopened Intake Window';
    case 'exec_ready_approved':
      return 'approved for Execution';
    case 'ticket_pack_generated':
      return 'generated Ticket Pack';
    default:
      return eventType.replace(/_/g, ' ');
  }
}


export async function updateIntakeCoaching(req: AuthRequest<{ intakeId: string }, any, { coachingFeedback: any }>, res: Response) {
  try {
    if (!requireConsultant(req, res)) return;

    const { intakeId } = req.params;
    const { coachingFeedback } = req.body;

    const [intake] = await db
      .select({
        id: intakes.id,
        tenantId: intakes.tenantId,
      })
      .from(intakes)
      .where(eq(intakes.id, intakeId))
      .limit(1);

    if (!intake) {
      return res.status(404).json({ error: 'Intake not found' });
    }

    await db
      .update(intakes)
      .set({
        coachingFeedback,
      })
      .where(eq(intakes.id, intakeId));

    return res.json({ ok: true });
  } catch (error) {
    console.error('Update intake coaching error:', error);
    return res.status(500).json({ error: 'Failed to update coaching feedback' });
  }
}

export async function reopenIntake(req: AuthRequest<{ intakeId: string }>, res: Response) {
  try {
    if (!requireConsultant(req, res)) return;
    if (!requireExecutiveAuthority(req, res)) return;

    const { intakeId } = req.params;

    const [intake] = await db
      .select({
        id: intakes.id,
        tenantId: intakes.tenantId,
      })
      .from(intakes)
      .where(eq(intakes.id, intakeId))
      .limit(1);

    if (!intake) {
      return res.status(404).json({ error: 'Intake not found' });
    }

    // GATING: Block reopen if Intake Window is CLOSED (drift prevention)
    const [tenant] = await db
      .select({ intakeWindowState: tenants.intakeWindowState })
      .from(tenants)
      .where(eq(tenants.id, intake.tenantId))
      .limit(1);

    if (tenant && tenant.intakeWindowState === 'CLOSED') {
      return res.status(403).json({
        error: 'Gated Action',
        details: 'Cannot reopen an intake after the Intake Window is CLOSED. Reopen the window via a new cycle (not supported in this mode).'
      });
    }

    await db
      .update(intakes)
      .set({
        status: 'in_progress',
        completedAt: null,
      })
      .where(eq(intakes.id, intakeId));

    // Audit Log
    await db.insert(auditEvents).values({
      tenantId: intake.tenantId,
      actorUserId: req.user?.userId,
      actorRole: req.user?.role as string,
      eventType: 'INTAKE_REOPENED',
      entityType: 'intake',
      entityId: intakeId,
      metadata: { reopenedAt: new Date() },
    });

    return res.json({ ok: true });
  } catch (error) {
    console.error('Re-open intake error:', error);
    return res.status(500).json({ error: 'Failed to re-open intake' });
  }
}


// ============================================================================
// GET /api/superadmin/tenants - Simple List for Dropdowns
// ============================================================================

export async function getTenants(req: AuthRequest<any, any, any, { search?: string }>, res: Response) {
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

export async function getAllRoadmaps(req: AuthRequest<any, any, any, { cohort?: string; status?: string; search?: string }>, res: Response) {
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

export async function getFirms(req: AuthRequest<any, any, any, { cohortLabel?: string }>, res: Response) {
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

export async function closeIntakeWindow(req: AuthRequest<{ tenantId: string }>, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;
    if (!requireExecutiveAuthority(req, res)) return;

    const { tenantId } = req.params;

    // GATING: Block close unless Executive Brief is ACKNOWLEDGED or WAIVED
    const [brief] = await db
      .select()
      .from(executiveBriefs)
      .where(eq(executiveBriefs.tenantId, tenantId))
      .limit(1);

    if (!brief || !(['ACKNOWLEDGED', 'WAIVED'].includes(brief.status))) {
      return res.status(403).json({
        error: 'Gated Action',
        details: 'Executive Brief must be ACKNOWLEDGED or WAIVED before closing the Intake Window.'
      });
    }

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
      actorUserId: req.user?.userId,
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

<<<<<<< HEAD
// Import artifact type constant if available, or hardcode string to avoid circular deps if needed
// const DISCOVERY_SYNTHESIS_ARTIFACT_TYPE = 'DISCOVERY_SYNTHESIS_V1';

=======
>>>>>>> 1e46cab (chore: lock executive brief render + pdf contracts)
export async function getFirmDetail(req: AuthRequest<{ tenantId: string }>, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const { tenantId } = req.params;

<<<<<<< HEAD
    // Fetch Executive Brief Status & Derive Phase
    const [execBrief] = await db
      .select({ status: executiveBriefs.status })
      .from(executiveBriefs)
      .where(eq(executiveBriefs.tenantId, tenantId))
      .limit(1);

    const briefStatus = execBrief?.status || null;

    let executionPhase = 'INTAKE_OPEN';
    if (briefStatus === 'APPROVED') {
      executionPhase = 'EXEC_BRIEF_APPROVED';
    } else if (briefStatus === 'DRAFT') {
      executionPhase = 'EXEC_BRIEF_DRAFT';
    }

=======
>>>>>>> 1e46cab (chore: lock executive brief render + pdf contracts)
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
<<<<<<< HEAD
      .leftJoin(users, eq(tenants.ownerUserId, users.id))
=======
      .innerJoin(users, eq(tenants.ownerUserId, users.id))
>>>>>>> 1e46cab (chore: lock executive brief render + pdf contracts)
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
      coachingFeedback: row.intakes.coachingFeedback,
      createdAt: row.intakes.createdAt,
      completedAt: row.intakes.completedAt,
      userName: row.users.name,
      userEmail: row.users.email,
    }));

    // Get roadmaps for this firm
    const firmRoadmaps = await db
<<<<<<< HEAD
      .select({
        id: roadmaps.id,
        status: roadmaps.status,
        version: roadmaps.version,
        createdAt: roadmaps.createdAt,
        updatedAt: roadmaps.updatedAt
      })
=======
      .select()
>>>>>>> 1e46cab (chore: lock executive brief render + pdf contracts)
      .from(roadmaps)
      .where(eq(roadmaps.tenantId, tenantId))
      .orderBy(desc(roadmaps.createdAt));

    const latestRoadmap = firmRoadmaps[0] || null;



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
<<<<<<< HEAD
      delivered: firmRoadmaps.filter((r) => r.status === 'published').length,
      draft: firmRoadmaps.filter((r) => r.status === 'draft').length,
=======
      delivered: firmRoadmaps.filter((r) => r.status === 'delivered').length,
      draft: firmRoadmaps.filter((r) => r.status !== 'delivered').length,
>>>>>>> 1e46cab (chore: lock executive brief render + pdf contracts)
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

<<<<<<< HEAD
    // CANONICAL DIAGNOSTIC STATE: Query diagnostics table
    const [latestDiagnostic] = await db
      .select({
        id: diagnostics.id,
        status: diagnostics.status,
        createdAt: diagnostics.createdAt,
        updatedAt: diagnostics.updatedAt,
      })
      .from(diagnostics)
      .where(eq(diagnostics.tenantId, tenantId))
      .orderBy(desc(diagnostics.createdAt))
      .limit(1);

    // CHECK DISCOVERY STATUS
    const [discoveryDoc] = await db
      .select({ id: tenantDocuments.id })
      .from(tenantDocuments)
      .where(and(
        eq(tenantDocuments.tenantId, tenantId),
        eq(tenantDocuments.category, 'DISCOVERY_SYNTHESIS_V1')
      ))
      .limit(1);

    const discoveryComplete = !!discoveryDoc;

=======
>>>>>>> 1e46cab (chore: lock executive brief render + pdf contracts)
    return res.json({
      tenantSummary: {
        id: tenantData.tenantId,
        name: tenantData.tenantName,
        cohortLabel: tenantData.cohortLabel,
        segment: tenantData.segment,
        region: tenantData.region,
        status: tenantData.status,
<<<<<<< HEAD
        executiveBriefStatus: briefStatus,
        executionPhase,
=======
>>>>>>> 1e46cab (chore: lock executive brief render + pdf contracts)
        businessType: tenantData.businessType,
        teamHeadcount: tenantData.teamHeadcount,
        baselineMonthlyLeads: tenantData.baselineMonthlyLeads,
        firmSizeTier: tenantData.firmSizeTier,
        createdAt: tenantData.tenantCreatedAt,
        notes: tenantData.notes,
        lastDiagnosticId: tenantData.lastDiagnosticId,
        intakeWindowState: tenantData.intakeWindowState,
        intakeSnapshotId: tenantData.intakeSnapshotId,
      },
      diagnosticStatus, // Added for Ticket 5 gating
<<<<<<< HEAD
      latestDiagnostic: latestDiagnostic || null, // CANONICAL: diagnostics table source of truth
      discoveryStatus: {
        complete: discoveryComplete
      },
=======
>>>>>>> 1e46cab (chore: lock executive brief render + pdf contracts)
      owner: owner ? {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        role: owner.role,
        createdAt: owner.createdAt,
      } : null,
      teamMembers: team,

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

export async function getFirmDetailV2(req: AuthRequest<{ tenantId: string }>, res: Response) {
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
        discoveryAcknowledgedAt: tenants.discoveryAcknowledgedAt,
        tenantCreatedAt: tenants.createdAt,
        tenantUpdatedAt: tenants.updatedAt,
        ownerUserId: tenants.ownerUserId,
        intakeWindowState: tenants.intakeWindowState,
      })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenantRow) {
      return res.status(404).json({ error: 'Firm not found' });
    }

    // 1.1 Fetch Executive Brief Status & Derive Phase
    const [execBrief] = await db
      .select({ status: executiveBriefs.status })
      .from(executiveBriefs)
      .where(eq(executiveBriefs.tenantId, tenantId))
      .limit(1);

    const briefStatus = execBrief?.status || null;

    let executionPhase = 'INTAKE_OPEN';
    if (briefStatus === 'APPROVED') {
      executionPhase = 'EXEC_BRIEF_APPROVED';
    } else if (briefStatus === 'DRAFT') {
      executionPhase = 'EXEC_BRIEF_DRAFT';
    } else if (tenantRow.intakeWindowState === 'OPEN') {
      executionPhase = 'INTAKE_OPEN';
    } else if (tenantRow.intakeWindowState === 'CLOSED') {
      // Fallback if closed but no brief (e.g. manual close or legacy)
      executionPhase = 'INTAKE_CLOSED';
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
<<<<<<< HEAD
      .select({
        id: roadmaps.id,
        status: roadmaps.status,
        version: roadmaps.version,
        createdAt: roadmaps.createdAt,
        updatedAt: roadmaps.updatedAt,
        modelJson: roadmaps.modelJson
      })
=======
      .select()
>>>>>>> 1e46cab (chore: lock executive brief render + pdf contracts)
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
        intakeWindowState: tenantRow.intakeWindowState,
        executiveBriefStatus: briefStatus,
        executionPhase,
      },


      engagementSummary: {
        last30d: {
          intakeCompleted: Number(metricsLast30d[0]?.intakeCompleted || 0),
<<<<<<< HEAD
          roadmapsPublished: Number(metricsLast30d[0]?.roadmapsDelivered || 0),
=======
          roadmapsDelivered: Number(metricsLast30d[0]?.roadmapsDelivered || 0),
>>>>>>> 1e46cab (chore: lock executive brief render + pdf contracts)
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
<<<<<<< HEAD
            deliveredAt: lastRoadmap.status === 'delivered' ? lastRoadmap.updatedAt : null,
=======
            deliveredAt: lastRoadmap.deliveredAt,
>>>>>>> 1e46cab (chore: lock executive brief render + pdf contracts)
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

export async function signalReadiness(req: AuthRequest, res: Response) {
  try {
    const { tenantId } = req.params;
    const { signal } = req.body;

    if (!requireExecutiveAuthority(req, res)) return;

    const updates: any = {};
    if (signal === 'knowledge_base') updates.knowledgeBaseReadyAt = new Date();
    if (signal === 'roles') updates.rolesValidatedAt = new Date();
    if (signal === 'exec') updates.execReadyAt = new Date();

    if (Object.keys(updates).length > 0) {
      await db.update(tenants).set(updates).where(eq(tenants.id, tenantId));
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Signal readiness error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}





<<<<<<< HEAD

// ============================================================================
// TRUTH PROBE (Lifecycle State)
// ============================================================================

export async function getTruthProbe(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const { tenantId } = req.query;

    if (!tenantId || typeof tenantId !== 'string') {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Missing or invalid tenantId' });
    }

    // 0. Strict Schema Guard
    const schemaMap: Record<string, any> = {
      tenants,
      intakes,
      executiveBriefs,
      diagnostics,
      discoveryCallNotes,
      sopTickets,
      roadmaps
    };

    const missingSchemas = Object.entries(schemaMap)
      .filter(([key, table]) => !table)
      .map(([key]) => key);

    if (missingSchemas.length > 0) {
      console.error('[TruthProbe] CRITICAL: Schema tables unavailable:', missingSchemas);
      return res.status(503).json({
        error: 'SCHEMA_UNAVAILABLE',
        message: 'Database schema definitions are missing at runtime.',
        missing: missingSchemas
      });
    }

    // 1. Tenant
    console.log('[TruthProbe] Step 1: Tenant');
    const [tenant] = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        status: tenants.status
      })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Tenant not found' });
    }

    // 2. Intake
    console.log('[TruthProbe] Step 2: Intake');
    const [intake] = await db
      .select({
        id: intakes.id,
        status: intakes.status,
        createdAt: intakes.createdAt
      })
      .from(intakes)
      .where(eq(intakes.tenantId, tenant.id))
      .orderBy(desc(intakes.createdAt))
      .limit(1);

    // 3. Executive Brief
    console.log('[TruthProbe] Step 3: Executive Brief');
    const [brief] = await db
      .select({
        id: executiveBriefs.id,
        status: executiveBriefs.status,
        approvedAt: executiveBriefs.approvedAt,
        createdAt: executiveBriefs.createdAt
      })
      .from(executiveBriefs)
      .where(eq(executiveBriefs.tenantId, tenant.id))
      .orderBy(desc(executiveBriefs.createdAt))
      .limit(1);

    // Map Legacy APPROVED to REVIEWED for Canonical V2
    const canonicalBriefStatus = (brief?.status === 'APPROVED') ? 'REVIEWED' : brief?.status;

    // 4. Diagnostic
    console.log('[TruthProbe] Step 4: Diagnostic');
    const [diagnostic] = await db
      .select({
        id: diagnostics.id,
        status: diagnostics.status,
        createdAt: diagnostics.createdAt
      })
      .from(diagnostics)
      .where(eq(diagnostics.tenantId, tenant.id))
      .orderBy(desc(diagnostics.createdAt))
      .limit(1);

    // 5. Discovery Synthesis (Discovery Call Notes)
    console.log('[TruthProbe] Step 5: Discovery');
    const [discovery] = await db
      .select({
        id: discoveryCallNotes.id,
        createdAt: discoveryCallNotes.createdAt
      })
      .from(discoveryCallNotes)
      .where(eq(discoveryCallNotes.tenantId, tenantId))
      .orderBy(desc(discoveryCallNotes.createdAt))
      .limit(1);

    // 5b. Canonical Findings
    console.log('[TruthProbe] Step 5b: Canonical Findings');
    const [findingsArtifact] = await db
      .select({ id: tenantDocuments.id, createdAt: tenantDocuments.createdAt })
      .from(tenantDocuments)
      .where(and(
        eq(tenantDocuments.tenantId, tenantId),
        eq(tenantDocuments.category, 'findings_canonical')
      ))
      .orderBy(desc(tenantDocuments.createdAt))
      .limit(1);

    const [proposedFindingsArtifact] = await db
      .select({ id: tenantDocuments.id, createdAt: tenantDocuments.createdAt })
      .from(tenantDocuments)
      .where(and(
        eq(tenantDocuments.tenantId, tenantId),
        eq(tenantDocuments.category, 'findings_proposed')
      ))
      .orderBy(desc(tenantDocuments.createdAt))
      .limit(1);

    // 6. Tickets (Drafts & SOPs)
    console.log('[TruthProbe] Step 6: Tickets (Stats)');

    // Check for draft tickets first (Stage 6 Canonical)
    const draftStats = await db
      .select({
        status: ticketsDraft.status,
        count: count()
      })
      .from(ticketsDraft)
      .where(eq(ticketsDraft.tenantId, tenant.id))
      .groupBy(ticketsDraft.status);

    const hasDrafts = draftStats.length > 0;

    // Fallback/Legacy: Check sop_tickets
    const ticketStats = await db
      .select({
        status: sopTickets.moderationStatus,
        approved: sopTickets.approved,
        count: count()
      })
      .from(sopTickets)
      .where(eq(sopTickets.tenantId, tenant.id))
      .groupBy(sopTickets.moderationStatus, sopTickets.approved);

    let totalTickets = 0;
    let approvedTickets = 0;
    let rejectedTickets = 0;
    let pendingTickets = 0;

    if (hasDrafts) {
      // Stage 6 Mode: Use Drafts
      totalTickets = draftStats.reduce((sum, s) => sum + (s.count ?? 0), 0);
      pendingTickets = draftStats
        .filter(s => s.status === 'pending')
        .reduce((sum, s) => sum + (s.count ?? 0), 0);
      approvedTickets = draftStats
        .filter(s => s.status === 'accepted')
        .reduce((sum, s) => sum + (s.count ?? 0), 0);
      rejectedTickets = draftStats
        .filter(s => s.status === 'rejected')
        .reduce((sum, s) => sum + (s.count ?? 0), 0);
    } else {
      // Legacy Mode: Use sop_tickets
      totalTickets = ticketStats.reduce((sum, s) => sum + (s.count ?? 0), 0);
      approvedTickets = ticketStats
        .filter(s => s.approved === true)
        .reduce((sum, s) => sum + (s.count ?? 0), 0);
      rejectedTickets = ticketStats
        .filter(s => s.status === 'rejected')
        .reduce((sum, s) => sum + (s.count ?? 0), 0);
      pendingTickets = ticketStats
        .filter(s => s.approved !== true && s.status !== 'rejected')
        .reduce((sum, s) => sum + (s.count ?? 0), 0);
    }

    console.log('[TruthProbe] Step 6b: Tickets (Last)');
    const [lastTicket] = await db
      .select({ generatedAt: sopTickets.createdAt, moderatedAt: sopTickets.moderatedAt })
      .from(sopTickets)
      .where(eq(sopTickets.tenantId, tenant.id))
      .orderBy(desc(sopTickets.createdAt))
      .limit(1);

    // 7. Roadmap
    console.log('[TruthProbe] Step 7: Roadmap');
    const [roadmap] = await db
      .select({
        id: roadmaps.id,
        status: roadmaps.status,
        updatedAt: roadmaps.updatedAt
      })
      .from(roadmaps)
      .where(eq(roadmaps.tenantId, tenant.id))
      .orderBy(desc(roadmaps.createdAt))
      .limit(1);

    // 8. Readiness Computation (Consistent with Gates)
    console.log('[TruthProbe] Step 8: Readiness');
    const blockingReasons: string[] = [];
    // Allow REVIEWED (or Legacy APPROVED mapped to REVIEWED)
    if (canonicalBriefStatus !== 'REVIEWED') blockingReasons.push('NO_REVIEWED_BRIEF');
    if (!diagnostic) blockingReasons.push('NO_DIAGNOSTIC');
    if (!discovery) blockingReasons.push('NO_DISCOVERY_NOTES');
    if (!proposedFindingsArtifact) blockingReasons.push('NO_PROPOSED_FINDINGS');
    if (!findingsArtifact) blockingReasons.push('NO_CANONICAL_FINDINGS');
    if (approvedTickets === 0) blockingReasons.push('NO_APPROVED_TICKETS');

    // Strict sequential gates:
    // Discovery (Execution) requires Synthesis + Diagnostic + Brief (Verified)
    const canRunDiscovery = !!(canonicalBriefStatus === 'REVIEWED' && diagnostic && discovery);

    // Moderation requires active tickets
    const canModerateTickets = totalTickets > 0 && pendingTickets > 0;

    // Finalization requires roadmap + approved tickets
    const canFinalizeRoadmap = !!(roadmap && approvedTickets > 0);

    return res.json({
      tenantId: tenant.id,
      tenantName: tenant.name,
      tenantStatus: tenant.status,

      intake: {
        exists: !!intake,
        latestIntakeId: intake?.id ?? null,
        state: intake?.status ?? null,
        updatedAt: intake?.createdAt?.toISOString() ?? null,
        sufficiencyHint: intake?.status === 'completed' ? 'COMPLETE' : 'INCOMPLETE'
      },

      executiveBrief: {
        exists: !!brief,
        briefId: brief?.id ?? null,
        state: canonicalBriefStatus ?? null,
        approvedAt: brief?.approvedAt?.toISOString() ?? null
      },

      diagnostic: {
        exists: !!diagnostic,
        diagnosticId: diagnostic?.id ?? null,
        state: diagnostic?.status ?? null,
        createdAt: diagnostic?.createdAt?.toISOString() ?? null
      },

      discovery: {
        exists: !!discovery,
        id: discovery?.id || null,
        createdAt: discovery?.createdAt || null
      },
      findings: {
        exists: !!findingsArtifact,
        hasProposed: !!proposedFindingsArtifact,
        proposedId: proposedFindingsArtifact?.id || null,
        id: findingsArtifact?.id || null,
        createdAt: findingsArtifact?.createdAt || null
      },

      tickets: {
        total: totalTickets,
        pending: pendingTickets,
        approved: approvedTickets,
        rejected: rejectedTickets,
        isDraft: hasDrafts,
        lastGeneratedAt: lastTicket?.generatedAt?.toISOString() ?? null,
        lastModeratedAt: lastTicket?.moderatedAt?.toISOString() ?? null
      },

      roadmap: {
        exists: !!roadmap,
        roadmapId: roadmap?.id ?? null,
        state: roadmap?.status ?? null,
        lastUpdatedAt: roadmap?.updatedAt?.toISOString() ?? null,
        isUnlocked: !!roadmap && roadmap.status === 'published'
      },

      readiness: {
        canRunDiscovery,
        canModerateTickets,
        canFinalizeRoadmap,
        blockingReasons
      },

      provenance: {
        computedAt: new Date().toISOString(),
        sources: [
          { field: 'tenant', source: 'tenants (backend/src/db/schema.ts:8)' },
          { field: 'intake', source: 'intakes (backend/src/db/schema.ts:80)' },
          { field: 'executiveBrief', source: 'executive_briefs (backend/src/db/schema.ts:156)' },
          { field: 'diagnostic', source: 'diagnostics (backend/src/db/schema.ts:951)' },
          { field: 'discovery', source: 'discovery_call_notes (backend/src/db/schema.ts:836)' },
          { field: 'tickets', source: 'sop_tickets (backend/src/db/schema.ts:674)' },
          { field: 'roadmap', source: 'roadmaps (backend/src/db/schema.ts:236)' },
          { field: 'readiness', source: 'superadmin.controller.ts:getTruthProbe' }
        ]
      }
    });

  } catch (error: any) {
    console.error('Truth Probe Error:', error);

    const dbErrorCodes = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND'];
    const isDbError = dbErrorCodes.includes(error.code) ||
      error.message?.includes('connect') ||
      error.message?.includes('timeout') ||
      error.message?.includes('orderSelectedFields') ||
      error.message?.includes('Cannot convert undefined or null to object');

    if (isDbError) {
      return res.status(503).json({ error: 'DB_UNAVAILABLE', details: error.message });
    }

    return res.status(500).json({ error: 'Truth Probe failed', details: error.message });
  }
}

// ============================================================================
// META-TICKET v2: EXECUTION PIPELINE ACTIONS
// ============================================================================

export async function lockIntake(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;
    const { tenantId } = req.params;

    const check = await canLockIntake(tenantId);
    if (!check.allowed) {
      return res.status(403).json({ error: 'GATE_LOCKED', message: check.reason });
    }

    await db.update(tenants)
      .set({
        intakeClosedAt: new Date(),
      })
      .where(eq(tenants.id, tenantId));

    await db.insert(auditEvents).values({
      tenantId,
      actorUserId: req.user!.id || null,
      actorRole: req.user?.role,
      eventType: 'INTAKE_LOCKED',
      entityType: 'tenant',
      entityId: tenantId,
      metadata: { lockedAt: new Date() }
    });

    return res.json({ success: true });
  } catch (error: any) {
    console.error('Lock Intake Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}

export async function generateDiagnostics(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;
    const { tenantId } = req.params;

    const check = await canGenerateDiagnostics(tenantId);
    if (!check.allowed) {
      return res.status(403).json({ error: 'GATE_LOCKED', message: check.reason });
    }

    // 1. Build Context
    const normalized = await buildNormalizedIntakeContext(tenantId);

    // 2. Generate (SOP-01 Engine)
    const outputs = await generateSop01Outputs(normalized);

    // 3. Persist outputs to the diagnostic record

    // 4. Create/Update Diagnostic Record
    // Check for existing 'generated' diagnostic
    const [existing] = await db.select().from(diagnostics)
      .where(and(eq(diagnostics.tenantId, tenantId), eq(diagnostics.status, 'generated')))
      .limit(1);

    let diagnosticId = existing?.id;
    let isNewDiagnostic = false;

    const diagnosticValues = {
      tenantId,
      sopVersion: 'SOP-01',
      status: 'generated' as const,
      overview: { markdown: outputs.companyDiagnosticMap },
      aiOpportunities: { markdown: outputs.aiLeverageMap },
      roadmapSkeleton: { markdown: outputs.roadmapSkeleton },
      discoveryQuestions: { list: outputs.discoveryCallQuestions },
      generatedByUserId: req.user!.id || null,
      updatedAt: new Date()
    };

    if (!diagnosticId) {
      const [newDiag] = await db.insert(diagnostics).values(diagnosticValues).returning();
      diagnosticId = newDiag.id;
      isNewDiagnostic = true;

      // Update tenant lastDiagnosticId
      await db.update(tenants)
        .set({ lastDiagnosticId: diagnosticId })
        .where(eq(tenants.id, tenantId));
    } else {
      // Update existing record with fresh outputs
      await db.update(diagnostics)
        .set(diagnosticValues)
        .where(eq(diagnostics.id, diagnosticId));
    }

    // ✅ Only insert audit event for new diagnostics (prevents duplicates)
    if (isNewDiagnostic) {
      await db.insert(auditEvents).values({
        tenantId,
        actorUserId: req.user!.id || null,
        actorRole: req.user?.role,
        eventType: 'DIAGNOSTIC_GENERATED',
        entityType: 'diagnostic',
        entityId: diagnosticId,
        metadata: { version: 'v2' }
      });
    }

    return res.json({ success: true, diagnosticId });
  } catch (error: any) {
    console.error('Generate Diagnostics Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}

export async function lockDiagnostic(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;
    const { diagnosticId } = req.params;

    const check = await canLockDiagnostic(diagnosticId);
    if (!check.allowed) {
      return res.status(403).json({ error: 'GATE_LOCKED', message: check.reason });
    }

    await db.update(diagnostics)
      .set({ status: 'locked' })
      .where(eq(diagnostics.id, diagnosticId));

    // ✅ Sync to tenant_documents once LOCKED (Requirement: Tenant sees locked artifacts)
    const [diag] = await db.select().from(diagnostics).where(eq(diagnostics.id, diagnosticId)).limit(1);
    if (diag) {
      const outputs = {
        sop01DiagnosticMarkdown: diag.overview,
        sop01AiLeverageMarkdown: diag.aiOpportunities,
        sop01RoadmapSkeletonMarkdown: diag.roadmapSkeleton,
        sop01DiscoveryQuestionsMarkdown: diag.discoveryQuestions
      };
      await persistSop01OutputsForTenant(diag.tenantId, outputs as any);
    }

    // Audit
    await db.insert(auditEvents).values({
      tenantId: null,
      actorUserId: req.user!.id || null,
      actorRole: req.user?.role,
      eventType: 'DIAGNOSTIC_LOCKED',
      entityType: 'diagnostic',
      entityId: diagnosticId
    });

    return res.json({ success: true });
  } catch (error: any) {
    console.error('Lock Diagnostic Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}

// ... imports assumed ...

export async function publishDiagnostic(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;
    const { diagnosticId } = req.params;

    const check = await canPublishDiagnostics(diagnosticId);
    if (!check.allowed) {
      return res.status(403).json({ error: 'GATE_LOCKED', message: check.reason });
    }

    // Fetch diagnostic to get tenantId
    const [diag] = await db.select().from(diagnostics).where(eq(diagnostics.id, diagnosticId)).limit(1);
    if (!diag) return res.status(404).json({ error: 'Diagnostic not found' });

    // Demote any currently published diagnostics to 'archived'
    // Note: We need 'and' from drizzle-orm. If not available, we can filter differently or assume it's imported.
    // Assuming 'and' is available or blindly adding it might break if not imported.
    // I will try to use a pragmatic approach: Find published ones and update them by ID.
    const publishedDiags = await db.select().from(diagnostics).where(eq(diagnostics.tenantId, diag.tenantId));
    const toArchive = publishedDiags.filter(d => d.status === 'published' && d.id !== diagnosticId);

    for (const d of toArchive) {
      await db.update(diagnostics).set({ status: 'archived' }).where(eq(diagnostics.id, d.id));
    }

    // Publish the target diagnostic
    await db.update(diagnostics)
      .set({ status: 'published' })
      .where(eq(diagnostics.id, diagnosticId));

    // Audit
    await db.insert(auditEvents).values({
      tenantId: diag.tenantId, // Use the fetched tenantId
      actorUserId: req.user!.id || null,
      actorRole: req.user?.role,
      eventType: 'DIAGNOSTIC_PUBLISHED',
      entityType: 'diagnostic',
      entityId: diagnosticId
    });

    return res.json({ success: true });
  } catch (error: any) {
    console.error('Publish Diagnostic Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}

export async function getDiscoveryNotes(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;
    const { tenantId } = req.params;

    const [discoveryRecord] = await db
      .select({ notes: discoveryCallNotes.notes, updatedAt: discoveryCallNotes.updatedAt })
      .from(discoveryCallNotes)
      .where(eq(discoveryCallNotes.tenantId, tenantId))
      .orderBy(desc(discoveryCallNotes.createdAt))
      .limit(1);

    if (!discoveryRecord) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'No discovery notes found for this firm.' });
    }

    return res.json({
      notes: discoveryRecord.notes,
      updatedAt: discoveryRecord.updatedAt?.toISOString() || null
    });
  } catch (error: any) {
    console.error('Get Discovery Notes Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}

export async function ingestDiscoveryNotes(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;
    const { tenantId } = req.params;
    const { notes } = req.body; // Expects JSON stringified CanonicalDiscoveryNotes

    const check = await canIngestDiscoveryNotes(tenantId);
    if (!check.allowed) {
      return res.status(403).json({ error: 'GATE_LOCKED', message: check.reason });
    }

    if (!notes) {
      return res.status(400).json({ error: 'Missing notes content' });
    }

    // 1. Validation Refactor (Enforcement)
    let parsedNotes: any;
    try {
      if (typeof notes === 'string') {
        parsedNotes = JSON.parse(notes);
      } else {
        parsedNotes = notes; // Already object
      }
    } catch (e) {
      return res.status(400).json({ error: 'INVALID_JSON', message: 'Notes must be valid JSON.' });
    }

    // 2. Shape Alignment (V2: Accept RAW Capture Shape or Canonical Wrapper)
    let canonicalNotes: CanonicalDiscoveryNotes;

    // Check for RAW capture shape (Option 1 preference)
    if (parsedNotes.rawNotes || (parsedNotes.sessionDate && parsedNotes.rawNotes !== undefined)) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[ingestDiscoveryNotes] Detected RAW Capture Shape');
      }
      canonicalNotes = {
        sessionMetadata: {
          date: parsedNotes.sessionDate || new Date().toISOString().split('T')[0],
          duration: parsedNotes.durationMinutes?.toString() || '',
          attendees: parsedNotes.attendees || '',
          firmName: '' // Will be updated if needed or left blank
        },
        currentBusinessReality: parsedNotes.rawNotes || '',
        primaryFrictionPoints: '',
        desiredFutureState: '',
        technicalOperationalEnvironment: '',
        explicitClientConstraints: ''
      };
    } else {
      // Treat as Canonical Discovery Notes (either wrapped or direct)
      canonicalNotes = parsedNotes;
    }

    // 3. Schema Enforcement (Relaxed for Stage 4 RAW)
    const REQUIRED_TRUTH_BUCKETS = ['currentBusinessReality'];
    const issues: { path: string; message: string }[] = [];

    if (!canonicalNotes.sessionMetadata) {
      issues.push({ path: 'sessionMetadata', message: 'Missing session metadata object.' });
    } else if (!canonicalNotes.sessionMetadata.date) {
      issues.push({ path: 'sessionMetadata.date', message: 'Session date is required.' });
    }

    REQUIRED_TRUTH_BUCKETS.forEach(field => {
      if (!canonicalNotes[field as keyof CanonicalDiscoveryNotes]) {
        issues.push({ path: field, message: `Field '${field}' is required for raw capture.` });
      }
    });

    if (issues.length > 0) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[ingestDiscoveryNotes] SCHEMA_VIOLATION:', issues);
      }
      return res.status(400).json({
        error: 'SCHEMA_VIOLATION',
        message: `Validation failed for ${issues.length} fields.`,
        issues
      });
    }

    // Assign back to parsedNotes for downstream services
    parsedNotes = canonicalNotes;

    // 3. Persist Immutable Truth
    // Stores as JSON string to preserve structure in text column
    const canonicalPayload = JSON.stringify(parsedNotes);

    const [discoveryRecord] = await db.insert(discoveryCallNotes).values({
      tenantId,
      notes: canonicalPayload,
      status: 'ingested',
      createdByUserId: req.user!.id || null,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning({ id: discoveryCallNotes.id });

    // 4. Trigger Findings Extraction (F1-F4)
    // Dynamic import to avoid circular dep issues in this monolithic file
    const { FindingsService } = await import('../services/findings.service');

    // Safety check for import
    if (!FindingsService) {
      throw new Error('FindingsService failed to load');
    }

    const findingsObject = FindingsService.extractFindings(tenantId, discoveryRecord.id, parsedNotes);

    // Persist Proposed Findings Artifact (Draft for review)
    await db.insert(tenantDocuments).values({
      tenantId,
      category: 'findings_proposed',
      title: 'Proposed Findings (Auto-Generated)',
      filename: `findings-proposed-${discoveryRecord.id}.json`,
      originalFilename: `findings-proposed-${discoveryRecord.id}.json`,
      description: 'Deterministic extraction from Discovery Notes (Awaiting Review)',
      content: JSON.stringify(findingsObject),
      fileSize: Buffer.byteLength(JSON.stringify(findingsObject)),
      filePath: 'virtual://findings', // Virtual path
      uploadedBy: req.user!.id || null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Audit
    await db.insert(auditEvents).values({
      tenantId,
      actorUserId: req.user!.id || null,
      actorRole: req.user?.role,
      eventType: 'DISCOVERY_NOTES_INGESTED_AND_COMPILED',
      entityType: 'tenant',
      entityId: tenantId,
      metadata: {
        schemaVersion: 'CANONICAL_V1',
        findingsCount: findingsObject.findings.length
      }
    });

    return res.json({ success: true });

  } catch (error: any) {
    console.error('Ingest Discovery Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}

/**
 * GET /api/superadmin/diagnostics/:diagnosticId/artifacts
 * Returns diagnostic with all artifacts for modal display
 */
export async function getDiagnosticArtifacts(req: AuthRequest, res: Response) {
  try {
    const { diagnosticId } = req.params;

    if (!diagnosticId) {
      return res.status(400).json({ error: 'Diagnostic ID is required' });
    }

    // Fetch diagnostic with all artifacts
    const [diagnostic] = await db
      .select()
      .from(diagnostics)
      .where(eq(diagnostics.id, diagnosticId))
      .limit(1);

    if (!diagnostic) {
      return res.status(404).json({
        error: 'DIAGNOSTIC_NOT_FOUND',
        message: 'No diagnostic found with this ID.'
      });
    }

    // Return diagnostic with artifacts structured for the modal
    return res.status(200).json({
      diagnostic: {
        id: diagnostic.id,
        tenantId: diagnostic.tenantId,
        sopVersion: diagnostic.sopVersion,
        status: diagnostic.status,
        createdAt: diagnostic.createdAt,
        updatedAt: diagnostic.updatedAt,
        approvedAt: diagnostic.approvedAt,
        generatedByUserId: diagnostic.generatedByUserId,
        approvedByUserId: diagnostic.approvedByUserId,
      },
      outputs: {
        overview: diagnostic.overview,
        aiOpportunities: diagnostic.aiOpportunities,
        roadmapSkeleton: diagnostic.roadmapSkeleton,
        discoveryQuestions: diagnostic.discoveryQuestions,
      }
    });

  } catch (error: any) {
    console.error('[Diagnostic Artifacts] Get error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      details: 'Failed to retrieve diagnostic artifacts.'
    });
  }
}
/**
 * POST /api/superadmin/firms/:tenantId/assisted-synthesis/generate-proposals
 * Generates proposed findings using LLM synthesis of all artifacts
 */
export async function generateAssistedProposals(req: AuthRequest, res: Response) {
  const requestId = randomUUID(); // PHASE 1: Request correlation

  try {
    if (!requireSuperAdmin(req, res)) return;
    const { tenantId } = req.params;

    console.log(`[generateAssistedProposals:${requestId}] Request for tenant ${tenantId}`);

    // Dynamic import to avoid circular dependencies
    const { AssistedSynthesisProposalsService, ProposalGenerationError } = await import('../services/assistedSynthesisProposals.service');

    // Generate proposals using LLM (with requestId for tracing)
    const draft = await AssistedSynthesisProposalsService.generateProposals(tenantId);

    // Persist to tenant_documents (PHASE 2.5)
    try {
      const [existing] = await db
        .select()
        .from(tenantDocuments)
        .where(and(
          eq(tenantDocuments.tenantId, tenantId),
          eq(tenantDocuments.category, 'findings_proposed')
        ))
        .orderBy(desc(tenantDocuments.createdAt))
        .limit(1);

      // Archive previous if exists
      if (existing) {
        await db
          .update(tenantDocuments)
          .set({ category: 'findings_proposed_archived' })
          .where(eq(tenantDocuments.id, existing.id));
      }

      // Insert new proposed findings
      await db.insert(tenantDocuments).values({
        tenantId,
        category: 'findings_proposed',
        title: 'Proposed Findings Draft',
        filename: `findings-proposed-${Date.now()}.json`,
        originalFilename: 'findings-proposed.json',
        filePath: `/virtual/findings-proposed-${Date.now()}.json`,
        fileSize: JSON.stringify(draft).length,
        content: JSON.stringify(draft),
        uploadedBy: req.user!.id || null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log(`[generateAssistedProposals:${requestId}] Successfully persisted ${draft.items.length} proposals`);
    } catch (dbError: any) {
      console.error(`[generateAssistedProposals:${requestId}] DB persist failed:`, dbError);
      return res.status(500).json({
        code: 'PROPOSALS_PERSIST_FAILED',
        message: 'Generated proposals but failed to save. Retry or contact support.',
        requestId,
        details: dbError.message
      });
    }

    return res.json(draft);
  } catch (error: any) {
    console.error(`[generateAssistedProposals:${requestId}] Error:`, error);

    // PHASE 1 & 2: Structured error responses
    if (error.name === 'ProposalGenerationError') {
      const statusCode =
        error.code === 'SOURCE_ARTIFACTS_MISSING' ? 400 :
          error.code === 'INVALID_DISCOVERY_NOTES' ? 400 :
            error.code === 'LLM_CONFIG_MISSING' ? 500 :
              error.code === 'LLM_API_FAILED' ? 502 :
                error.code === 'LLM_BAD_RESPONSE' ? 502 :
                  error.code === 'LLM_INVALID_SCHEMA' ? 502 :
                    500;

      return res.status(statusCode).json({
        code: error.code,
        message: error.message,
        requestId,
        details: error.details
      });
    }

    // Unexpected error
    return res.status(500).json({
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred. Contact support.',
      requestId,
      details: error.message
    });
  }
}

/**
 * GET /api/superadmin/firms/:tenantId/findings/proposed
 * Returns the latest proposed findings for review
 */
export async function getProposedFindings(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;
    const { tenantId } = req.params;

    const [proposed] = await db
      .select()
      .from(tenantDocuments)
      .where(and(
        eq(tenantDocuments.tenantId, tenantId),
        eq(tenantDocuments.category, 'findings_proposed')
      ))
      .orderBy(desc(tenantDocuments.createdAt))
      .limit(1);

    if (!proposed || !proposed.content) {
      // Return empty state indicating no proposals generated yet
      return res.json({
        version: 'v2.0-proposal-1',
        items: [],
        generatedBy: 'none',
        sourceArtifactIds: [],
        createdAt: null,
        requiresGeneration: true
      });
    }

    const draft = JSON.parse(proposed.content);
    return res.json(draft);
  } catch (error: any) {
    console.error('Get Proposed Findings Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * POST /api/superadmin/firms/:tenantId/findings/declare
 * Promotes reviewed findings to canonical status
 */
export async function declareCanonicalFindings(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;
    const { tenantId } = req.params;
    const { findings } = req.body;

    if (!findings || !Array.isArray(findings)) {
      return res.status(400).json({ error: 'Missing findings data' });
    }

    const [discoveryRecord] = await db
      .select()
      .from(discoveryCallNotes)
      .where(eq(discoveryCallNotes.tenantId, tenantId))
      .orderBy(desc(discoveryCallNotes.createdAt))
      .limit(1);

    if (!discoveryRecord) {
      return res.status(404).json({ error: 'No discovery context found' });
    }

    const findingsObject = {
      id: randomUUID(),
      tenantId,
      generatedAt: new Date(),
      discoveryRef: discoveryRecord.id,
      findings
    };

    // Persist Canonical Findings
    await db.insert(tenantDocuments).values({
      tenantId,
      category: 'findings_canonical',
      title: 'Canonical Findings (Operator Reviewed)',
      filename: `findings-canonical-${discoveryRecord.id}.json`,
      originalFilename: `findings-canonical-${discoveryRecord.id}.json`,
      description: 'Promoted from Stage 5 Assisted Synthesis',
      content: JSON.stringify(findingsObject),
      fileSize: Buffer.byteLength(JSON.stringify(findingsObject)),
      filePath: 'virtual://findings',
      uploadedBy: req.user!.id || null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Audit
    await db.insert(auditEvents).values({
      tenantId,
      actorUserId: req.user!.id || null,
      actorRole: req.user?.role,
      eventType: 'FINDINGS_DECLARED_CANONICAL',
      entityType: 'tenant',
      entityId: tenantId,
      metadata: {
        findingsCount: findings.length
      }
    });

    return res.json({ success: true });
  } catch (error: any) {
    console.error('Declare Canonical Findings Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}

// ============================================================================
// POST /api/superadmin/firms/:tenantId/ticket-moderation/activate
// ============================================================================

export async function activateTicketModeration(req: AuthRequest, res: Response) {
  const { tenantId } = req.params;
  console.log(`[Stage 6] activateTicketModeration triggered for tenant: ${tenantId}`);
  try {
    if (!requireSuperAdmin(req, res)) {
      console.warn(`[Stage 6] Unauthorized attempt by user: ${req.user?.id}`);
      return;
    }

    // 1. Validation: Canonical findings must exist
    console.log(`[Stage 6] Checking for canonical findings for tenant: ${tenantId}`);
    const [canonicalDoc] = await db
      .select()
      .from(tenantDocuments)
      .where(
        and(
          eq(tenantDocuments.tenantId, tenantId),
          eq(tenantDocuments.category, 'findings_canonical')
        )
      )
      .orderBy(desc(tenantDocuments.createdAt))
      .limit(1);

    if (!canonicalDoc) {
      console.error(`[Stage 6] Error: Canonical findings not found for ${tenantId}`);
      return res.status(400).json({ error: 'Canonical findings not found. Declare findings first.' });
    }
    console.log(`[Stage 6] Found canonical doc: ${canonicalDoc.id}`);

    // 2. Check for existing active session
    console.log(`[Stage 6] Checking for existing active session for ${tenantId}`);
    const [existingSession] = await db
      .select()
      .from(ticketModerationSessions)
      .where(
        and(
          eq(ticketModerationSessions.tenantId, tenantId),
          eq(ticketModerationSessions.status, 'active')
        )
      )
      .limit(1);

    if (existingSession) {
      console.warn(`[Stage 6] Active session already exists for ${tenantId}: ${existingSession.id}`);
      return res.status(400).json({ error: 'Ticket moderation session is already active.' });
    }

    // 3. Create Session & Materialize Tickets (Atomic logic)
    console.log(`[Stage 6] Materializing tickets from canonical findings...`);
    const content = JSON.parse(canonicalDoc.content || '{}');
    const sourceFindings = content.findings || [];
    console.log(`[Stage 6] Source findings count: ${sourceFindings.length}`);

    // Support both 'accepted' status AND implicit acceptance (anything in canon is accepted)
    // 3. Generate tickets via Legacy AI Architect (SOP-01)
    // Fetch SOP artifacts
    console.log(`[Stage 6] Fetching SOP-01 artifacts...`);
    const sopDocs = await db.select().from(tenantDocuments).where(and(eq(tenantDocuments.tenantId, tenantId), eq(tenantDocuments.category, 'sop_output')));

    const sop01Artifacts = {
      diagnosticMap: sopDocs.find(d => d.outputNumber === 'DIAGNOSTIC_MAP'),
      aiLeverageMap: sopDocs.find(d => d.outputNumber === 'AI_LEVERAGE_MAP'),
      roadmapSkeleton: sopDocs.find(d => d.outputNumber === 'ROADMAP_SKELETON'),
      discoveryQuestions: sopDocs.find(d => d.outputNumber === 'DISCOVERY_QUESTIONS'),
    };

    // Validate we have enough to generate
    if (!sop01Artifacts.diagnosticMap || !sop01Artifacts.roadmapSkeleton) {
      console.error(`[Stage 6] Missing artifacts: diagMap=${!!sop01Artifacts.diagnosticMap}, skeleton=${!!sop01Artifacts.roadmapSkeleton}`);
      return res.status(409).json({
        error: 'MISSING_ARTIFACTS',
        message: 'Cannot generate tickets: SOP-01 artifacts (Diagnostic Map, Roadmap Skeleton) are missing. Please ensure diagnostic interpretation is complete.'
      });
    }
    // Fetch Tenant Data for AI Context
    const [tenantData] = await db
      .select({
        tenantName: tenants.name,
        firmSizeTier: tenants.firmSizeTier,
        teamHeadcount: tenants.teamHeadcount
      })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenantData) {
      console.error(`[Stage 6] Tenant not found for context: ${tenantId}`);
      return res.status(404).json({ error: 'Tenant data not found' });
    }

    let rawTickets: ParsedTicket[] = [];
    try {
      const diagMap = {
        tenantId,
        firmName: tenantData.tenantName || 'Firm',
        firmSize: tenantData.firmSizeTier || 'Small',
        employeeCount: tenantData.teamHeadcount || 5
      };

      console.log(`[Stage 6] invoking legacy AI Ticket Architect for ${tenantId}...`);
      rawTickets = await generateRawTickets(tenantId, diagMap, sop01Artifacts);
      console.log(`[Stage 6] Raw tickets generated: ${rawTickets.length}`);
    } catch (e: any) {
      if (e instanceof InventoryEmptyError) {
        console.warn(`[Stage 6] Fail-Closed: Inventory Empty for ${tenantId}. Skipping OpenAI.`);
        return res.status(409).json({
          error: 'INVENTORY_EMPTY',
          message: 'No inventory items could be extracted from SOP artifacts. Check artifact format.',
          debug: e.debug
        });
      }
      console.error('[Stage 6] AI Ticket Generation Failed:', e);
      return res.status(502).json({ error: 'AI_GENERATION_FAILED', message: e.message });
    }

    const { session, draftCount } = await db.transaction(async (tx) => {
      const [newSession] = await tx.insert(ticketModerationSessions).values({
        tenantId,
        sourceDocId: canonicalDoc.id,
        sourceDocVersion: 'v1.0',
        status: 'active',
        startedBy: req.user!.id,
      }).returning();

      const ticketsToCreate = rawTickets.map((t, idx) => ({
        tenantId,
        moderationSessionId: newSession.id,
        findingId: `ai-gen-${randomUUID().substring(0, 8)}`, // Synthetic ID as AI output is new creation
        findingType: 'AI_SOP_GEN',
        ticketType: 'Implementation',
        title: t.title.substring(0, 255),
        description: t.description,
        status: 'pending',
        evidenceRefs: [],

        // Rich Fields (Stage 6)
        category: t.category,
        tier: t.tier,
        ghlImplementation: t.ghl_implementation,
        implementationSteps: t.implementation_steps, // ParsedTicket types is string[] | undefined, schema is json
        successMetric: t.success_metric,
        roiNotes: t.roi_notes,
        timeEstimateHours: t.time_estimate_hours || 0,
        sprint: t.sprint || 30,
        painSource: 'AI Diagnostic Analysis'
      }));

      if (ticketsToCreate.length > 0) {
        await tx.insert(ticketsDraft).values(ticketsToCreate as any);
      }

      return { session: newSession, draftCount: ticketsToCreate.length };
    });

    // 4. Audit
    await db.insert(auditEvents).values({
      tenantId,
      actorUserId: req.user!.id,
      actorRole: req.user?.role,
      eventType: AUDIT_EVENT_TYPES.TICKET_MODERATION_ACTIVATED,
      entityType: 'ticket_moderation_session',
      entityId: session.id,
      metadata: {
        sourceDocId: session.sourceDocId,
        draftTicketCount: draftCount,
      }
    });

    return res.json({
      status: 'activated',
      sessionId: session.id,
      draftTicketCount: draftCount,
    });
  } catch (error: any) {
    console.error('Activate Ticket Moderation Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}

/**
 * GET /api/superadmin/firms/:tenantId/ticket-moderation/active
 * Returns active session + draft tickets
 */
export async function getActiveModerationSession(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;
    const { tenantId } = req.params;

    const [session] = await db
      .select()
      .from(ticketModerationSessions)
      .where(
        and(
          eq(ticketModerationSessions.tenantId, tenantId),
          eq(ticketModerationSessions.status, 'active')
        )
      )
      .limit(1);

    if (!session) {
      return res.status(404).json({ error: 'No active moderation session found.' });
    }

    const tickets = await db
      .select()
      .from(ticketsDraft)
      .where(eq(ticketsDraft.moderationSessionId, session.id))
      .orderBy(asc(ticketsDraft.createdAt));

    return res.json({ session, tickets });
  } catch (error: any) {
    console.error('Get Active Moderation Session Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

// ============================================================================
// ASSISTED SYNTHESIS AGENT ENDPOINTS (Stage 5 - Bounded Persistence)
// ============================================================================

/**
 * GET /api/superadmin/me
 * Returns SuperAdmin user context (for auth verification in agent/modal contexts)
 */
export async function getSuperAdminMe(req: AuthRequest, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;

    return res.json({
      user: {
        id: req.user!.id,
        email: req.user!.email,
        role: req.user!.role,
        isInternal: req.user!.isInternal || false
      },
      tenantId: null,
      authority: 'superadmin'
    });
  } catch (error: any) {
    console.error('Get SuperAdmin Me Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * GET /api/superadmin/firms/:tenantId/assisted-synthesis/agent/session
 * Get or create agent session for Current Facts resolution
 */
export async function getAgentSession(req: AuthRequest, res: Response) {
  const requestId = randomUUID();

  try {
    if (!requireSuperAdmin(req, res)) return;
    const { tenantId } = req.params;
    const { contextVersion } = req.query;

    console.log(`[getAgentSession:${requestId}] Request for tenant ${tenantId}`);

    const { AssistedSynthesisAgentService } = await import('../services/assistedSynthesisAgent.service');

    const session = await AssistedSynthesisAgentService.getOrCreateSession(
      tenantId,
      contextVersion as string || 'default',
      requestId
    );

    return res.json(session);
  } catch (error: any) {
    console.error(`[getAgentSession:${requestId}] Error:`, error);

    if (error.name === 'AgentOperationError') {
      const statusCode = error.code === 'LLM_CONFIG_MISSING' ? 500 : 500;
      return res.status(statusCode).json({
        code: error.code,
        message: error.message,
        requestId,
        details: error.details
      });
    }

    return res.status(500).json({
      code: 'UNKNOWN_ERROR',
      message: 'Failed to load agent session.',
      requestId,
      details: error.message
    });
  }
}

/**
 * POST /api/superadmin/firms/:tenantId/assisted-synthesis/agent/messages
 * Send message to agent and get response
 */
export async function sendAgentMessage(req: AuthRequest, res: Response) {
  const requestId = randomUUID();

  try {
    if (!requireSuperAdmin(req, res)) return;
    const { tenantId } = req.params;
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({
        code: 'INVALID_REQUEST',
        message: 'sessionId and message are required.',
        requestId
      });
    }

    console.log(`[sendAgentMessage:${requestId}] Request for tenant ${tenantId}, session ${sessionId}`);

    const { AssistedSynthesisAgentService, AgentOperationError } = await import('../services/assistedSynthesisAgent.service');

    const result = await AssistedSynthesisAgentService.sendMessage(
      tenantId,
      sessionId,
      message,
      requestId
    );

    return res.json({ ...result, requestId });
  } catch (error: any) {
    console.error(`[sendAgentMessage:${requestId}] Error:`, error);

    if (error.name === 'AgentOperationError') {
      const statusCode =
        error.code === 'LLM_CONFIG_MISSING' ? 500 :
          error.code === 'LLM_API_FAILED' ? 502 :
            error.code === 'LLM_BAD_RESPONSE' ? 502 :
              500;

      return res.status(statusCode).json({
        code: error.code,
        message: error.message,
        requestId,
        details: error.details
      });
    }

    return res.status(500).json({
      code: 'UNKNOWN_ERROR',
      message: 'Failed to send message to agent.',
      requestId,
      details: error.message
    });
  }
}

/**
 * POST /api/superadmin/firms/:tenantId/assisted-synthesis/agent/reset
 * Reset agent session (clear all messages)
 */
export async function resetAgentSession(req: AuthRequest, res: Response) {
  const requestId = randomUUID();

  try {
    if (!requireSuperAdmin(req, res)) return;
    const { tenantId } = req.params;
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        code: 'INVALID_REQUEST',
        message: 'sessionId is required.',
        requestId
      });
    }

    console.log(`[resetAgentSession:${requestId}] Request for tenant ${tenantId}, session ${sessionId}`);

    const { AssistedSynthesisAgentService } = await import('../services/assistedSynthesisAgent.service');

    await AssistedSynthesisAgentService.resetSession(tenantId, sessionId, requestId);

    return res.json({ success: true, requestId });
  } catch (error: any) {
    console.error(`[resetAgentSession:${requestId}] Error:`, error);

    return res.status(500).json({
      code: 'UNKNOWN_ERROR',
      message: 'Failed to reset agent session.',
      requestId,
      details: error.message
    });
  }
}
=======
import { Response } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db';
import { users, intakes, tenants, roadmaps, auditEvents, tenantDocuments, discoveryCallNotes, roadmapSections, ticketPacks, ticketInstances, tenantMetricsDaily, webinarRegistrations, implementationSnapshots, roadmapOutcomes, agentConfigs, agentThreads, webinarSettings, diagnostics, executiveBriefs } from '../db/schema';
import { eq, and, sql, count, desc, asc } from 'drizzle-orm';
import { AuthRequest } from '../middleware/auth';
import path from 'path';
import fs from 'fs/promises';
import { generateTicketPackForRoadmap } from '../services/ticketPackGenerator.service';
import { extractRoadmapMetadata } from '../services/roadmapMetadataExtractor.service';
import { ImplementationMetricsService } from '../services/implementationMetrics.service';
import { getOrCreateRoadmapForTenant } from '../services/roadmapOs.service';
import { refreshVectorStoreContent } from '../services/tenantVectorStore.service';
import { getModerationStatus } from '../services/ticketModeration.service';
import { AUDIT_EVENT_TYPES } from '../constants/auditEventTypes';
import { AuthorityCategory } from '@roadmap/shared';
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// ============================================================================
// HELPER: Check SuperAdmin Permission
// ============================================================================

/**
 * Helper to ensure the user is part of the Consulting Team (SuperAdmin or Delegate)
 */
function requireConsultant(req: AuthRequest, res: Response): boolean {
  const allowedRoles = ['superadmin', 'delegate', 'exec_sponsor'];
  if (!req.user || !req.user.isInternal || !allowedRoles.includes(req.user.role as string)) {
    res.status(403).json({ error: 'Consulting Team access required' });
    return false;
  }
  return true;
}

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

export async function getOverview(req: AuthRequest<any, any, any, { cohortLabel?: string }>, res: Response) {
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
// GET ACTIVITY FEED
// ============================================================================

export async function getActivityFeed(req: AuthRequest<any, any, any, { limit?: string }>, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const limit = parseInt(req.query.limit || '50', 10);

    // Fetch recent audit events with actor and tenant information
    const events = await db
      .select({
        id: auditEvents.id,
        eventType: auditEvents.eventType,
        entityType: auditEvents.entityType,
        metadata: auditEvents.metadata,
        createdAt: auditEvents.createdAt,
        actorName: users.name,
        actorRole: auditEvents.actorRole,
        tenantId: tenants.id,
        tenantName: tenants.name,
      })
      .from(auditEvents)
      .leftJoin(users, eq(auditEvents.actorUserId, users.id))
      .leftJoin(tenants, eq(auditEvents.tenantId, tenants.id))
      .orderBy(desc(auditEvents.createdAt))
      .limit(limit);

    // Transform events into activity feed format
    const activities = events.map((event) => {
      const actor = event.actorName || 'System';
      const action = formatEventAction(event.eventType, event.metadata);
      const target = event.tenantName || 'System';

      return {
        id: event.id,
        actor,
        action,
        target,
        tenantId: event.tenantId,
        timestamp: event.createdAt,
        type: event.entityType || 'system',
      };
    });

    return res.json({ activities });
  } catch (error) {
    console.error('Get activity feed error:', error);
    return res.status(500).json({ error: 'Failed to fetch activity feed' });
  }
}

// Helper function to format event types into readable actions
function formatEventAction(eventType: string, metadata: any): string {
  const metadataObj = metadata as Record<string, any> || {};

  switch (eventType) {
    case 'intake_completed':
      return 'completed Intake';
    case 'intake_reopened':
      return 'reopened Intake';
    case 'diagnostic_generated':
      return 'generated SOP-01 Diagnostic';
    case 'roadmap_created':
      return 'created Roadmap';
    case 'roadmap_status_changed':
      return `updated Roadmap to ${metadataObj.newStatus || 'new status'}`;
    case 'discovery_acknowledged':
      return 'acknowledged Discovery';
    case 'intake_window_closed':
      return 'closed Intake Window';
    case 'intake_window_reopened':
      return 'reopened Intake Window';
    case 'exec_ready_approved':
      return 'approved for Execution';
    case 'ticket_pack_generated':
      return 'generated Ticket Pack';
    default:
      return eventType.replace(/_/g, ' ');
  }
}


export async function updateIntakeCoaching(req: AuthRequest<{ intakeId: string }, any, { coachingFeedback: any }>, res: Response) {
  try {
    if (!requireConsultant(req, res)) return;

    const { intakeId } = req.params;
    const { coachingFeedback } = req.body;

    const [intake] = await db
      .select({
        id: intakes.id,
        tenantId: intakes.tenantId,
      })
      .from(intakes)
      .where(eq(intakes.id, intakeId))
      .limit(1);

    if (!intake) {
      return res.status(404).json({ error: 'Intake not found' });
    }

    await db
      .update(intakes)
      .set({
        coachingFeedback,
      })
      .where(eq(intakes.id, intakeId));

    return res.json({ ok: true });
  } catch (error) {
    console.error('Update intake coaching error:', error);
    return res.status(500).json({ error: 'Failed to update coaching feedback' });
  }
}

export async function reopenIntake(req: AuthRequest<{ intakeId: string }>, res: Response) {
  try {
    if (!requireConsultant(req, res)) return;
    if (!requireExecutiveAuthority(req, res)) return;

    const { intakeId } = req.params;

    const [intake] = await db
      .select({
        id: intakes.id,
        tenantId: intakes.tenantId,
      })
      .from(intakes)
      .where(eq(intakes.id, intakeId))
      .limit(1);

    if (!intake) {
      return res.status(404).json({ error: 'Intake not found' });
    }

    // GATING: Block reopen if Intake Window is CLOSED (drift prevention)
    const [tenant] = await db
      .select({ intakeWindowState: tenants.intakeWindowState })
      .from(tenants)
      .where(eq(tenants.id, intake.tenantId))
      .limit(1);

    if (tenant && tenant.intakeWindowState === 'CLOSED') {
      return res.status(403).json({
        error: 'Gated Action',
        details: 'Cannot reopen an intake after the Intake Window is CLOSED. Reopen the window via a new cycle (not supported in this mode).'
      });
    }

    await db
      .update(intakes)
      .set({
        status: 'in_progress',
        completedAt: null,
      })
      .where(eq(intakes.id, intakeId));

    // Audit Log
    await db.insert(auditEvents).values({
      tenantId: intake.tenantId,
      actorUserId: req.user?.userId,
      actorRole: req.user?.role as string,
      eventType: 'INTAKE_REOPENED',
      entityType: 'intake',
      entityId: intakeId,
      metadata: { reopenedAt: new Date() },
    });

    return res.json({ ok: true });
  } catch (error) {
    console.error('Re-open intake error:', error);
    return res.status(500).json({ error: 'Failed to re-open intake' });
  }
}


// ============================================================================
// GET /api/superadmin/tenants - Simple List for Dropdowns
// ============================================================================

export async function getTenants(req: AuthRequest<any, any, any, { search?: string }>, res: Response) {
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

export async function getAllRoadmaps(req: AuthRequest<any, any, any, { cohort?: string; status?: string; search?: string }>, res: Response) {
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

export async function getFirms(req: AuthRequest<any, any, any, { cohortLabel?: string }>, res: Response) {
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

export async function closeIntakeWindow(req: AuthRequest<{ tenantId: string }>, res: Response) {
  try {
    if (!requireSuperAdmin(req, res)) return;
    if (!requireExecutiveAuthority(req, res)) return;

    const { tenantId } = req.params;

    // GATING: Block close unless Executive Brief is ACKNOWLEDGED or WAIVED
    const [brief] = await db
      .select()
      .from(executiveBriefs)
      .where(eq(executiveBriefs.tenantId, tenantId))
      .limit(1);

    if (!brief || !(['ACKNOWLEDGED', 'WAIVED'].includes(brief.status))) {
      return res.status(403).json({
        error: 'Gated Action',
        details: 'Executive Brief must be ACKNOWLEDGED or WAIVED before closing the Intake Window.'
      });
    }

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
      actorUserId: req.user?.userId,
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

export async function getFirmDetail(req: AuthRequest<{ tenantId: string }>, res: Response) {
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
      coachingFeedback: row.intakes.coachingFeedback,
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
        lastDiagnosticId: tenantData.lastDiagnosticId,
        intakeWindowState: tenantData.intakeWindowState,
        intakeSnapshotId: tenantData.intakeSnapshotId,
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

export async function getFirmDetailV2(req: AuthRequest<{ tenantId: string }>, res: Response) {
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
        discoveryAcknowledgedAt: tenants.discoveryAcknowledgedAt,
        tenantCreatedAt: tenants.createdAt,
        tenantUpdatedAt: tenants.updatedAt,
        ownerUserId: tenants.ownerUserId,
        intakeWindowState: tenants.intakeWindowState,
      })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenantRow) {
      return res.status(404).json({ error: 'Firm not found' });
    }

    // 1.1 Fetch Executive Brief Status & Derive Phase
    const [execBrief] = await db
      .select({ status: executiveBriefs.status })
      .from(executiveBriefs)
      .where(eq(executiveBriefs.tenantId, tenantId))
      .limit(1);

    const briefStatus = execBrief?.status || null;

    let executionPhase = 'INTAKE_OPEN';
    if (briefStatus === 'APPROVED') {
      executionPhase = 'EXEC_BRIEF_APPROVED';
    } else if (briefStatus === 'DRAFT') {
      executionPhase = 'EXEC_BRIEF_DRAFT';
    } else if (tenantRow.intakeWindowState === 'OPEN') {
      executionPhase = 'INTAKE_OPEN';
    } else if (tenantRow.intakeWindowState === 'CLOSED') {
      // Fallback if closed but no brief (e.g. manual close or legacy)
      executionPhase = 'INTAKE_CLOSED';
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
        intakeWindowState: tenantRow.intakeWindowState,
        executiveBriefStatus: briefStatus,
        executionPhase,
      },


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

export async function signalReadiness(req: AuthRequest, res: Response) {
  try {
    const { tenantId } = req.params;
    const { signal } = req.body;

    if (!requireExecutiveAuthority(req, res)) return;

    const updates: any = {};
    if (signal === 'knowledge_base') updates.knowledgeBaseReadyAt = new Date();
    if (signal === 'roles') updates.rolesValidatedAt = new Date();
    if (signal === 'exec') updates.execReadyAt = new Date();

    if (Object.keys(updates).length > 0) {
      await db.update(tenants).set(updates).where(eq(tenants.id, tenantId));
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Signal readiness error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}





>>>>>>> 02e8d03 (feat: executive brief approval, state sync, and pdf delivery pipeline)
=======
>>>>>>> 1e46cab (chore: lock executive brief render + pdf contracts)
