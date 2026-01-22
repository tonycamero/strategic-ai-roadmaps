import 'dotenv/config';

import express from 'express';
import path from 'path';
import cors from 'cors';

import authRoutes from './routes/auth.routes';
import inviteRoutes from './routes/invite.routes';
import intakeRoutes from './routes/intake.routes';
import superadminRoutes from './routes/superadmin.routes';
import leadRequestRoutes from './routes/leadRequest.routes';
import documentsRoutes from './routes/documents.routes';
import agentRoutes from './routes/agent.routes';
import agentConfigRoutes from './routes/agentConfig.routes';
import assistantAgentRoutes from './routes/assistantAgent.routes';
import superadminAssistantRoutes from './routes/superadminAssistant.routes';
import roadmapRoutes from './routes/roadmap.routes';
import ticketInstanceRoutes from './routes/ticketInstance.routes';
import ticketRoutes from './routes/ticket.routes';
import agentThreadRoutes from './routes/agentThread.routes';
import dashboardRoutes from './routes/dashboard.routes';
import debugLogsRoutes from './routes/debugLogs.routes';
import pulseagentRoutes from './routes/pulseagent.routes';
import trustagentRoutes from './routes/trustagent.routes';
import diagnosticRoutes from './routes/diagnostic.routes'; // formerly webinar.routes
import diagnosticGenerationRoutes from './routes/diagnostic_generation.routes'; // formerly diagnostic.routes
import onboardingRoutes from './routes/onboarding.routes';
import commandCenterRoutes from './routes/command_center.routes';

import tenantsRoutes from './routes/tenants.routes';
import internalEvidenceRoutes from './routes/internalEvidence.routes';

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy - required for Vercel and proper rate limiting
app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploads locally in dev/non-blob mode
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/intake', intakeRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/roadmap', roadmapRoutes);          // Roadmap viewer
app.use('/api/ticket-instances', ticketInstanceRoutes); // Ticket management
app.use('/api/tickets', ticketRoutes);           // Ticket status/assignee/notes
app.use('/api/agents', agentThreadRoutes);       // Agent threads & messages
app.use('/api/dashboard', dashboardRoutes);      // Owner dashboard
app.use('/api/debug', debugLogsRoutes);          // Debug logs (superadmin + owners)
app.use('/api/agent', agentRoutes);              // Legacy chat completions
app.use('/api/assistant', assistantAgentRoutes); // NEW: Assistants API for owner/team
app.use('/api/agents', agentConfigRoutes);
app.use('/api/superadmin/assistant', superadminAssistantRoutes); // SuperAdmin tap-in
app.use('/api/superadmin/command-center', commandCenterRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/diagnostics', diagnosticGenerationRoutes); // Diagnostic ticket+roadmap generation (PRESERVED)
app.use('/api/public/pulseagent', pulseagentRoutes); // Public PulseAgent API
app.use('/api/public/trustagent', trustagentRoutes); // Unified TrustAgent API
app.use('/api/public/diagnostic', diagnosticRoutes); // Team Execution Diagnostic (formerly webinar)
app.use('/api/tenants', tenantsRoutes); // Tenant business profile
app.use('/api/tenants', onboardingRoutes); // Tenant onboarding progress
app.use('/api', leadRequestRoutes); // Public routes
if (process.env.INTERNAL_EVIDENCE_TOKEN) {
  app.use('/api/internal/evidence', internalEvidenceRoutes);
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Only start server if not running in Vercel serverless environment
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

// Export for Vercel serverless
export default app;
