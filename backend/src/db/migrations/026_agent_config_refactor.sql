-- Migration 026: Agent Config Refactor
-- Date: 2024-12-09
-- Purpose: Refactor agent_configs for single-assistant-per-tenant architecture
-- Removes role_type, adds agent_type, config_version, and instructions_hash

-- ============================================================================
-- STEP 1: Add new columns to agent_configs
-- ============================================================================

ALTER TABLE agent_configs 
  ADD COLUMN agent_type TEXT DEFAULT 'roadmap_coach',
  ADD COLUMN config_version INTEGER DEFAULT 1,
  ADD COLUMN instructions_hash TEXT;

-- ============================================================================
-- STEP 2: Backfill existing configs
-- ============================================================================

-- Set all existing configs to roadmap_coach type and version 1
UPDATE agent_configs 
SET 
  agent_type = 'roadmap_coach',
  config_version = 1
WHERE agent_type IS NULL;

-- Compute initial instructions_hash (SHA-256 of concatenated fields)
-- This gives us a baseline for tracking prompt changes
UPDATE agent_configs
SET instructions_hash = encode(
  digest(
    COALESCE(system_identity, '') || 
    COALESCE(business_context, '') || 
    COALESCE(role_playbook, '') || 
    COALESCE(custom_instructions, ''),
    'sha256'
  ),
  'hex'
)
WHERE instructions_hash IS NULL;

-- ============================================================================
-- STEP 3: Drop old role_type column and related constraints
-- ============================================================================

-- Drop the unique constraint on (tenant_id, role_type)
ALTER TABLE agent_configs DROP CONSTRAINT IF EXISTS agent_configs_tenant_id_role_type_key;

-- Drop the index on tenant + role
DROP INDEX IF EXISTS idx_agent_configs_tenant_role;

-- Drop the role_type column
ALTER TABLE agent_configs DROP COLUMN IF EXISTS role_type;

-- ============================================================================
-- STEP 4: Add new constraints and indexes
-- ============================================================================

-- Ensure one roadmap_coach per tenant
CREATE UNIQUE INDEX idx_agent_configs_tenant_type 
  ON agent_configs(tenant_id, agent_type);

-- Index for quick lookups by type
CREATE INDEX idx_agent_configs_type 
  ON agent_configs(agent_type) 
  WHERE is_active = TRUE;

-- ============================================================================
-- STEP 5: Update comments
-- ============================================================================

COMMENT ON TABLE agent_configs IS 'Agent configurations - one assistant per tenant with versioned prompts';
COMMENT ON COLUMN agent_configs.agent_type IS 'Type of assistant: roadmap_coach (default), exec_overview (future)';
COMMENT ON COLUMN agent_configs.config_version IS 'Version number for tracking prompt iterations';
COMMENT ON COLUMN agent_configs.instructions_hash IS 'SHA-256 hash of composed instructions for change detection';

-- ============================================================================
-- STEP 6: Clean up duplicate configs (keep most recent per tenant)
-- ============================================================================

-- This handles the case where multiple role-based configs exist per tenant
-- We keep the most recently updated config for each tenant
WITH ranked_configs AS (
  SELECT 
    id,
    tenant_id,
    ROW_NUMBER() OVER (
      PARTITION BY tenant_id 
      ORDER BY last_provisioned_at DESC NULLS LAST, updated_at DESC
    ) as rn
  FROM agent_configs
)
DELETE FROM agent_configs
WHERE id IN (
  SELECT id FROM ranked_configs WHERE rn > 1
);
