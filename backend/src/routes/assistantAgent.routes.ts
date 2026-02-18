/**
 * Assistant Agent Routes (Owner/Team)
 * 
 * LEGACY - Section Assistant functionality
 * Previously used for section-specific Q&A but replaced by Roadmap Q&A Agent.
 * Kept for potential future editor/writing mode.
 * 
 * NOT USED IN PRODUCTION V1 - Use /api/roadmap/qna instead
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { handleOwnerAgentQuery } from '../controllers/assistantAgent.controller';

const router = Router();

// All Assistant queries require auth
router.use(authenticate);

// POST /api/assistant/query
// Body: { message: string, roleType?: 'owner' | 'ops' | 'tc' | 'agent_support' }
router.post('/query', handleOwnerAgentQuery);

export default router;
