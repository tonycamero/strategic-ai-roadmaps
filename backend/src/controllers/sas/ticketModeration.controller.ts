import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { db } from '../../db';
import { ticketModerationSessions, tenantDocuments, auditEvents } from '../../db/schema';
import { TicketModerationService } from '../../services/sas/ticketModeration.service';
import { eq, and, desc } from 'drizzle-orm';
import { invalidateProjection } from '../../services/projectionCache.service';

const AUDIT_EVENT_TYPES = {
  TICKET_MODERATION_ACTIVATED: 'ticket_moderation_activated'
};

function requireSuperAdmin(req: AuthRequest, res: Response): boolean {
  if (!req.user || (req.user.role as string) !== 'superadmin') {
    res.status(403).json({ error: 'SuperAdmin access required' });
    return false;
  }
  return true;
}

/**
 * POST /api/superadmin/firms/:tenantId/ticket-moderation/activate
 * Read-only activation: loads latest SAS run instead of regenerating
 */
export async function activateTicketModeration(req: AuthRequest<{ tenantId: string }>, res: Response) {
  const { tenantId } = req.params;
  console.log(`[Stage 6] activateTicketModeration (Read-Only) triggered for tenant: ${tenantId}`);

  try {
    if (!requireSuperAdmin(req, res)) {
      return;
    }

    // Authority check removed per performance objective

    // 2. Resolve Latest SAS Run
    const latestRunId = await TicketModerationService.getLatestSasRunId(tenantId);
    if (!latestRunId) {
      return res.status(409).json({
        success: false,
        error: "No SAS proposals exist. Run Assisted Synthesis first."
      });
    }

    // 3. Load Proposals
    const proposals = await TicketModerationService.getProposalsForRun(tenantId, latestRunId);
    if (proposals.length === 0) {
      return res.status(409).json({
        success: false,
        error: "No SAS proposals exist for the latest run. Run Assisted Synthesis first."
      });
    }

    // 4. Start Moderation Session (Orchestration ONLY)
    // We still need a session record to track moderation progress
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

    const { session } = await db.transaction(async (tx) => {
      // Create session if it doesn't exist for this run
      const [newSession] = await tx.insert(ticketModerationSessions).values({
        tenantId,
        sasRunId: latestRunId,
        sourceDocId: canonicalDoc?.id || null,
        sourceDocVersion: 'v1.0',
        status: 'active',
        startedBy: req.user!.userId,
        selectionEnvelopeId: null,
      }).returning();

      return { session: newSession };
    });

    // 5. Audit
    await db.insert(auditEvents).values({
      tenantId,
      actorUserId: req.user!.userId,
      actorRole: req.user?.role,
      eventType: AUDIT_EVENT_TYPES.TICKET_MODERATION_ACTIVATED,
      entityType: 'ticket_moderation_session',
      entityId: session.id,
      metadata: {
        sasRunId: latestRunId,
        proposalCount: proposals.length,
      }
    });

    // 6. Response
    return res.status(200).json({
      success: true,
      sas_run_id: latestRunId,
      proposal_count: proposals.length,
      proposals: proposals
    });

    invalidateProjection(`tenant:lifecycle:${tenantId}`);

  } catch (error: any) {
    console.error('[Stage 6] activateTicketModeration failed:', error);
    return res.status(500).json({
      success: false,
      error: 'ACTIVATE_MODERATION_FAILED',
      message: error.message
    });
  }
}
