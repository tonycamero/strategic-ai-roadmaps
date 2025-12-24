-- Migration 029: Add inventory tracking columns to sop_tickets
-- Enables linking tickets back to canonical inventory SOPs

ALTER TABLE sop_tickets
  ADD COLUMN IF NOT EXISTS inventory_id VARCHAR(64),
  ADD COLUMN IF NOT EXISTS is_sidecar BOOLEAN DEFAULT FALSE;

-- Index for inventory-based queries
CREATE INDEX IF NOT EXISTS idx_sop_tickets_inventory_id 
  ON sop_tickets(inventory_id);

-- Index for sidecar filtering
CREATE INDEX IF NOT EXISTS idx_sop_tickets_is_sidecar 
  ON sop_tickets(tenant_id, is_sidecar);

COMMENT ON COLUMN sop_tickets.inventory_id IS 'References canonical SOP inventory entry (e.g., "PIPE-001", "SIDECAR-WATCH-01")';
COMMENT ON COLUMN sop_tickets.is_sidecar IS 'TRUE if this SOP requires external sidecar service, FALSE for GHL-native';
