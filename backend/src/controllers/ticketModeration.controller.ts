/**
 * Ticket Moderation Controller
 * 
 * SuperAdmin endpoints for ticket approval/rejection workflow
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  getTicketsForDiagnostic,
  approveTickets,
  rejectTickets,
  getModerationStatus,
} from '../services/ticketModeration.service';
import { onboardingProgressService } from '../services/onboardingProgress.service';
import { db } from '../db';
import { tenants } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/superadmin/tickets/:tenantId/:diagnosticId
 * Get all tickets for moderation
 */
export async function getDiagnosticTickets(req: AuthRequest, res: Response) {
  try {
    // Verify superadmin role
    if (req.user?.role !== 'superadmin') {
      return res.status(403).json({ error: 'Superadmin access required' });
    }

    const { tenantId, diagnosticId } = req.params;

    if (!tenantId || !diagnosticId) {
      return res.status(400).json({ error: 'tenantId and diagnosticId are required' });
    }

    const tickets = await getTicketsForDiagnostic(tenantId, diagnosticId);
    const status = await getModerationStatus(tenantId, diagnosticId);

    return res.json({ 
      tickets,
      status 
    });
  } catch (error: any) {
    console.error('[Ticket Moderation] Error getting tickets:', error);
    return res.status(500).json({ error: error.message || 'Failed to get tickets' });
  }
}

/**
 * POST /api/superadmin/tickets/approve
 * Bulk approve tickets
 * Body: { tenantId, diagnosticId, ticketIds: string[], adminNotes?: string }
 */
export async function approveDiagnosticTickets(req: AuthRequest, res: Response) {
  try {
    if (req.user?.role !== 'superadmin') {
      return res.status(403).json({ error: 'Superadmin access required' });
    }

    const { tenantId, diagnosticId, ticketIds, adminNotes } = req.body as {
      tenantId?: string;
      diagnosticId?: string;
      ticketIds?: string[];
      adminNotes?: string;
    };

    if (!tenantId || !ticketIds || !Array.isArray(ticketIds)) {
      return res.status(400).json({ error: 'tenantId and ticketIds[] are required' });
    }

    const moderatedBy = req.user.userId;
    const count = await approveTickets(tenantId, ticketIds, moderatedBy, adminNotes);

    console.log(`[Ticket Moderation] ✅ Approved ${count} tickets for diagnostic ${diagnosticId}`);

    // Return updated status
    const status = diagnosticId ? await getModerationStatus(tenantId, diagnosticId) : null;

    // 🎯 Onboarding Hook: Mark TICKETS_MODERATED complete when all tickets are moderated
    if (status?.readyForRoadmap) {
      try {
        await onboardingProgressService.markStep(
          tenantId,
          'TICKETS_MODERATED',
          'COMPLETED'
        );
        console.log(`[Ticket Moderation] ✅ Marked TICKETS_MODERATED complete for tenant ${tenantId}`);
      } catch (error) {
        console.error('[Ticket Moderation] Failed to update onboarding progress:', error);
        // Don't fail the approval if onboarding update fails
      }
    }

    return res.json({ 
      updated: count,
      status 
    });
  } catch (error: any) {
    console.error('[Ticket Moderation] Error approving tickets:', error);
    return res.status(500).json({ error: error.message || 'Failed to approve tickets' });
  }
}

/**
 * POST /api/superadmin/tickets/reject
 * Bulk reject tickets
 * Body: { tenantId, diagnosticId, ticketIds: string[], adminNotes?: string }
 */
export async function rejectDiagnosticTickets(req: AuthRequest, res: Response) {
  try {
    if (req.user?.role !== 'superadmin') {
      return res.status(403).json({ error: 'Superadmin access required' });
    }

    const { tenantId, diagnosticId, ticketIds, adminNotes } = req.body as {
      tenantId?: string;
      diagnosticId?: string;
      ticketIds?: string[];
      adminNotes?: string;
    };

    if (!tenantId || !ticketIds || !Array.isArray(ticketIds)) {
      return res.status(400).json({ error: 'tenantId and ticketIds[] are required' });
    }

    const moderatedBy = req.user.userId;
    const count = await rejectTickets(tenantId, ticketIds, moderatedBy, adminNotes);

    console.log(`[Ticket Moderation] ❌ Rejected ${count} tickets for diagnostic ${diagnosticId}`);

    // Return updated status
    const status = diagnosticId ? await getModerationStatus(tenantId, diagnosticId) : null;

    // 🎯 Onboarding Hook: Mark TICKETS_MODERATED complete when all tickets are moderated
    if (status?.readyForRoadmap) {
      try {
        await onboardingProgressService.markStep(
          tenantId,
          'TICKETS_MODERATED',
          'COMPLETED'
        );
        console.log(`[Ticket Moderation] ✅ Marked TICKETS_MODERATED complete for tenant ${tenantId}`);
      } catch (error) {
        console.error('[Ticket Moderation] Failed to update onboarding progress:', error);
        // Don't fail the rejection if onboarding update fails
      }
    }

    return res.json({ 
      updated: count,
      status 
    });
  } catch (error: any) {
    console.error('[Ticket Moderation] Error rejecting tickets:', error);
    return res.status(500).json({ error: error.message || 'Failed to reject tickets' });
  }
}

/**
 * GET /api/superadmin/tickets/:tenantId/:diagnosticId/status
 * Get moderation status summary
 */
export async function getModerationStatusEndpoint(req: AuthRequest, res: Response) {
  try {
    if (req.user?.role !== 'superadmin') {
      return res.status(403).json({ error: 'Superadmin access required' });
    }

    const { tenantId, diagnosticId } = req.params;

    if (!tenantId || !diagnosticId) {
      return res.status(400).json({ error: 'tenantId and diagnosticId are required' });
    }

    const status = await getModerationStatus(tenantId, diagnosticId);

    return res.json({ status });
  } catch (error: any) {
    console.error('[Ticket Moderation] Error getting status:', error);
    return res.status(500).json({ error: error.message || 'Failed to get status' });
  }
}
