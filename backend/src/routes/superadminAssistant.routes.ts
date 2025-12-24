/**
 * SuperAdmin Assistant Routes
 * 
 * Endpoints for superadmins to tap into any firm's Assistant.
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { handleSuperadminAgentQuery } from '../controllers/superadminAssistant.controller';

const router = Router();

router.use(authenticate);

// POST /api/superadmin/assistant/query
// Body: { 
//   tenantId: string, 
//   message: string,
//   roleType?: 'owner' | 'ops' | 'tc' | 'agent_support',
//   visibility?: 'owner' | 'superadmin_only' | 'shared'
// }
router.post('/query', handleSuperadminAgentQuery);

export default router;
