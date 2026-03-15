import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { listFirms } from '../controllers/firms.controller';

const router = Router();

/**
 * GET /api/firms
 * EXEC-TICKET-075-A: Tenant Browser — SA-only firm listing.
 */
router.get('/', authenticate, requireRole('superadmin'), listFirms);

export default router;
