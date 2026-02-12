import { Router } from 'express';
import * as ticketInstanceController from '../controllers/ticketInstance.controller.ts';
import { authenticate, requireRole, requireEditorMode } from '../middleware/auth.ts';

const router = Router();

// Get tickets for a pack
router.get(
  '/',
  authenticate,
  requireRole('owner', 'team', 'superadmin'),
  ticketInstanceController.getTicketsForPack
);

// Update ticket instance status
router.patch(
  '/:id/status',
  authenticate,
  requireRole('owner', 'team', 'superadmin'),
  requireEditorMode(),
  ticketInstanceController.updateTicketStatus
);

export default router;
