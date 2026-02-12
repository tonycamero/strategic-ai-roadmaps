import { Router } from 'express';
import { getDebugLogs, getLogEventTypes } from '../controllers/debugLogs.controller.ts';
import { authenticate } from '../middleware/auth';

const router = Router();

// All debug routes require authentication
router.use(authenticate);

// GET /api/debug/logs - Fetch debug logs for a tenant
router.get('/logs', getDebugLogs);

// GET /api/debug/logs/types - Get available event types
router.get('/logs/types', getLogEventTypes);


export default router;
