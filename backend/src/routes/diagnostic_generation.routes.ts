/**
 * Diagnostic Routes
 * 
 * POST /api/diagnostics/generate - Generate tickets + roadmap from DiagnosticMap
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as diagnosticController from '../controllers/diagnostic.controller';

const router = Router();

// All diagnostic routes require authentication (superadmin only)
router.use(authenticate);

// POST /api/diagnostics/generate - Accepts DiagnosticMap JSON, triggers full pipeline
// Hard guard to prevent crashes if controller is missing
if (typeof diagnosticController.generateFromDiagnostic !== "function") {
    throw new Error("diagnostic_generation route handler not a function: generateFromDiagnostic");
}

router.post('/generate', diagnosticController.generateFromDiagnostic);

export default router;
