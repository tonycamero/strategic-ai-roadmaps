import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { requireExecutive, requireDelegateOrHigher } from '../middleware/authority';
import { AuthorityCategory, RoleToAuthorityMap } from '@roadmap/shared';
import * as superadminController from '../controllers/superadmin.controller';

import * as snapshotController from '../controllers/snapshot.controller';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  dest: '/tmp/uploads',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

// PHASE 1: Baseline protection for all /api/superadmin/* routes
// 1. Authenticate user
// 2. Require internal user (not client-facing)
// 3. Require valid authority category (block AGENT, allow EXECUTIVE/DELEGATE/OPERATOR)
// 4. Derive authority category from role
router.use(authenticate);

// Lock to internal users only
router.use((req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user?.isInternal) {
    return res.status(403).json({ error: 'Internal access required' });
  }
  next();
});

// Allow any role that maps to a real authority category (block AGENT)
router.use((req: AuthRequest, res: Response, next: NextFunction) => {
  const role = req.user?.role;
  const category = role ? RoleToAuthorityMap[role] : null;

  // Block unknown roles or AGENT category
  if (!category || category === AuthorityCategory.AGENT) {
    return res.status(403).json({ error: 'SuperAdmin access required' });
  }

  // Attach category for downstream middleware
  req.authorityCategory = category;

  next();
});

// GET /api/superadmin/overview - Global dashboard stats
router.get('/overview', superadminController.getOverview);
router.get('/activity-feed', superadminController.getActivityFeed);

// GET /api/superadmin/metrics/daily-rollup - 30-day trends
router.get('/metrics/daily-rollup', superadminController.getDailyMetricsRollup);

// GET /api/superadmin/tenants - Simple tenant list for dropdowns
router.get('/tenants', superadminController.getTenants);

// GET /api/superadmin/roadmaps - List all client roadmaps
router.get('/roadmaps', superadminController.getAllRoadmaps);

// GET /api/superadmin/firms - List all firms
router.get('/firms', superadminController.getFirms);

// GET /api/superadmin/firms/:tenantId - Firm detail
router.get('/firms/:tenantId', superadminController.getFirmDetail);

// GET /api/superadmin/firms/:tenantId/detail - Firm detail V2 (Single Source of Truth)
router.get('/firms/:tenantId/detail', superadminController.getFirmDetailV2);

// GET /api/superadmin/firms/:tenantId/client-context - Get client preview context
router.get('/firms/:tenantId/client-context', superadminController.getClientContextForFirm);

// GET /api/superadmin/firms/:tenantId/roadmap-sections - Get roadmap sections
router.get('/firms/:tenantId/roadmap-sections', superadminController.getRoadmapSectionsForFirm);

// PATCH /api/superadmin/firms/:tenantId - Update firm tenant info
router.patch('/firms/:tenantId', superadminController.updateFirmStatus);

// GET /api/superadmin/export/intakes - Export all intakes (CSV or JSON)
router.get('/export/intakes', superadminController.exportIntakes);

// GET /api/superadmin/export/firms/:tenantId/intakes - Export single firm intakes
router.get('/export/firms/:tenantId/intakes', superadminController.exportFirmIntakes);

// POST /api/superadmin/firms/:tenantId/documents/upload - Upload document for tenant
router.post('/firms/:tenantId/documents/upload', upload.single('file'), superadminController.uploadDocumentForTenant);

// GET /api/superadmin/firms/:tenantId/documents - List documents for tenant
router.get('/firms/:tenantId/documents', superadminController.listTenantDocuments);

// GET /api/superadmin/firms/:tenantId/workflow-status - Get workflow status
router.get('/firms/:tenantId/workflow-status', superadminController.getFirmWorkflowStatus);

// POST /api/superadmin/firms/:tenantId/generate-sop01 - REMOVED (Legacy)

// GET/POST discovery notes - REMOVED

// POST /api/superadmin/firms/:tenantId/discovery/acknowledge - REMOVED (Legacy)

// GET /api/superadmin/firms/:tenantId/roadmap-os - Get Roadmap OS view
router.get('/firms/:tenantId/roadmap-os', superadminController.getRoadmapOsForFirm);

// POST /api/superadmin/tenants/:tenantId/refresh-vector-store - Refresh vector store (V2)
router.post('/tenants/:tenantId/refresh-vector-store', superadminController.refreshVectorStoreForTenant);

// POST /api/superadmin/firms/:tenantId/generate-roadmap - REMOVED (Legacy)

// GET /api/superadmin/firms/:tenantId/tickets - Get tickets grouped by section
router.get('/firms/:tenantId/tickets', superadminController.getTicketsForFirm);

