import { Router } from 'express';
import * as tenantsController from '../controllers/tenants.controller';
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

export default router;
