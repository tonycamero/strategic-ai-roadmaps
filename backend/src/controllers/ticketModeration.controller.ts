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
    const { tenantId, diagnosticId } = req.params;

    if (!tenantId || !diagnosticId) {
      return res.status(400).json({ error: 'tenantId and diagnosticId are required' });
    }

    // 1. Auth & Access Check
    // Allow SuperAdmin OR Users belonging to the tenant
    const isSuperAdmin = req.user?.role === 'superadmin';
    const isTenantUser = req.user?.tenantId === tenantId; // Auth middleware populates user.tenantId

    if (!isSuperAdmin && !isTenantUser) {
      // Fallback: If user.tenantId is not set (legacy?), maybe check against DB? 
      // For now, fail validly if strictly not matching.
      // However, `req.user` might not have tenantId if not populated by `authenticate` correctly for all flows?
      // Let's assume strict check for safety.
      return res.status(403).json({ error: 'Access denied to this tenant' });
    }

    const tickets = await getTicketsForDiagnostic(tenantId, diagnosticId);
    const status = await getModerationStatus(tenantId, diagnosticId);

    // 2. Delegate Filtering (CR-UX-6 / CR-UX-6A)
    // Executives = SuperAdmin OR 'owner' role OR 'exec_sponsor' (if we had it, but sticking to owner for now)
    const isExecutive = isSuperAdmin || req.user?.role === 'owner';

    if (!isExecutive) {
      // Delegates:
      // - CAN see Pending (unmoderated)
      // - CAN see Approved
      // - CANNOT see Rejected (moderated & approved=false)
      // - CANNOT see Admin Notes or other sensitive fields (CR-UX-6A)

      const sanitizedTickets = tickets
        .filter(t => {
          const isRejected = t.approved === false && t.moderatedAt !== null;
          return !isRejected;
        })
        .map(t => ({
          // ALLOW-LIST ONLY (CR-UX-6A)
          id: t.id,
          ticketId: t.ticketId,
          title: t.title,
          category: t.category,
          priority: t.priority,
          sprint: t.sprint,
          approved: t.approved,
          moderatedAt: t.moderatedAt,
          description: t.description, // Assuming description is safe
          // Explicitly EXCLUDE: adminNotes, cost, constraints, etc.
          // Note context: We are returning a partial object effectively, 
          // but TS might complain if it doesn't match type. 
          // We will cast to 'any' or a specific DTO to bypass strictly for this response sanitization.
          // For safety, we just allow what is in the list.
        }));

      return res.json({
        tickets: sanitizedTickets,
        status
      });
    }

    // Executives see everything
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
    // CR-UX-6A: Authority Check
    // ALLOW: SuperAdmin OR Owner
    // DENY: Delegates
    const isSuperAdmin = req.user?.role === 'superadmin';
    const isOwner = req.user?.role === 'owner';

    if (!isSuperAdmin && !isOwner) {
      return res.status(403).json({ error: 'Executive authority required' });
    }

    const { tenantId, diagnosticId, ticketIds, adminNotes } = req.body as {
      tenantId?: string;
      diagnosticId?: string;
      ticketIds?: string[];
      adminNotes?: string;
    };

    // Safety check: specific tenant access
    if (!isSuperAdmin && req.user?.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Access denied to this tenant' });
    }

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
    // CR-UX-6A: Authority Check
    // ALLOW: SuperAdmin OR Owner
    // DENY: Delegates
    const isSuperAdmin = req.user?.role === 'superadmin';
    const isOwner = req.user?.role === 'owner';

    if (!isSuperAdmin && !isOwner) {
      return res.status(403).json({ error: 'Executive authority required' });
    }

    const { tenantId, diagnosticId, ticketIds, adminNotes } = req.body as {
      tenantId?: string;
      diagnosticId?: string;
      ticketIds?: string[];
      adminNotes?: string;
    };

    // Safety check: specific tenant access
    if (!isSuperAdmin && req.user?.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Access denied to this tenant' });
    }

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
