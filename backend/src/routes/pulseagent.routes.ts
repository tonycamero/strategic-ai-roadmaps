import { Router } from 'express';
import { pulseagentPublicGuard } from '../middleware/pulseagentPublicGuard';
import { ipRateLimiter, sessionRateLimiter } from '../middleware/pulseagentRateLimit';
import * as pulseagentHomepageController from '../controllers/pulseagentHomepage.controller.ts';

const router = Router();

/**
 * POST /api/public/pulseagent/homepage/chat
 * Public endpoint for homepage PulseAgent conversations (no auth required)
 * Protected by safety guard middleware and rate limiting
 */
router.post(
  '/homepage/chat',
  ipRateLimiter,
  sessionRateLimiter,
  pulseagentPublicGuard,
  pulseagentHomepageController.chat
);

/**
 * GET /api/public/pulseagent/homepage/debug
 * Debug endpoint to inspect assistant configuration
 */
router.get('/homepage/debug', pulseagentHomepageController.debug);

/**
 * Legacy endpoint for backward compatibility
 * Redirects to new homepage/chat endpoint
 */
router.post('/ask', (req, res) => {
  res.status(301).json({
    error: 'Endpoint moved',
    message: 'Please use /api/public/pulseagent/homepage/chat instead',
    newEndpoint: '/api/public/pulseagent/homepage/chat',
  });
});

export default router;
