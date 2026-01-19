import { Router } from 'express';
import * as tenantsController from '../controllers/tenants.controller';
import * as intakeVectorController from '../controllers/intakeVector.controller';
import { authenticate, requireRole, requireTenantAccess } from '../middleware/auth';

const router = Router();

// Get tenant info (any authenticated user)
router.get(
  '/me',
  authenticate,
  requireTenantAccess(),
  tenantsController.getTenant
);

// Update business type (owner only)
router.patch(
  '/business-type',
  authenticate,
  requireTenantAccess(),
  requireRole('owner'),
  tenantsController.updateBusinessType
);

// Update business profile (owner only)
router.patch(
  '/profile',
  authenticate,
  requireTenantAccess(),
  requireRole('owner'),
  tenantsController.updateBusinessProfile
);

// Intake Vector Routes (for Lead Intake onboarding)
// GET/POST /api/tenants/:tenantId/intake-vectors
router.get(
  '/:tenantId/intake-vectors',
  authenticate,
  requireTenantAccess(),
  intakeVectorController.getIntakeVectors
);

router.post(
  '/:tenantId/intake-vectors',
  authenticate,
  requireTenantAccess(),
  intakeVectorController.createIntakeVector
);

// PATCH /api/tenants/intake-vectors/:id
router.patch(
  '/intake-vectors/:id',
  authenticate,
  requireTenantAccess(),
  intakeVectorController.updateIntakeVector
);

// POST /api/tenants/intake-vectors/:id/send-invite
router.post(
  '/intake-vectors/:id/send-invite',
  authenticate,
  requireTenantAccess(),
  intakeVectorController.sendIntakeVectorInvite
);

export default router;
