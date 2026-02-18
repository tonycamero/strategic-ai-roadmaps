import { Router } from 'express';
import * as clarificationController from '../controllers/clarification.controller';

const router = Router();

// GET /api/clarify/:token - Get clarification details
router.get('/:token', clarificationController.getClarificationByToken);

// POST /api/clarify/:token - Submit clarification response
router.post('/:token', clarificationController.submitClarification);

export default router;
