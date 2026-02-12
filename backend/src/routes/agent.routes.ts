import { Router } from 'express';
import { handleAgentQuery } from '../controllers/agent.controller.ts';
import { authenticate } from '../middleware/auth';

const router = Router();

// POST /api/agent/query
router.post('/query', authenticate, handleAgentQuery);

export default router;
