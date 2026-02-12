
import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { requireExecutive, requireDelegateOrHigher } from '../middleware/authority';
import { AuthorityCategory, RoleToAuthorityMap } from '@roadmap/shared';
import * as superadminController from '../controllers/superadmin.controller.ts';
import * as intakeVectorController from '../controllers/intakeVector.controller.ts';
import * as executiveBriefController from '../controllers/executiveBrief.controller.ts';
import * as stakeholderRepairController from '../controllers/stakeholderRepair.controller.ts';
import * as stakeholderMetadataUpdateController from '../controllers/stakeholderMetadataUpdate.controller.ts';
import * as ticketModerationController from '../controllers/ticketModeration.controller.ts';

import * as snapshotController from '../controllers/snapshot.controller.ts';
import * as executionStateController from '../controllers/executionState.controller.ts';

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

// GET /api/superadmin/truth-probe - Operator Lifecycle Truth Probe
router.get('/truth-probe', superadminController.getTruthProbe);

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

// GET /api/superadmin/execution/:tenantId/:diagnosticId - Execution state aggregator
router.get('/execution/:tenantId/:diagnosticId', executionStateController.getExecutionStateController);

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

// POST /api/superadmin/firms/:tenantId/generate-sop01 - Diagnostic Engine (RBAC Gated)
router.post('/firms/:tenantId/generate-sop01', async (req, res, next) => {
  // Use lazy import to avoid circular dependency loop with temp_controller -> auth -> routes
  const { generateSop01ForFirm } = require('../controllers/superadmin.controller');
  return generateSop01ForFirm(req, res, next);
});

// POST /api/superadmin/diagnostic/rerun-sop01/:tenantId - Re-run SOP-01 (zero-ticket recovery)
router.post('/diagnostic/rerun-sop01/:tenantId', async (req, res, next) => {
  const { rerunSop01ForFirm } = require('../controllers/diagnosticRerun.controller');
  return rerunSop01ForFirm(req, res, next);
});

// GET/POST discovery notes - REMOVED

// POST /api/superadmin/firms/:tenantId/discovery/acknowledge - REMOVED (Legacy)

// GET /api/superadmin/firms/:tenantId/roadmap-os - Get Roadmap OS view
router.get('/firms/:tenantId/roadmap-os', superadminController.getRoadmapOsForFirm);

// POST /api/superadmin/tenants/:tenantId/refresh-vector-store - Refresh vector store (V2)
router.post('/tenants/:tenantId/refresh-vector-store', superadminController.refreshVectorStoreForTenant);

// POST /api/superadmin/firms/:tenantId/assemble-roadmap - Stage 5: Assembly
router.post('/firms/:tenantId/assemble-roadmap', async (req, res, next) => {
  const { assembleRoadmapForFirm } = require('../controllers/superadmin.controller')
  return assembleRoadmapForFirm(req, res, next);
});

// GET /api/superadmin/firms/:tenantId/tickets - Get tickets grouped by section
router.get('/firms/:tenantId/tickets', superadminController.getTicketsForFirm);

// POST /api/superadmin/firms/:tenantId/generate-tickets - Generate tickets
router.post('/firms/:tenantId/generate-tickets', superadminController.generateTicketsForFirm);

// POST /api/superadmin/firms/:tenantId/extract-metadata - Extract roadmap metadata
router.post('/firms/:tenantId/extract-metadata', superadminController.extractMetadataForFirm);

// POST /api/superadmin/firms/:tenantId/close-intake - REMOVED (Legacy)

// POST /api/superadmin/tickets/generate/:tenantId/:diagnosticId - Generate tickets from Discovery Synthesis (Discovery Gated)
router.post('/tickets/generate/:tenantId/:diagnosticId', async (req, res, next) => {
  const { handleGenerateTicketsFromDiscovery } = await import('../controllers/ticketGeneration.controller');
  return handleGenerateTicketsFromDiscovery(req, res, next);
});


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
import { validateTicketSchema } from '../middleware/schemaValidation';

