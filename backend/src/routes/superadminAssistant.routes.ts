/**
 * SuperAdmin Assistant Routes
 *
 * Endpoints for superadmins to tap into any firm's Assistant.
 *
 * Security model:
 * - Authentication required
 * - Authority derived
 * - Superadmin-only access (NOT just executive)
 * - Controller must still validate tenantId in body
 */

import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { deriveAuthority } from '../middleware/authority';
import { handleSuperadminAgentQuery } from '../controllers/superadminAssistant.controller';

const router = Router();

// Must be authenticated
router.use(authenticate);

// Derive authority category
router.use(deriveAuthority);

// HARD GATE: superadmin only
router.use(requireRole('superadmin'));

// POST /api/superadmin/assistant/query
// Body:
// {
//   tenantId: string,
//   message: string,
//   roleType?: 'owner' | 'ops' | 'tc' | 'agent_support',
//   visibility?: 'owner' | 'superadmin_only' | 'shared'
// }
router.post('/query', handleSuperadminAgentQuery);


export default router;