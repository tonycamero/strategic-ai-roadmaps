import { Router } from 'express';
import * as opsSignalController from '../controllers/opsSignal.controller';

const router = Router();

// Participant Identity
router.post('/participant', opsSignalController.registerParticipant);

// Signal Submission
router.post('/submit', opsSignalController.submitSignal);

export default router;
