/**
 * Agent Configuration Routes
 *
 * API routes for agent config CRUD operations.
 *
 * Security model:
 * - All routes require authentication
 * - All routes require executive-level authority (or superadmin, via authority middleware)
 * - Any route referencing :tenantId must hard-check tenant access via requireTenantAccess()
 * - Any route referencing :id must be protected in the controller (object-level tenant check)
 */

import { Router } from 'express';
import {
  handleListConfigs,
  handleGetConfig,
  handleUpdateConfig,
} from '../controllers/agentConfig.controller';
import { authenticate, requireTenantAccess } from '../middleware/auth';
import { deriveAuthority, requireExecutive } from '../middleware/authority';

const router = Router();

// All routes require authentication + authority derivation
router.use(authenticate);
router.use(deriveAuthority);

// All agent config routes require executive authority (or superadmin, depending on your middleware logic)
router.use(requireExecutive());

// Tenant-scoped reads MUST enforce tenant access at router level.
// Assumes requireTenantAccess() checks req.params.tenantId (or otherwise validates tenant scope).
router.get('/configs/:tenantId', requireTenantAccess(), handleListConfigs);
router.get('/configs/:tenantId/:roleType', requireTenantAccess(), handleGetConfig);

// ID-scoped update MUST be object-authorized in the controller (config.tenantId vs req.user.tenantId).
// If you want belt+suspenders, you can also add a controller-side tenant check only (recommended).
router.put('/configs/:id', handleUpdateConfig);


export default router;