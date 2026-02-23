/**
 * Ticket Routes
 *
 * Security model:
 * - Authentication required
 * - Editor role required (owner or superadmin)
 * - Object-level tenant authorization enforced BEFORE controller execution
 *   (prevents IDOR across tenants)
 */

import { Router } from 'express';
import { authenticate, requireEditorMode } from '../middleware/auth';
import { requireTicketAccess } from '../middleware/ticketAccess'; // <-- you must implement this middleware
import * as ticketController from '../controllers/ticket.controller';

const router = Router();

// All routes require authentication + editor role
router.use(authenticate);
router.use(requireEditorMode());

// Object-level authorization guard for any route containing :ticketInstanceId
// This middleware MUST:
//   1. Load ticket by ID
//   2. If not found → 404
//   3. If user.role !== superadmin AND ticket.tenantId !== req.user.tenantId → 403
//   4. Optionally attach ticket to req for reuse
router.use('/:ticketInstanceId', requireTicketAccess);

// PATCH /api/tickets/:ticketInstanceId/status
router.patch('/:ticketInstanceId/status', ticketController.updateTicketStatus);

// PATCH /api/tickets/:ticketInstanceId/assignee
router.patch('/:ticketInstanceId/assignee', ticketController.updateTicketAssignee);

// PATCH /api/tickets/:ticketInstanceId/notes
router.patch('/:ticketInstanceId/notes', ticketController.updateTicketNotes);


export default router;