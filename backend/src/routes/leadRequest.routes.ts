import { Router } from 'express';
import { createLeadRequest } from '../controllers/leadRequest.controller.js';

const router = Router();

// Public endpoint - no auth required
router.post('/lead-request', createLeadRequest);

export default router;
