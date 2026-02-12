/**
 * TrustAgent Routes
 * Routes for both Homepage (Persistent) and FE-TA (Ephemeral) modes.
 */

import { Router } from 'express';
import { pulseagentPublicGuard } from '../middleware/pulseagentPublicGuard.ts';
import { ipRateLimiter, sessionRateLimiter } from '../middleware/pulseagentRateLimit.ts';
import * as trustagentHomepageController from '../controllers/trustagentHomepage.controller.ts';

const router = Router();

/**
 * POST /api/public/trustagent/homepage/chat
 * Unified endpoint for TrustAgent conversations.
 * Auto-branches based on 'mode' in body.
 */
router.post(
    '/homepage/chat',
    ipRateLimiter,
    sessionRateLimiter,
    pulseagentPublicGuard,
    trustagentHomepageController.chat
);

// Debug endpoint (Homepage persistent mode only)
router.get('/homepage/debug', trustagentHomepageController.debug);

export default router;
