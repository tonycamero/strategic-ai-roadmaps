import { Request, Response } from 'express';
import { db } from '../db/index';
import { eq, desc } from 'drizzle-orm';
import {
  tenants,
  intakes,
  intakeVectors,
  sopTickets,
  users,
  executiveBriefs,
  discoveryCallNotes,
  roadmaps,
  auditEvents,
  diagnostics
} from '../db/schema';
import { getTenantLifecycleView } from '../services/tenantStateAggregation.service';

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

    const isInternalConsultant =
      currentUser?.isInternal &&
      ['superadmin', 'delegate'].includes(currentUser.role);

    const isTenantOwner =
      !currentUser?.isInternal && currentUser?.role === 'owner';

    if (!isInternalConsultant && !isTenantOwner) {
      return res.status(403).json({ error: 'Snapshot access restricted.' });
    }

    // === CANONICAL PROJECTION SPINE ===
    const projection = await getTenantLifecycleView(tenantId);

    // === RAW DATA (READ-ONLY SURFACES) ===
    const [
      tenantDetails,
      ownerDetails,
      members,
      intakeList,
      vectorList,
      roadmapList,
      activityList,
      briefList,
      discoveryNotesList,
      diagnosticDataList,
      ticketList
    ] = await Promise.all([
      db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1),

      projection.identity.ownerUserId
        ? db
            .select()
            .from(users)
            .where(eq(users.id, projection.identity.ownerUserId))
            .limit(1)
        : Promise.resolve([]),

      db.select().from(users).where(eq(users.tenantId, tenantId)).limit(50),

      db.select().from(intakes).where(eq(intakes.tenantId, tenantId)),

      db.select().from(intakeVectors).where(eq(intakeVectors.tenantId, tenantId)),

      db
        .select()
        .from(roadmaps)
        .where(eq(roadmaps.tenantId, tenantId))
        .orderBy(desc(roadmaps.createdAt)),

      db
        .select()
        .from(auditEvents)
        .where(eq(auditEvents.tenantId, tenantId))
        .orderBy(desc(auditEvents.createdAt))
        .limit(30),

      db
        .select()
        .from(executiveBriefs)
        .where(eq(executiveBriefs.tenantId, tenantId))
        .orderBy(desc(executiveBriefs.createdAt))
        .limit(1),

      db
        .select()
        .from(discoveryCallNotes)
        .where(eq(discoveryCallNotes.tenantId, tenantId))
        .orderBy(desc(discoveryCallNotes.createdAt))
        .limit(1),

      db
        .select()
        .from(diagnostics)
        .where(eq(diagnostics.tenantId, tenantId))
        .orderBy(desc(diagnostics.createdAt))
        .limit(1),

      db.select().from(sopTickets).where(eq(sopTickets.tenantId, tenantId))
    ]);

    const tenantRow = tenantDetails[0] ?? null;
    const ownerRow = ownerDetails[0] ?? null;

    const latestRoadmap = roadmapList[0] ?? null;
    const latestBrief = briefList[0] ?? null;
    const lastDiscovery = discoveryNotesList[0] ?? null;
    const latestDiagnosticRow = diagnosticDataList[0] ?? null;

    const latestDiagnostic = projection.artifacts.diagnostic.exists
      ? {
          id:
            latestDiagnosticRow?.id ??
            tenantRow?.lastDiagnosticId ??
            null,
          status: projection.artifacts.diagnostic.status,
          createdAt:
            latestDiagnosticRow?.createdAt ?? tenantRow?.createdAt ?? null,
          updatedAt:
            latestDiagnosticRow?.updatedAt ?? null,
          outputs: latestDiagnosticRow
            ? {
                overview: latestDiagnosticRow.overview,
                aiOpportunities: latestDiagnosticRow.aiOpportunities,
                roadmapSkeleton: latestDiagnosticRow.roadmapSkeleton,
                discoveryQuestions:
                  latestDiagnosticRow.discoveryQuestions
              }
            : null
        }
      : null;

    return res.status(200).json({
      success: true,
      data: {
        projection,          // THE ONLY LIFECYCLE AUTHORITY
        tenant: tenantRow,
        owner: ownerRow,
        teamMembers: members,
        intakes: intakeList,
        intakeRoles: vectorList,
        artifacts: {
          latestDiagnostic,
          latestRoadmap,
          executiveBrief: latestBrief,
          discoveryNotes: lastDiscovery
        },
        tickets: ticketList,
        recentActivity: activityList
      }
    });
  } catch (error) {
    console.error('[Snapshot] Unhandled error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      details: 'Failed to generate snapshot.'
    });
  }
};