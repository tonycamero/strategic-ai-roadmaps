import { Router } from 'express';
import { sealEnvelope } from '../controllers/proposalEnvelope.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// POST /api/envelopes/seal
// Seals the current moderated state into an immutable envelope.
router.post('/seal', authenticate, sealEnvelope);

export default router;