// POST /api/superadmin/firms/:tenantId/generate-tickets - Generate tickets
router.post('/firms/:tenantId/generate-tickets', superadminController.generateTicketsForFirm);

// POST /api/superadmin/firms/:tenantId/extract-metadata - Extract roadmap metadata
router.post('/firms/:tenantId/extract-metadata', superadminController.extractMetadataForFirm);

// POST /api/superadmin/firms/:tenantId/close-intake - REMOVED (Legacy)


// EPIC 3: Metrics & Outcomes
// GET /api/superadmin/firms/:tenantId/metrics - Get performance metrics
router.get('/firms/:tenantId/metrics', superadminController.getMetricsForFirm);

// POST /api/superadmin/firms/:tenantId/metrics/baseline - Create baseline snapshot
router.post('/firms/:tenantId/metrics/baseline', superadminController.createBaselineForFirm);

// POST /api/superadmin/firms/:tenantId/metrics/snapshot - Create 30/60/90 snapshot
router.post('/firms/:tenantId/metrics/snapshot', superadminController.createSnapshotForFirm);

// POST /api/superadmin/firms/:tenantId/metrics/compute-outcome - Compute deltas + ROI
router.post('/firms/:tenantId/metrics/compute-outcome', superadminController.computeOutcomeForFirm);

// POST /api/superadmin/firms/:tenantId/readiness/signal - REMOVED (Legacy)
// POST /api/superadmin/firms/:tenantId/export/case-study - REMOVED (Legacy)

// Ticket Moderation Endpoints - REMOVED (Stubbed)
// GET /api/superadmin/tickets/:tenantId/:diagnosticId - Get tickets for moderation
// router.get('/tickets/:tenantId/:diagnosticId', ticketModerationController.getDiagnosticTickets);

// GET /api/superadmin/tickets/:tenantId/:diagnosticId/status - Get moderation status
// router.get('/tickets/:tenantId/:diagnosticId/status', ticketModerationController.getModerationStatusEndpoint);

// POST /api/superadmin/tickets/approve - Approve tickets — PHASE 1: DELEGATE OR HIGHER
// router.post('/tickets/approve', requireDelegateOrHigher(), ticketModerationController.approveDiagnosticTickets);

// POST /api/superadmin/tickets/reject - Reject tickets — PHASE 1: DELEGATE OR HIGHER
// router.post('/tickets/reject', requireDelegateOrHigher(), ticketModerationController.rejectDiagnosticTickets);

/*
import { getDeprecationPhase, DeprecationPhase, getDeprecationWarning } from '../services/sunset.service';

function wrapLegacyFinalize(handler: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Stubbed
    return handler(req, res, next);
  };
}
*/

// Canonical Roadmap Finalization Endpoint (CR-UX-8 v2) - REMOVED (Stubbed)
// router.post('/firms/:tenantId/roadmap/finalize', requireExecutive(), roadmapController.finalizeRoadmap);

// Legacy Wrappers (90-day sunset) - REMOVED (Stubbed)
// router.post('/firms/:tenantId/generate-final-roadmap', requireExecutive(), wrapLegacyFinalize(finalRoadmapController.generateFinalRoadmap));
// router.post('/roadmap/:tenantId/finalize', requireExecutive(), wrapLegacyFinalize(roadmapController.finalizeRoadmap));

// GET /api/superadmin/snapshot/:tenantId - Executive Snapshot (CR-UX-8) — PHASE 1: EXECUTIVE ONLY
router.get('/snapshot/:tenantId', requireExecutive(), snapshotController.getTenantSnapshot);

// Webinar Registration Management
// GET /api/superadmin/webinar/registrations - View all webinar registrations
router.get('/webinar/registrations', superadminController.getWebinarRegistrations);

// PATCH /api/superadmin/webinar/registrations/:id - Update registration status/notes
router.patch('/webinar/registrations/:id', superadminController.updateWebinarRegistration);

// GET /api/superadmin/webinar/settings - Get webinar settings (password version)
router.get('/webinar/settings', superadminController.getWebinarSettings);

// PATCH /api/superadmin/webinar/password - Update webinar password
router.patch('/webinar/password', superadminController.updateWebinarPassword);

// Executive Brief Routes - REMOVED

// PATCH /api/superadmin/intakes/:intakeId/coaching - Update coaching feedback
router.patch('/intakes/:intakeId/coaching', superadminController.updateIntakeCoaching);

// POST /api/superadmin/intakes/:intakeId/reopen - Re-open completed intake
router.post('/intakes/:intakeId/reopen', requireExecutive(), superadminController.reopenIntake);

// PHASE 7: Diagnostic Artifacts - REMOVED

export default router;
