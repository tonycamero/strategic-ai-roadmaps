import { Router } from 'express';
import { authenticate, requireTenantAccess } from '../middleware/auth.ts';
import * as onboardingController from '../controllers/onboarding.controller.ts';

const router = Router();

// All onboarding routes require authentication and tenant access
router.use(authenticate);
router.use(requireTenantAccess());

// GET /api/tenants/:tenantId/onboarding - Fetch onboarding state
router.get('/:tenantId/onboarding', onboardingController.getOnboardingState);

// PATCH /api/tenants/:tenantId/onboarding/steps/:stepId - Update step status
router.patch('/:tenantId/onboarding/steps/:stepId', onboardingController.updateStepStatus);

export default router;
