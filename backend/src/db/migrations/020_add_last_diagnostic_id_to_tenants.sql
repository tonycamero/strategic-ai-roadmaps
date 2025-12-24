-- Migration 020: Add last_diagnostic_id to tenants
-- Tracks the most recent diagnostic used to generate roadmap/tickets

ALTER TABLE tenants 
  ADD COLUMN IF NOT EXISTS last_diagnostic_id VARCHAR(255);

-- Index for diagnostic lookups
CREATE INDEX IF NOT EXISTS idx_tenants_last_diagnostic_id 
  ON tenants(last_diagnostic_id);
