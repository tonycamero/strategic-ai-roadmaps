import { Router } from 'express';
import * as agentThreadController from '../controllers/agentThread.controller.ts';
import { authenticate, requireRole } from '../middleware/auth.ts';

const router = Router();

// List threads for tenant
router.get(
  '/threads',
  authenticate,
  requireRole('owner', 'team', 'superadmin'),
  agentThreadController.listThreads
);

// Get messages for a thread
router.get(
  '/threads/:id/messages',
  authenticate,
  requireRole('owner', 'team', 'superadmin'),
  agentThreadController.getThreadMessages
);

// Get agent sync status
router.get(
  '/sync-status',
  authenticate,
  requireRole('owner', 'team', 'superadmin'),
  agentThreadController.getAgentSyncStatus
);

export default router;
