-- =============================================
-- Add discovery_call_notes table + discovery_complete flag
-- Ensures roadmap generation cannot proceed without SOP-02 discovery call
-- =============================================

-- 1) discovery_call_notes table
CREATE TABLE IF NOT EXISTS discovery_call_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notes TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discovery_call_notes_tenant_id
  ON discovery_call_notes (tenant_id);

-- 2) tenants.discovery_complete flag
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS discovery_complete BOOLEAN NOT NULL DEFAULT FALSE;
