== LLM CALL SITES ==
backend/src/trustagent/services/roadmapQnAAgent.service.ts:5:const client = new OpenAI({ 
backend/src/trustagent/services/roadmapQnAAgent.service.ts:269:  const response = await client.chat.completions.create({
backend/src/ai/openaiClient.ts:14:export function createOpenAIClient(): OpenAI {
backend/src/ai/openaiClient.ts:19:    return new OpenAI({
backend/src/ai/openaiClient.ts:32:        _cachedClient = createOpenAIClient();
backend/src/ai/openaiClient.ts:41:    createOpenAIClient,
backend/src/scripts/update_homepage_assistant_model.ts:11:const openai = new OpenAI({
backend/src/scripts/provision_homepage_assistant.ts:13:const openai = new OpenAI({
backend/src/scripts/inspect_assistant.ts:11:const openai = new OpenAI({
backend/src/scripts/openai_capabilities.ts:14:    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'sk-test' });
backend/src/scripts/upload_homepage_knowledge.ts:15:const openai = new OpenAI({
backend/src/scripts/dump_assistant_config.ts:9:const openai = new OpenAI({
backend/src/scripts/update_homepage_assistant_instructions.ts:15:const openai = new OpenAI({
backend/src/scripts/test_hayes_identity.ts:11:const openai = new OpenAI({
backend/src/services/diagnosticIngestion.service.ts:11:const openai = new OpenAI({
backend/src/services/diagnosticIngestion.service.ts:172:    const openai = new OpenAI({
backend/src/services/diagnosticIngestion.service.ts:193:        const response = await openai.chat.completions.create({
backend/src/scripts/upload_roadmap_to_vector_store.ts:12:const openai = new OpenAI({
backend/src/scripts/provision_homepage_trustagent.ts:13:const openai = new OpenAI({
backend/src/services/executiveBrief/mirrorNarrative/enforcement.service.ts:151:        const response = await getOpenAIClient().chat.completions.create({
backend/src/scripts/dump_trustagent.ts:5:  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
backend/src/services/assistantProvisioning.service.ts:17:const openai = new OpenAI({
backend/src/services/sop01Engine.ts:4:const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
backend/src/services/sop01Engine.ts:184:   const response = await openai.chat.completions.create({
backend/src/services/executiveBriefAssertionExpansion.service.ts:48:        openai = new OpenAI({
backend/src/services/executiveBriefAssertionExpansion.service.ts:91:            const response = await getOpenAIClient().chat.completions.create({
backend/src/services/roadmapAssembly.service.ts:16:const openai = new OpenAI({
backend/src/services/roadmapAssembly.service.ts:130:  const response = await openai.chat.completions.create({
backend/src/services/agent.service.ts:16:const openai = new OpenAI({
backend/src/services/agent.service.ts:719:    const response = await openai.chat.completions.create({
backend/src/services/agent.service.ts:759:    const secondResponse = await openai.chat.completions.create({
backend/src/services/sopTicketGenerator.service.ts:14:const openai = new OpenAI({
backend/src/services/sopTicketGenerator.service.ts:61:  const response = await openai.chat.completions.create({
backend/src/services/assistedSynthesisProposals.service.ts:1:import { createOpenAIClient } from '../ai/openaiClient';
backend/src/services/assistedSynthesisProposals.service.ts:49:        const openai = createOpenAIClient();
backend/src/services/assistedSynthesisProposals.service.ts:155:        const completion = await openai.chat.completions.create({
backend/src/services/tenantVectorStore.service.ts:16:const openai = new OpenAI({
backend/src/services/assistedSynthesisAgent.service.ts:1:import { createOpenAIClient } from '../ai/openaiClient';
backend/src/services/assistedSynthesisAgent.service.ts:134:        const openai = createOpenAIClient();
backend/src/services/assistedSynthesisAgent.service.ts:165:            const response = await openai.chat.completions.create({
backend/src/services/assistantQuery.service.ts:19:const openai = new OpenAI({
backend/src/services/assistantQuery.service.ts:69:  // Create new OpenAI thread with metadata
backend/src/services/executiveBriefMirrorNarrative.service.ts:33:        openai = new OpenAI({
backend/src/services/executiveBriefMirrorNarrative.service.ts:108:        const response = await getOpenAIClient().chat.completions.create({
backend/src/services/executiveBriefMirrorNarrative.service.ts:210:        const response = await getOpenAIClient().chat.completions.create({
backend/src/services/executiveBriefMirrorNarrative.service.ts:306:        const response = await getOpenAIClient().chat.completions.create({
backend/src/services/narrativeRenderer.service.ts:1:import { createOpenAIClient } from '../ai/openaiClient';
backend/src/services/narrativeRenderer.service.ts:59:        const openai = createOpenAIClient();
backend/src/services/narrativeRenderer.service.ts:73:            const response = await openai.chat.completions.create({
backend/src/services/publicAgentSession.service.ts:15:const openai = new OpenAI({

== TENANT ROUTES ==
backend/src/routes/onboarding.routes.ts:12:router.get('/:tenantId/onboarding', onboardingController.getOnboardingState);
backend/src/routes/ticketInstance.routes.ts:8:router.get(
backend/src/routes/command_center.routes.ts:13:router.get('/tenants', controller.getTenants);
backend/src/routes/command_center.routes.ts:16:router.get('/activity', controller.getActivity);
backend/src/routes/command_center.routes.ts:19:router.post('/batch/readiness/preview', controller.previewReadinessBatch);
backend/src/routes/command_center.routes.ts:22:router.post('/batch/readiness/execute', controller.executeReadinessBatch);
backend/src/routes/command_center.routes.ts:25:router.post('/batch/roadmap/finalize/preview', controller.previewFinalizeBatch);
backend/src/routes/command_center.routes.ts:28:router.post('/batch/roadmap/finalize/execute', controller.executeFinalizeBatch);
backend/src/routes/pulseagent.routes.ts:13:router.post(
backend/src/routes/pulseagent.routes.ts:25:router.get('/homepage/debug', pulseagentHomepageController.debug);
backend/src/routes/pulseagent.routes.ts:31:router.post('/ask', (req, res) => {
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:35:router.get('/truth-probe', superadminController.getTruthProbe);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:62:router.get('/overview', superadminController.getOverview);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:63:router.get('/activity-feed', superadminController.getActivityFeed);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:66:router.get('/metrics/daily-rollup', superadminController.getDailyMetricsRollup);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:69:router.get('/tenants', superadminController.getTenants);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:72:router.get('/roadmaps', superadminController.getAllRoadmaps);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:75:router.get('/firms', superadminController.getFirms);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:78:router.get('/firms/:tenantId', superadminController.getFirmDetail);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:81:router.get('/firms/:tenantId/detail', superadminController.getFirmDetailV2);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:84:router.get('/execution/:tenantId/:diagnosticId', executionStateController.getExecutionStateController);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:87:router.get('/firms/:tenantId/client-context', superadminController.getClientContextForFirm);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:90:router.get('/firms/:tenantId/roadmap-sections', superadminController.getRoadmapSectionsForFirm);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:96:router.get('/export/intakes', superadminController.exportIntakes);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:99:router.get('/export/firms/:tenantId/intakes', superadminController.exportFirmIntakes);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:102:router.post('/firms/:tenantId/documents/upload', upload.single('file'), superadminController.uploadDocumentForTenant);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:105:router.get('/firms/:tenantId/documents', superadminController.listTenantDocuments);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:108:router.get('/firms/:tenantId/workflow-status', superadminController.getFirmWorkflowStatus);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:111:router.post('/firms/:tenantId/generate-sop01', async (req, res, next) => {
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:118:router.post('/diagnostic/rerun-sop01/:tenantId', async (req, res, next) => {
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:128:router.get('/firms/:tenantId/roadmap-os', superadminController.getRoadmapOsForFirm);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:131:router.post('/tenants/:tenantId/refresh-vector-store', superadminController.refreshVectorStoreForTenant);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:134:router.post('/firms/:tenantId/assemble-roadmap', async (req, res, next) => {
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:140:router.get('/firms/:tenantId/tickets', superadminController.getTicketsForFirm);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:143:router.post('/firms/:tenantId/generate-tickets', superadminController.generateTicketsForFirm);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:146:router.post('/firms/:tenantId/extract-metadata', superadminController.extractMetadataForFirm);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:151:router.post('/tickets/generate/:tenantId/:diagnosticId', async (req, res, next) => {
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:159:router.get('/firms/:tenantId/metrics', superadminController.getMetricsForFirm);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:160:router.get('/firms/:tenantId/roi-baseline', async (req, res, next) => {
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:174:router.post('/firms/:tenantId/metrics/baseline', superadminController.createBaselineForFirm);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:177:router.post('/firms/:tenantId/metrics/snapshot', superadminController.createSnapshotForFirm);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:180:router.post('/firms/:tenantId/metrics/compute-outcome', superadminController.computeOutcomeForFirm);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:189:router.post('/tickets/approve', requireDelegateOrHigher(), ticketModerationController.approveDiagnosticTickets);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:192:router.post('/tickets/reject', requireDelegateOrHigher(), ticketModerationController.rejectDiagnosticTickets);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:196:router.get('/tickets/:tenantId/:diagnosticId', async (req, res) => {
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:241:// router.post('/firms/:tenantId/roadmap/finalize', requireExecutive(), roadmapController.finalizeRoadmap);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:244:// router.post('/firms/:tenantId/generate-final-roadmap', requireExecutive(), wrapLegacyFinalize(finalRoadmapController.generateFinalRoadmap));
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:245:// router.post('/roadmap/:tenantId/finalize', requireExecutive(), wrapLegacyFinalize(roadmapController.finalizeRoadmap));
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:248:router.get('/snapshot/:tenantId', requireExecutive(), snapshotController.getTenantSnapshot);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:255:router.get('/firms/:tenantId/executive-brief', requireExecutive(), executiveBriefController.getExecutiveBrief);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:258:router.post('/firms/:tenantId/executive-brief/preflight', requireExecutive(), executiveBriefController.preflightRegenerateExecutiveBrief);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:261:router.post('/firms/:tenantId/executive-brief/generate', requireExecutive(), executiveBriefController.generateExecutiveBrief);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:264:router.post('/firms/:tenantId/executive-brief/approve', requireExecutive(), executiveBriefController.approveExecutiveBrief);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:267:router.post('/firms/:tenantId/executive-brief/deliver', requireExecutive(), executiveBriefController.deliverExecutiveBrief);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:270:router.post('/firms/:tenantId/executive-brief/generate-pdf', requireExecutive(), executiveBriefController.generateExecutiveBriefPDF);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:273:router.get('/firms/:tenantId/executive-brief/download', requireExecutive(), executiveBriefController.downloadExecutiveBrief);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:277:router.get('/webinar/registrations', superadminController.getWebinarRegistrations);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:283:router.get('/webinar/settings', superadminController.getWebinarSettings);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:294:router.post('/intakes/:intakeId/request-clarification', superadminController.requestIntakeClarification);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:295:router.post('/clarifications/:clarificationId/resend', superadminController.resendIntakeClarificationEmail);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:296:router.get('/intakes/:intakeId/clarifications', superadminController.getIntakeClarifications);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:300:router.post('/tenants/:tenantId/intake-vectors', intakeVectorController.createIntakeVector);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:303:router.get('/tenants/:tenantId/intake-vectors', intakeVectorController.getIntakeVectors);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:309:router.post('/intake-vectors/:id/send-invite', intakeVectorController.sendIntakeVectorInvite);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:312:router.post('/intakes/:intakeId/reopen', requireExecutive(), superadminController.reopenIntake);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:315:router.post('/tenants/:tenantId/repair-stakeholders', requireExecutive(), stakeholderRepairController.repairStakeholdersForTenant);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:318:router.post('/tenants/:tenantId/update-stakeholder-metadata', requireExecutive(), stakeholderMetadataUpdateController.updateStakeholderMetadata);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:327:router.post('/firms/:tenantId/lock-intake', superadminController.lockIntake);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:330:router.post('/firms/:tenantId/confirm-sufficiency', superadminController.confirmSufficiency);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:333:router.post('/firms/:tenantId/generate-diagnostics', superadminController.generateDiagnostics);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:336:router.post('/firms/:tenantId/diagnostics/:diagnosticId/lock', superadminController.lockDiagnostic);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:339:router.post('/firms/:tenantId/diagnostics/:diagnosticId/publish', superadminController.publishDiagnostic);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:342:router.get('/diagnostics/:diagnosticId/artifacts', superadminController.getDiagnosticArtifacts);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:345:router.get('/firms/:tenantId/discovery-notes', superadminController.getDiscoveryNotes);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:346:router.post('/firms/:tenantId/ingest-discovery', superadminController.ingestDiscoveryNotes);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:349:router.post('/firms/:tenantId/assisted-synthesis/generate-proposals', superadminController.generateAssistedProposals);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:350:router.get('/firms/:tenantId/findings/proposed', superadminController.getProposedFindings);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:351:router.post('/firms/:tenantId/findings/declare', superadminController.declareCanonicalFindings);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:354:router.get('/me', superadminController.getSuperAdminMe);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:357:router.get('/firms/:tenantId/assisted-synthesis/agent/session', superadminController.getAgentSession);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:358:router.post('/firms/:tenantId/assisted-synthesis/agent/messages', superadminController.sendAgentMessage);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:359:router.post('/firms/:tenantId/assisted-synthesis/agent/reset', superadminController.resetAgentSession);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:363:router.post('/firms/:tenantId/ticket-moderation/activate', validateTicketSchema, superadminController.activateTicketModeration);
backend/src/routes/superadmin.routes.ts.bak.20260217_223426:364:router.get('/firms/:tenantId/ticket-moderation/active', superadminController.getActiveModerationSession);
backend/src/routes/diagnostic.routes.ts:16:router.post(
backend/src/routes/diagnostic.routes.ts:26:router.post(
backend/src/routes/diagnostic.routes.ts:36:router.post(
backend/src/routes/diagnostic.routes.ts:49:router.post(
backend/src/routes/diagnostic.routes.ts:72:router.post(
backend/src/routes/diagnostic.routes.ts:82:router.post(
backend/src/routes/diagnostic.routes.ts:95:router.post(
backend/src/routes/diagnostic.routes.ts:105:router.get(
backend/src/routes/auth.routes.ts:6:router.post('/login', authController.login);
backend/src/routes/auth.routes.ts:7:router.post('/register', authController.register);
backend/src/routes/auth.routes.ts:10:router.post('/request-reset', authController.requestPasswordReset);
backend/src/routes/auth.routes.ts:11:router.get('/validate-reset/:token', authController.validateResetToken);
backend/src/routes/auth.routes.ts:12:router.post('/reset-password', authController.resetPassword);
backend/src/routes/dashboard.routes.ts:9:router.get(
backend/src/routes/dashboard.routes.ts:17:router.get(
backend/src/routes/dashboard.routes.ts:25:router.post(
backend/src/routes/dashboard.routes.ts:32:router.post(
backend/src/routes/dashboard.routes.ts:39:router.post(
backend/src/routes/dashboard.routes.ts:47:router.get(
backend/src/routes/agentThread.routes.ts:8:router.get(
backend/src/routes/agentThread.routes.ts:16:router.get(
backend/src/routes/agentThread.routes.ts:24:router.get(
backend/src/routes/tenants.routes.ts:9:router.get(
backend/src/routes/tenants.routes.ts:36:router.get(
backend/src/routes/tenants.routes.ts:43:router.post(
backend/src/routes/tenants.routes.ts:59:router.post(
backend/src/routes/superadminAssistant.routes.ts:22:router.post('/query', handleSuperadminAgentQuery);
backend/src/routes/assistantAgent.routes.ts:22:router.post('/query', handleOwnerAgentQuery);
backend/src/routes/health.routes.ts:11:router.get('/db', async (req, res) => {
backend/src/routes/trustagent.routes.ts:18:router.post(
backend/src/routes/trustagent.routes.ts:27:router.get('/homepage/debug', trustagentHomepageController.debug);
backend/src/routes/clarification.routes.ts:7:router.get('/:token', clarificationController.getClarificationByToken);
backend/src/routes/clarification.routes.ts:10:router.post('/:token', clarificationController.submitClarification);
backend/src/routes/internalEvidence.routes.ts:22:router.post('/artifacts', internalAuth, upload.single('file'), async (req: any, res: any) => {
backend/src/routes/agentConfig.routes.ts:21:router.get('/configs/:tenantId', handleListConfigs);
backend/src/routes/agentConfig.routes.ts:24:router.get('/configs/:tenantId/:roleType', handleGetConfig);
backend/src/routes/agent.routes.ts:8:router.post('/query', authenticate, handleAgentQuery);
backend/src/routes/documents.routes.ts:17:router.get('/', authenticate, requireTenantAccess(), documentsController.listDocuments);
backend/src/routes/documents.routes.ts:18:router.get('/:id', authenticate, requireTenantAccess(), documentsController.getDocument);
backend/src/routes/documents.routes.ts:19:router.get('/:id/download', authenticate, requireTenantAccess(), documentsController.downloadDocument);
backend/src/routes/documents.routes.ts:22:router.post('/upload', authenticate, requireRole('owner', 'superadmin'), upload.single('file'), documentsController.uploadDocument);
backend/src/routes/invite.routes.ts:7:router.post('/create', authenticate, requireTenantAccess(), requireRole('owner', 'superadmin'), inviteController.createInvite);
backend/src/routes/invite.routes.ts:8:router.post('/accept', inviteController.acceptInvite);
backend/src/routes/invite.routes.ts:9:router.get('/list', authenticate, requireTenantAccess(), requireRole('owner', 'superadmin'), inviteController.getInvites);
backend/src/routes/invite.routes.ts:10:router.post('/:inviteId/resend', authenticate, requireTenantAccess(), requireRole('owner', 'superadmin'), inviteController.resendInvite);
backend/src/routes/leadRequest.routes.ts:7:router.post('/lead-request', createLeadRequest);
backend/src/routes/debugLogs.routes.ts:11:router.get('/logs', getDebugLogs);
backend/src/routes/debugLogs.routes.ts:14:router.get('/logs/types', getLogEventTypes);
backend/src/routes/roadmap.routes.ts:9:router.get(
backend/src/routes/roadmap.routes.ts:17:router.get(
backend/src/routes/roadmap.routes.ts:25:router.post(
backend/src/routes/roadmap.routes.ts:43:router.post(
backend/src/routes/roadmap.routes.ts:52:router.post(
backend/src/routes/roadmap.routes.ts:61:router.get(
backend/src/routes/roadmap.routes.ts:69:router.get(
backend/src/routes/roadmap.routes.ts:77:router.post(
backend/src/routes/intake.routes.ts:7:router.post('/submit', authenticate, requireTenantAccess(), intakeController.submitIntake);
backend/src/routes/intake.routes.ts:8:router.get('/mine', authenticate, requireTenantAccess(), intakeController.getMyIntake);
backend/src/routes/intake.routes.ts:9:router.get('/owner', authenticate, requireTenantAccess(), requireRole('owner', 'superadmin'), intakeController.getOwnerIntakes);
backend/src/routes/superadmin.routes.ts:35:router.get('/truth-probe', superadminController.getTruthProbe);
backend/src/routes/superadmin.routes.ts:62:router.get('/overview', superadminController.getOverview);
backend/src/routes/superadmin.routes.ts:63:router.get('/activity-feed', superadminController.getActivityFeed);
backend/src/routes/superadmin.routes.ts:66:router.get('/metrics/daily-rollup', superadminController.getDailyMetricsRollup);
backend/src/routes/superadmin.routes.ts:69:router.get('/tenants', superadminController.getTenants);
backend/src/routes/superadmin.routes.ts:72:router.get('/roadmaps', superadminController.getAllRoadmaps);
backend/src/routes/superadmin.routes.ts:75:router.get('/firms', superadminController.getFirms);
backend/src/routes/superadmin.routes.ts:78:router.get('/firms/:tenantId', superadminController.getFirmDetail);
backend/src/routes/superadmin.routes.ts:81:router.get('/firms/:tenantId/detail', superadminController.getFirmDetailV2);
backend/src/routes/superadmin.routes.ts:84:router.get('/execution/:tenantId/:diagnosticId', executionStateController.getExecutionStateController);
backend/src/routes/superadmin.routes.ts:87:// router.post('/firms/:tenantId/impersonate', requireExecutive(), superadminController.impersonateTenantOwner);
backend/src/routes/superadmin.routes.ts:90:router.get('/firms/:tenantId/client-context', superadminController.getClientContextForFirm);
backend/src/routes/superadmin.routes.ts:93:router.get('/firms/:tenantId/roadmap-sections', superadminController.getRoadmapSectionsForFirm);
backend/src/routes/superadmin.routes.ts:99:router.get('/export/intakes', superadminController.exportIntakes);
backend/src/routes/superadmin.routes.ts:102:router.get('/export/firms/:tenantId/intakes', superadminController.exportFirmIntakes);
backend/src/routes/superadmin.routes.ts:105:router.post('/firms/:tenantId/documents/upload', upload.single('file'), superadminController.uploadDocumentForTenant);
backend/src/routes/superadmin.routes.ts:108:router.get('/firms/:tenantId/documents', superadminController.listTenantDocuments);
backend/src/routes/superadmin.routes.ts:111:router.get('/firms/:tenantId/workflow-status', superadminController.getFirmWorkflowStatus);
backend/src/routes/superadmin.routes.ts:114:router.post('/firms/:tenantId/generate-sop01', async (req, res, next) => {
backend/src/routes/superadmin.routes.ts:121:router.post('/diagnostic/rerun-sop01/:tenantId', async (req, res, next) => {
backend/src/routes/superadmin.routes.ts:131:router.get('/firms/:tenantId/roadmap-os', superadminController.getRoadmapOsForFirm);
backend/src/routes/superadmin.routes.ts:134:router.post('/tenants/:tenantId/refresh-vector-store', superadminController.refreshVectorStoreForTenant);
backend/src/routes/superadmin.routes.ts:137:router.post('/firms/:tenantId/assemble-roadmap', async (req, res, next) => {
backend/src/routes/superadmin.routes.ts:143:router.get('/firms/:tenantId/tickets', superadminController.getTicketsForFirm);
backend/src/routes/superadmin.routes.ts:146:router.post('/firms/:tenantId/generate-tickets', superadminController.generateTicketsForFirm);
backend/src/routes/superadmin.routes.ts:149:router.post('/firms/:tenantId/extract-metadata', superadminController.extractMetadataForFirm);
backend/src/routes/superadmin.routes.ts:154:router.post('/tickets/generate/:tenantId/:diagnosticId', async (req, res, next) => {
backend/src/routes/superadmin.routes.ts:162:router.get('/firms/:tenantId/metrics', superadminController.getMetricsForFirm);
backend/src/routes/superadmin.routes.ts:163:router.get('/firms/:tenantId/roi-baseline', superadminController.getRoiBaselineForFirm);
backend/src/routes/superadmin.routes.ts:166:router.post('/firms/:tenantId/roi-baseline', superadminController.createRoiBaselineForFirm);
backend/src/routes/superadmin.routes.ts:169:router.post('/firms/:tenantId/metrics/baseline', superadminController.createBaselineForFirm);
backend/src/routes/superadmin.routes.ts:172:router.post('/firms/:tenantId/metrics/snapshot', superadminController.createSnapshotForFirm);
backend/src/routes/superadmin.routes.ts:175:router.post('/firms/:tenantId/metrics/compute-outcome', superadminController.computeOutcomeForFirm);
backend/src/routes/superadmin.routes.ts:184:router.post('/tickets/approve', requireDelegateOrHigher(), ticketModerationController.approveDiagnosticTickets);
backend/src/routes/superadmin.routes.ts:187:router.post('/tickets/reject', requireDelegateOrHigher(), ticketModerationController.rejectDiagnosticTickets);
backend/src/routes/superadmin.routes.ts:191:router.get('/tickets/:tenantId/:diagnosticId', async (req, res) => {
backend/src/routes/superadmin.routes.ts:234:// router.post('/firms/:tenantId/roadmap/finalize', requireExecutive(), roadmapController.finalizeRoadmap);
backend/src/routes/superadmin.routes.ts:237:// router.post('/firms/:tenantId/generate-final-roadmap', requireExecutive(), wrapLegacyFinalize(finalRoadmapController.generateFinalRoadmap));
backend/src/routes/superadmin.routes.ts:238:// router.post('/roadmap/:tenantId/finalize', requireExecutive(), wrapLegacyFinalize(roadmapController.finalizeRoadmap));
backend/src/routes/superadmin.routes.ts:241:router.get('/snapshot/:tenantId', requireExecutive(), snapshotController.getTenantSnapshot);
backend/src/routes/superadmin.routes.ts:248:router.get('/firms/:tenantId/executive-brief', requireExecutive(), executiveBriefController.getExecutiveBrief);
backend/src/routes/superadmin.routes.ts:251:router.post('/firms/:tenantId/executive-brief/preflight', requireExecutive(), executiveBriefController.preflightRegenerateExecutiveBrief);
backend/src/routes/superadmin.routes.ts:254:router.post('/firms/:tenantId/executive-brief/generate', requireExecutive(), executiveBriefController.generateExecutiveBrief);
backend/src/routes/superadmin.routes.ts:257:router.post('/firms/:tenantId/executive-brief/approve', requireExecutive(), executiveBriefController.approveExecutiveBrief);
backend/src/routes/superadmin.routes.ts:260:router.post('/firms/:tenantId/executive-brief/deliver', requireExecutive(), executiveBriefController.deliverExecutiveBrief);
backend/src/routes/superadmin.routes.ts:263:router.post('/firms/:tenantId/executive-brief/generate-pdf', requireExecutive(), executiveBriefController.generateExecutiveBriefPDF);
backend/src/routes/superadmin.routes.ts:266:router.get('/firms/:tenantId/executive-brief/download', requireExecutive(), executiveBriefController.downloadExecutiveBrief);
backend/src/routes/superadmin.routes.ts:270:router.get('/webinar/registrations', superadminController.getWebinarRegistrations);
backend/src/routes/superadmin.routes.ts:276:router.get('/webinar/settings', superadminController.getWebinarSettings);
backend/src/routes/superadmin.routes.ts:287:router.post('/intakes/:intakeId/request-clarification', superadminController.requestIntakeClarification);
backend/src/routes/superadmin.routes.ts:288:router.post('/clarifications/:clarificationId/resend', superadminController.resendIntakeClarificationEmail);
backend/src/routes/superadmin.routes.ts:289:router.get('/intakes/:intakeId/clarifications', superadminController.getIntakeClarifications);
backend/src/routes/superadmin.routes.ts:293:router.post('/tenants/:tenantId/intake-vectors', intakeVectorController.createIntakeVector);
backend/src/routes/superadmin.routes.ts:296:router.get('/tenants/:tenantId/intake-vectors', intakeVectorController.getIntakeVectors);
backend/src/routes/superadmin.routes.ts:302:router.post('/intake-vectors/:id/send-invite', intakeVectorController.sendIntakeVectorInvite);
backend/src/routes/superadmin.routes.ts:305:router.post('/intakes/:intakeId/reopen', requireExecutive(), superadminController.reopenIntake);
backend/src/routes/superadmin.routes.ts:308:router.post('/tenants/:tenantId/repair-stakeholders', requireExecutive(), stakeholderRepairController.repairStakeholdersForTenant);
backend/src/routes/superadmin.routes.ts:311:router.post('/tenants/:tenantId/update-stakeholder-metadata', requireExecutive(), stakeholderMetadataUpdateController.updateStakeholderMetadata);
backend/src/routes/superadmin.routes.ts:320:router.post('/firms/:tenantId/lock-intake', superadminController.lockIntake);
backend/src/routes/superadmin.routes.ts:323:router.post('/firms/:tenantId/confirm-sufficiency', superadminController.confirmSufficiency);
backend/src/routes/superadmin.routes.ts:326:router.post('/firms/:tenantId/generate-diagnostics', superadminController.generateDiagnostics);
backend/src/routes/superadmin.routes.ts:329:router.post('/firms/:tenantId/diagnostics/:diagnosticId/lock', superadminController.lockDiagnostic);
backend/src/routes/superadmin.routes.ts:332:router.post('/firms/:tenantId/diagnostics/:diagnosticId/publish', superadminController.publishDiagnostic);
backend/src/routes/superadmin.routes.ts:335:router.get('/diagnostics/:diagnosticId/artifacts', superadminController.getDiagnosticArtifacts);
backend/src/routes/superadmin.routes.ts:338:router.get('/firms/:tenantId/discovery-notes', superadminController.getDiscoveryNotes);
backend/src/routes/superadmin.routes.ts:339:router.post('/firms/:tenantId/ingest-discovery', superadminController.ingestDiscoveryNotes);
backend/src/routes/superadmin.routes.ts:342:router.post('/firms/:tenantId/assisted-synthesis/generate-proposals', superadminController.generateAssistedProposals);
backend/src/routes/superadmin.routes.ts:343:router.get('/firms/:tenantId/findings/proposed', superadminController.getProposedFindings);
backend/src/routes/superadmin.routes.ts:344:router.post('/firms/:tenantId/findings/declare', superadminController.declareCanonicalFindings);
backend/src/routes/superadmin.routes.ts:347:router.get('/me', superadminController.getSuperAdminMe);
backend/src/routes/superadmin.routes.ts:350:router.get('/firms/:tenantId/assisted-synthesis/agent/session', superadminController.getAgentSession);
backend/src/routes/superadmin.routes.ts:351:router.post('/firms/:tenantId/assisted-synthesis/agent/messages', superadminController.sendAgentMessage);
backend/src/routes/superadmin.routes.ts:352:router.post('/firms/:tenantId/assisted-synthesis/agent/reset', superadminController.resetAgentSession);
backend/src/routes/superadmin.routes.ts:356:router.post('/firms/:tenantId/ticket-moderation/activate', validateTicketSchema, superadminController.activateTicketModeration);
backend/src/routes/superadmin.routes.ts:357:router.get('/firms/:tenantId/ticket-moderation/active', superadminController.getActiveModerationSession);