// POST /api/superadmin/tickets/approve - Approve tickets — PHASE 1: DELEGATE OR HIGHER
router.post('/tickets/approve', requireDelegateOrHigher(), ticketModerationController.approveDiagnosticTickets);

// POST /api/superadmin/tickets/reject - Reject tickets — PHASE 1: DELEGATE OR HIGHER
router.post('/tickets/reject', requireDelegateOrHigher(), ticketModerationController.rejectDiagnosticTickets);

// GET /api/superadmin/tickets/:tenantId/:diagnosticId - Get tickets for moderation (ACTIVE)
// Canonical route expected by FE - thin handler delegates to service
router.get('/tickets/:tenantId/:diagnosticId', async (req, res) => {
  try {
    const { tenantId, diagnosticId } = req.params;

    if (!tenantId || !diagnosticId) {
      return res.status(400).json({ error: 'Missing tenantId or diagnosticId' });
    }

    // Delegate to existing service (no SQL in routes)
    const { getTicketsForDiagnostic, getModerationStatus } = await import('../services/ticketModeration.service');
    const [tickets, status] = await Promise.all([
      getTicketsForDiagnostic(tenantId, diagnosticId),
      getModerationStatus(tenantId, diagnosticId)
    ]);

    if (process.env.DEBUG_TICKETS_PIPELINE === '1') {
      console.log(`[DEBUG_TICKETS_PIPELINE] Fetched tickets for ${tenantId}: ${tickets.length}, pending: ${status.pending}`);
    }

    // 404-as-state: return empty array for "no tickets yet", never throw
    return res.status(200).json({ tickets: tickets ?? [], status });
  } catch (error) {
    console.error('[SuperAdminTickets] Failed to load diagnostic tickets:', error);
    return res.status(500).json({
      errorCode: 'TICKET_FETCH_FAILED',
      message: 'Failed to load tickets',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});


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

// ============================================================================
// EXECUTIVE BRIEF ROUTES (v0)
// ============================================================================

// GET /api/superadmin/firms/:tenantId/executive-brief - Get existing brief
router.get('/firms/:tenantId/executive-brief', requireExecutive(), executiveBriefController.getExecutiveBrief);

// POST /api/superadmin/firms/:tenantId/executive-brief/preflight - Preflight check for regen
router.post('/firms/:tenantId/executive-brief/preflight', requireExecutive(), executiveBriefController.preflightRegenerateExecutiveBrief);

// POST /api/superadmin/firms/:tenantId/executive-brief/generate - Generate new brief
router.post('/firms/:tenantId/executive-brief/generate', requireExecutive(), executiveBriefController.generateExecutiveBrief);

// POST /api/superadmin/firms/:tenantId/executive-brief/approve - Approve brief + close intake
router.post('/firms/:tenantId/executive-brief/approve', requireExecutive(), executiveBriefController.approveExecutiveBrief);

// POST /api/superadmin/firms/:tenantId/executive-brief/deliver - Deliver PDF to tenant (Internal only)
router.post('/firms/:tenantId/executive-brief/deliver', requireExecutive(), executiveBriefController.deliverExecutiveBrief);

// POST /api/superadmin/firms/:tenantId/executive-brief/generate-pdf - Generate PDF without emailing
router.post('/firms/:tenantId/executive-brief/generate-pdf', requireExecutive(), executiveBriefController.generateExecutiveBriefPDF);

// GET /api/superadmin/firms/:tenantId/executive-brief/download - Download generated PDF
router.get('/firms/:tenantId/executive-brief/download', requireExecutive(), executiveBriefController.downloadExecutiveBrief);

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

// Intake Clarification Pipeline
router.post('/intakes/:intakeId/request-clarification', superadminController.requestIntakeClarification);
router.post('/clarifications/:clarificationId/resend', superadminController.resendIntakeClarificationEmail);
router.get('/intakes/:intakeId/clarifications', superadminController.getIntakeClarifications);

// Intake Vector Routes (Unified Stakeholder Management)
// POST /api/superadmin/tenants/:tenantId/intake-vectors - Create intake vector
router.post('/tenants/:tenantId/intake-vectors', intakeVectorController.createIntakeVector);

// GET /api/superadmin/tenants/:tenantId/intake-vectors - List intake vectors
router.get('/tenants/:tenantId/intake-vectors', intakeVectorController.getIntakeVectors);

// PATCH /api/superadmin/intake-vectors/:id - Update intake vector
router.patch('/intake-vectors/:id', intakeVectorController.updateIntakeVector);

// POST /api/superadmin/intake-vectors/:id/send-invite - Send invite
router.post('/intake-vectors/:id/send-invite', intakeVectorController.sendIntakeVectorInvite);

// POST /api/superadmin/intakes/:intakeId/reopen - Re-open completed intake
router.post('/intakes/:intakeId/reopen', requireExecutive(), superadminController.reopenIntake);

// POST /api/superadmin/tenants/:tenantId/repair-stakeholders - Backfill intake_vectors from legacy intakes (EXECUTIVE ONLY)
router.post('/tenants/:tenantId/repair-stakeholders', requireExecutive(), stakeholderRepairController.repairStakeholdersForTenant);

// POST /api/superadmin/tenants/:tenantId/update-stakeholder-metadata - Backfill name/email on existing vectors (EXECUTIVE ONLY)
router.post('/tenants/:tenantId/update-stakeholder-metadata', requireExecutive(), stakeholderMetadataUpdateController.updateStakeholderMetadata);

// PHASE 7: Diagnostic Artifacts - REMOVED

// ============================================================================
// META-TICKET v2: EXECUTION PIPELINE ROUTES
// ============================================================================

// 1. Lock Intake
router.post('/firms/:tenantId/lock-intake', superadminController.lockIntake);

// 1.5 Confirm Sufficiency (D3 Gate)
router.post('/firms/:tenantId/confirm-sufficiency', superadminController.confirmSufficiency);

// 2. Generate Diagnostics (V2 Canonical)
router.post('/firms/:tenantId/generate-diagnostics', superadminController.generateDiagnostics);

// 3. Lock Diagnostic
router.post('/firms/:tenantId/diagnostics/:diagnosticId/lock', superadminController.lockDiagnostic);

// 4. Publish Diagnostic
router.post('/firms/:tenantId/diagnostics/:diagnosticId/publish', superadminController.publishDiagnostic);

// 4.5. Get Diagnostic Artifacts (for modal display)
router.get('/diagnostics/:diagnosticId/artifacts', superadminController.getDiagnosticArtifacts);

// 5. Discovery Notes (Ingestion & Retrieval)
router.get('/firms/:tenantId/discovery-notes', superadminController.getDiscoveryNotes);
router.post('/firms/:tenantId/ingest-discovery', superadminController.ingestDiscoveryNotes);

// 5.5. Assisted Synthesis (Findings Review)
router.post('/firms/:tenantId/assisted-synthesis/generate-proposals', superadminController.generateAssistedProposals);
router.get('/firms/:tenantId/findings/proposed', superadminController.getProposedFindings);
router.post('/firms/:tenantId/findings/declare', superadminController.declareCanonicalFindings);

// 5.6. SuperAdmin Auth Context (for agent modals)
router.get('/me', superadminController.getSuperAdminMe);

// 5.7. Assisted Synthesis Agent (Interpretive Q&A - Bounded Persistence)
router.get('/firms/:tenantId/assisted-synthesis/agent/session', superadminController.getAgentSession);
router.post('/firms/:tenantId/assisted-synthesis/agent/messages', superadminController.sendAgentMessage);
router.post('/firms/:tenantId/assisted-synthesis/agent/reset', superadminController.resetAgentSession);

// POST /api/superadmin/firms/:tenantId/ticket-moderation/activate - Activate ticket moderation
// Uses validateTicketSchema to ensure schema readiness
router.post('/firms/:tenantId/ticket-moderation/activate', validateTicketSchema, superadminController.activateTicketModeration);
router.get('/firms/:tenantId/ticket-moderation/active', superadminController.getActiveModerationSession);


export default router;
