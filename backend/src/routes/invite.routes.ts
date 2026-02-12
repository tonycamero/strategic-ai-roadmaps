import { Router } from 'express';
import * as inviteController from '../controllers/invite.controller.ts';
import { authenticate, requireRole, requireTenantAccess } from '../middleware/auth.ts';

const router = Router();

router.post('/create', authenticate, requireTenantAccess(), requireRole('owner', 'superadmin'), inviteController.createInvite);
router.post('/accept', inviteController.acceptInvite);
router.get('/list', authenticate, requireTenantAccess(), requireRole('owner', 'superadmin'), inviteController.getInvites);
router.post('/:inviteId/resend', authenticate, requireTenantAccess(), requireRole('owner', 'superadmin'), inviteController.resendInvite);
router.delete('/:inviteId/revoke', authenticate, requireTenantAccess(), requireRole('owner', 'superadmin'), inviteController.revokeInvite);

export default router;
