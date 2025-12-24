/**
 * Webinar Routes
 * Password-gated multi-role diagnostic system
 */

import { Router } from 'express';
import { ipRateLimiter, sessionRateLimiter } from '../middleware/pulseagentRateLimit';
import * as webinarController from '../controllers/webinar.controller';

const router = Router();

/**
 * POST /api/public/webinar/auth
 * Validate webinar password
 */
router.post(
    '/auth',
    ipRateLimiter,
    webinarController.auth
);

/**
 * POST /api/public/webinar/register
 * Register for webinar
 */
router.post(
    '/register',
    ipRateLimiter,
    webinarController.register
);

/**
 * POST /api/public/webinar/diagnostic/chat
 * Multi-role diagnostic chat
 */
router.post(
    '/diagnostic/chat',
    ipRateLimiter,
    sessionRateLimiter,
    webinarController.diagnosticChat
);



/**
 * POST /api/public/webinar/diagnostic/team
 * Generate team report (explicit trigger)
 */
router.post(
    '/diagnostic/team',
    ipRateLimiter,
    webinarController.generateTeamResults
);

// Regression Guard
const assertHandler = (handler: any, name: string) => {
    if (typeof handler !== 'function') {
        throw new Error(`Webinar route handler not a function: ${name} (Received: ${typeof handler})`);
    }
};

// PDF Generation Routes
import * as pdfController from '../controllers/webinarPdf.controller';

assertHandler(pdfController.generateRolePdf, 'pdfController.generateRolePdf');
assertHandler(pdfController.generateTeamPdf, 'pdfController.generateTeamPdf');

/**
 * POST /api/public/webinar/pdf/role
 * Generate PDF for role report
 */
router.post(
    '/pdf/role',
    ipRateLimiter,
    pdfController.generateRolePdf
);

/**
 * POST /api/public/webinar/pdf/team
 * Generate PDF for team report
 */
router.post(
    '/pdf/team',
    ipRateLimiter,
    pdfController.generateTeamPdf
);

export default router;
