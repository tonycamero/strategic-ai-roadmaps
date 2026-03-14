import { Router } from 'express';
import { handleIncomingSignal } from '../controllers/signal.controller';

const router = Router();

// POST /api/signals
// Endpoint for external systems to send operational telemetry.
router.post('/', handleIncomingSignal);

export default router;
