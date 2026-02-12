import { Router } from 'express';
import { authenticate, requireEditorMode } from '../middleware/auth.ts';
import * as ticketController from '../controllers/ticket.controller.ts';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(requireEditorMode());

// PATCH /api/tickets/:ticketInstanceId/status
router.patch('/:ticketInstanceId/status', ticketController.updateTicketStatus);

// PATCH /api/tickets/:ticketInstanceId/assignee
router.patch('/:ticketInstanceId/assignee', ticketController.updateTicketAssignee);

// PATCH /api/tickets/:ticketInstanceId/notes
router.patch('/:ticketInstanceId/notes', ticketController.updateTicketNotes);

export default router;
