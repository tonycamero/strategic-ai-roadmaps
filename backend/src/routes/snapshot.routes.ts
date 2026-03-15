import { Router } from 'express';
import { authenticate, requireTenantAccess } from '../middleware/auth';
import { getTenantSnapshot } from '../controllers/snapshot.controller';

const router = Router();

// GET /api/snapshot/:tenantId - Public/Tenant Snapshot (Decoupled from AI)
router.get('/:tenantId', authenticate, requireTenantAccess(), getTenantSnapshot);

export default router;
