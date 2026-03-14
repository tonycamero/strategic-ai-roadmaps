import { Router } from 'express';
import { handleAgentQuery } from '../controllers/agent.controller';
import { getAnalysis } from '../controllers/trustAgent.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// POST /api/agent/query (Legacy/Chat)
router.post('/query', authenticate, handleAgentQuery);

// GET /api/agent/analysis/:tenantId (Trust Console Analysis)
router.get('/analysis/:tenantId', authenticate, getAnalysis);

export default router;
