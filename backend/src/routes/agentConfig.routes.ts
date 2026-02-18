/**
 * Agent Configuration Routes
 * 
 * API routes for agent config CRUD operations.
 */

import { Router } from 'express';
import {
  handleListConfigs,
  handleGetConfig,
  handleUpdateConfig,
} from '../controllers/agentConfig.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/agents/configs/:tenantId - List configs for tenant
router.get('/configs/:tenantId', handleListConfigs);

// GET /api/agents/configs/:tenantId/:roleType - Get specific config
router.get('/configs/:tenantId/:roleType', handleGetConfig);

// PUT /api/agents/configs/:id - Update config (role-aware)
router.put('/configs/:id', handleUpdateConfig);

export default router;
