import { Router } from 'express';
import * as dashboardController from '../controllers/ownerDashboard.controller.ts';
import * as advisorThreadsController from '../controllers/advisorThreads.controller.ts';
import { authenticate, requireRole, requireTenantAccess } from '../middleware/auth';

const router = Router();

// Dashboard KPIs - all tenant members can view
router.get(
  '/owner',
  authenticate,
  requireTenantAccess(),
  dashboardController.getOwnerDashboard
);

// Transformation metrics - all tenant members can view
router.get(
  '/owner/transformation',
  authenticate,
  requireTenantAccess(),
  dashboardController.getOwnerTransformation
);

// Owner ROI endpoints (ROI Module R1-R5)
router.post(
  '/owner/roi/baseline',
  authenticate,
  requireRole('owner', 'superadmin'),
  dashboardController.createOwnerBaselineSnapshot
);

router.post(
  '/owner/roi/snapshot',
  authenticate,
  requireRole('owner', 'superadmin'),
  dashboardController.createOwnerTimeSnapshot
);

router.post(
  '/owner/roi/compute-outcome',
  authenticate,
  requireRole('owner', 'superadmin'),
  dashboardController.computeOwnerOutcome
);

// Advisor threads - shared Tap-In threads visible to owner
router.get(
  '/owner/advisor-threads',
  authenticate,
  requireTenantAccess(),
  advisorThreadsController.listSharedAdvisorThreads
);

export default router;
