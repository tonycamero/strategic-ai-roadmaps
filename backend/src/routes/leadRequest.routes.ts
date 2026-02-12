import { Router } from 'express';
import { createLeadRequest } from '../controllers/leadRequest.controller.js.ts';

const router = Router();

// Public endpoint - no auth required
router.post('/lead-request', createLeadRequest);

export default router;
