import { Router } from 'express';
import * as intakeController from '../controllers/intake.controller.ts';
import { authenticate, requireRole, requireTenantAccess } from '../middleware/auth';

const router = Router();

router.post('/submit', authenticate, requireTenantAccess(), intakeController.submitIntake);
router.get('/mine', authenticate, requireTenantAccess(), intakeController.getMyIntake);
router.get('/owner', authenticate, requireTenantAccess(), requireRole('owner', 'superadmin'), intakeController.getOwnerIntakes);

export default router;
