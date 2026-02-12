import { Router } from 'express';
import { authenticate } from '../middleware/auth.ts';
import { deriveAuthority, requireDelegateOrHigher, requireExecutive } from '../middleware/authority';
import * as controller from '../controllers/command_center.controller.ts';

const router = Router();

// All command center routes require internal consultant access
router.use(authenticate);
router.use(deriveAuthority);

// GET /api/superadmin/command-center/tenants
router.get('/tenants', controller.getTenants);

// GET /api/superadmin/command-center/activity
router.get('/activity', controller.getActivity);

// POST /api/superadmin/command-center/batch/readiness/preview
router.post('/batch/readiness/preview', controller.previewReadinessBatch);

// POST /api/superadmin/command-center/batch/readiness/execute
router.post('/batch/readiness/execute', controller.executeReadinessBatch);

// POST /api/superadmin/command-center/batch/roadmap/finalize/preview
router.post('/batch/roadmap/finalize/preview', controller.previewFinalizeBatch);

// POST /api/superadmin/command-center/batch/roadmap/finalize/execute
router.post('/batch/roadmap/finalize/execute', controller.executeFinalizeBatch);

export default router;
