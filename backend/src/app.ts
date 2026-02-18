import express from 'express';
import path from 'path';
import cors, { type CorsOptions } from 'cors';
import { requestIdMiddleware } from './utils/requestId';

import authRoutes from './routes/auth.routes';
import inviteRoutes from './routes/invite.routes';
import intakeRoutes from './routes/intake.routes';
import superadminRoutes from './routes/superadmin.routes';
import leadRequestRoutes from './routes/leadRequest.routes';
import documentsRoutes from './routes/documents.routes';
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
import diagnosticRoutes from './routes/diagnostic.routes';
import diagnosticGenerationRoutes from './routes/diagnostic_generation.routes';
import onboardingRoutes from './routes/onboarding.routes';
import commandCenterRoutes from './routes/command_center.routes';
import tenantsRoutes from './routes/tenants.routes';
import internalEvidenceRoutes from './routes/internalEvidence.routes';
import healthRoutes from './routes/health.routes';
import agentRoutes from './routes/agent.routes';
import agentConfigRoutes from './routes/agentConfig.routes';
import clarificationRoutes from './routes/clarification.routes';

const app = express();

// Trust proxy - required for Vercel/Netlify + proper IP handling/rate limiting
app.set('trust proxy', 1);

/**
 * CORS (MUST be first middleware)
 * Supports:
 *  - local dev
 *  - production portal
 *  - staging portal
 * Optional override via env:
 *  - CORS_ALLOWED_ORIGINS="https://portal.strategicai.app,https://staging-sar-portal.strategicai.app,http://localhost:5173"
 */
const defaultAllowedOrigins = [
  'http://localhost:5173',
  'https://portal.strategicai.app',
  'https://staging-sar-portal.strategicai.app',
];

const envAllowedOrigins =
  process.env.CORS_ALLOWED_ORIGINS?.split(',')
    .map((s) => s.trim())
    .filter(Boolean) ?? [];

const allowedOrigins = new Set<string>(
  (envAllowedOrigins.length ? envAllowedOrigins : defaultAllowedOrigins).map((o) => o.replace(/\/$/, '')),
);

const corsOptions: CorsOptions = {
  origin: (origin, cb) => {
    // allow non-browser/server-to-server calls (no Origin header)
    if (!origin) return cb(null, true);
    const normalized = origin.replace(/\/$/, '');
    if (allowedOrigins.has(normalized)) return cb(null, true);
    return cb(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body parsing (once)
app.use(express.json({ limit: '2mb' }));

// EXEC-BRIEF-PREUI-SWEEP-004: Request ID correlation for observability
app.use(requestIdMiddleware);

// Serve uploads locally in dev/non-blob mode
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Health check (root)
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/intake', intakeRoutes);
app.use('/api/documents', documentsRoutes);

app.use('/api/roadmap', roadmapRoutes); // Roadmap viewer
app.use('/api/ticket-instances', ticketInstanceRoutes); // Ticket management
app.use('/api/tickets', ticketRoutes); // Ticket status/assignee/notes
app.use('/api/agents', agentThreadRoutes); // Agent threads & messages
app.use('/api/dashboard', dashboardRoutes); // Owner dashboard
app.use('/api/debug', debugLogsRoutes); // Debug logs (superadmin + owners)
app.use('/api/agent', agentRoutes); // Legacy chat completions
app.use('/api/assistant', assistantAgentRoutes); // Assistants API for owner/team
app.use('/api/agents', agentConfigRoutes); // Agent configs (mounted under /api/agents/*)

app.use('/api/superadmin/assistant', superadminAssistantRoutes); // SuperAdmin tap-in
app.use('/api/superadmin/command-center', commandCenterRoutes);
app.use('/api/superadmin', superadminRoutes);

app.use('/api/diagnostics', diagnosticGenerationRoutes); // Diagnostic ticket+roadmap generation
app.use('/api/public/pulseagent', pulseagentRoutes); // Public PulseAgent API
app.use('/api/public/trustagent', trustagentRoutes); // Unified TrustAgent API
app.use('/api/public/diagnostic', diagnosticRoutes); // Team Execution Diagnostic

app.use('/api/tenants', tenantsRoutes); // Tenant business profile
app.use('/api/tenants', onboardingRoutes); // Tenant onboarding progress
app.use('/api/clarify', clarificationRoutes); // Stakeholder Clarification Form

app.use('/api', leadRequestRoutes); // Public routes

if (process.env.INTERNAL_EVIDENCE_TOKEN) {
  app.use('/api/internal/evidence', internalEvidenceRoutes);
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export { app };
