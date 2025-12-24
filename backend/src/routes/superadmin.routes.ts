import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import * as superadminController from '../controllers/superadmin.controller';
import * as ticketModerationController from '../controllers/ticketModeration.controller';
import * as finalRoadmapController from '../controllers/finalRoadmap.controller';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  dest: '/tmp/uploads',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

// All superadmin routes require authentication
router.use(authenticate);

// GET /api/superadmin/overview - Global dashboard stats
router.get('/overview', superadminController.getOverview);

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

// POST /api/superadmin/firms/:tenantId/generate-sop01 - Generate SOP-01 Diagnostic
router.post('/firms/:tenantId/generate-sop01', superadminController.generateSop01ForFirm);

// GET /api/superadmin/firms/:tenantId/discovery-notes - Get discovery notes
router.get('/firms/:tenantId/discovery-notes', superadminController.getDiscoveryNotesForFirm);

// POST /api/superadmin/firms/:tenantId/discovery-notes - Save discovery notes
router.post('/firms/:tenantId/discovery-notes', superadminController.saveDiscoveryNotesForFirm);

// GET /api/superadmin/firms/:tenantId/roadmap-os - Get Roadmap OS view
router.get('/firms/:tenantId/roadmap-os', superadminController.getRoadmapOsForFirm);

// POST /api/superadmin/tenants/:tenantId/refresh-vector-store - Refresh vector store (V2)
router.post('/tenants/:tenantId/refresh-vector-store', superadminController.refreshVectorStoreForTenant);

// POST /api/superadmin/firms/:tenantId/generate-roadmap - Generate roadmap
router.post('/firms/:tenantId/generate-roadmap', superadminController.generateRoadmapForFirm);

// GET /api/superadmin/firms/:tenantId/tickets - Get tickets grouped by section
router.get('/firms/:tenantId/tickets', superadminController.getTicketsForFirm);

// POST /api/superadmin/firms/:tenantId/generate-tickets - Generate tickets
router.post('/firms/:tenantId/generate-tickets', superadminController.generateTicketsForFirm);

// POST /api/superadmin/firms/:tenantId/extract-metadata - Extract roadmap metadata
router.post('/firms/:tenantId/extract-metadata', superadminController.extractMetadataForFirm);

// EPIC 3: Metrics & Outcomes
// GET /api/superadmin/firms/:tenantId/metrics - Get performance metrics
router.get('/firms/:tenantId/metrics', superadminController.getMetricsForFirm);

// POST /api/superadmin/firms/:tenantId/metrics/baseline - Create baseline snapshot
router.post('/firms/:tenantId/metrics/baseline', superadminController.createBaselineForFirm);

// POST /api/superadmin/firms/:tenantId/metrics/snapshot - Create 30/60/90 snapshot
router.post('/firms/:tenantId/metrics/snapshot', superadminController.createSnapshotForFirm);

// POST /api/superadmin/firms/:tenantId/metrics/compute-outcome - Compute deltas + ROI
router.post('/firms/:tenantId/metrics/compute-outcome', superadminController.computeOutcomeForFirm);

// POST /api/superadmin/firms/:tenantId/export/case-study - Export case study
router.post('/firms/:tenantId/export/case-study', superadminController.exportCaseStudyForFirm);

// Ticket Moderation Endpoints
// GET /api/superadmin/tickets/:tenantId/:diagnosticId - Get tickets for moderation
router.get('/tickets/:tenantId/:diagnosticId', ticketModerationController.getDiagnosticTickets);

// GET /api/superadmin/tickets/:tenantId/:diagnosticId/status - Get moderation status
router.get('/tickets/:tenantId/:diagnosticId/status', ticketModerationController.getModerationStatusEndpoint);

// POST /api/superadmin/tickets/approve - Approve tickets
router.post('/tickets/approve', ticketModerationController.approveDiagnosticTickets);

// POST /api/superadmin/tickets/reject - Reject tickets
router.post('/tickets/reject', ticketModerationController.rejectDiagnosticTickets);

// POST /api/superadmin/firms/:tenantId/generate-final-roadmap - Generate final roadmap from approved tickets
router.post('/firms/:tenantId/generate-final-roadmap', finalRoadmapController.generateFinalRoadmap);

// Webinar Registration Management
// GET /api/superadmin/webinar/registrations - View all webinar registrations
router.get('/webinar/registrations', superadminController.getWebinarRegistrations);

// PATCH /api/superadmin/webinar/registrations/:id - Update registration status/notes
router.patch('/webinar/registrations/:id', superadminController.updateWebinarRegistration);

// GET /api/superadmin/webinar/settings - Get webinar settings (password version)
router.get('/webinar/settings', superadminController.getWebinarSettings);

// PATCH /api/superadmin/webinar/password - Update webinar password
router.patch('/webinar/password', superadminController.updateWebinarPassword);

export default router;
