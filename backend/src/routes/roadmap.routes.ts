import { Router } from 'express';
import * as roadmapController from '../controllers/roadmap.controller';
import * as roadmapQnAController from '../controllers/roadmapQnA.controller';
import { authenticate, requireRole, requireTenantAccess, requireEditorMode } from '../middleware/auth';

const router = Router();

// Get all roadmap sections - all tenant members can view
router.get(
  '/sections',
  authenticate,
  requireTenantAccess(),
  roadmapController.getRoadmapSections
);

// Get specific roadmap section by section number - all tenant members can view
router.get(
  '/sections/:sectionNumber',
  authenticate,
  requireTenantAccess(),
  roadmapController.getRoadmapSection
);

// Create or update a roadmap section
router.post(
  '/sections',
  authenticate,
  requireRole('owner', 'superadmin'),
  requireEditorMode(),
  roadmapController.upsertRoadmapSection
);

// Update section status
router.patch(
  '/sections/:sectionId/status',
  authenticate,
  requireRole('owner', 'superadmin'),
  requireEditorMode(),
  roadmapController.updateSectionStatus
);

// Sync roadmap section statuses from ticket completion
router.post(
  '/sync-status',
  authenticate,
  requireRole('owner', 'superadmin'),
  requireEditorMode(),
  roadmapController.syncRoadmapStatus
);

// Refresh roadmap - create new version
router.post(
  '/refresh',
  authenticate,
  requireRole('owner', 'superadmin'),
  requireEditorMode(),
  roadmapController.refreshRoadmap
);

// Get tickets for roadmap - all tenant members can view
router.get(
  '/tickets',
  authenticate,
  requireTenantAccess(),
  roadmapController.getRoadmapTickets
);

// Export complete roadmap - all tenant members can export
router.get(
  '/export',
  authenticate,
  requireTenantAccess(),
  roadmapController.exportRoadmap
);

// Ask a question about the roadmap - all tenant members can ask
router.post(
  '/qna',
  authenticate,
  requireTenantAccess(),
  roadmapQnAController.askAboutRoadmap
);

export default router;
