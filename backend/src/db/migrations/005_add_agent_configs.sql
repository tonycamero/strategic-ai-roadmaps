-- Migration: Add agent_configs table for multi-field prompt composition
-- Date: 2025-11-22
-- Purpose: Enable per-firm, per-role agent configuration with VC support

CREATE TABLE agent_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role_type VARCHAR(32) NOT NULL,
  
  -- Prompt composition fields
  system_identity TEXT NOT NULL,
  business_context TEXT,
  custom_instructions TEXT,
  role_playbook TEXT NOT NULL,
  
  -- Tool configuration with VC flag
  tool_context JSONB DEFAULT '{"tools": []}'::jsonb,
  
  -- Metadata
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  
  -- One config per (tenant, role) pair
  UNIQUE (tenant_id, role_type)
);

-- Index for lookups
CREATE INDEX idx_agent_configs_tenant_role ON agent_configs(tenant_id, role_type);
CREATE INDEX idx_agent_configs_active ON agent_configs(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE agent_configs IS 'Agent configurations for multi-field prompt composition per firm and role';
COMMENT ON COLUMN agent_configs.system_identity IS 'Locked system identity and mission (Tony controls)';
COMMENT ON COLUMN agent_configs.business_context IS 'Auto-generated from intake + roadmap data';
COMMENT ON COLUMN agent_configs.custom_instructions IS 'Owner-editable preferences and communication style';
COMMENT ON COLUMN agent_configs.role_playbook IS 'Role-specific workflows, priorities, guardrails (Tony IP)';
COMMENT ON COLUMN agent_configs.tool_context IS 'JSON array of {key, enabled, verifiedCompute} for each tool';
