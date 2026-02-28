-- EXEC-17: Operator append-only clarification layer.
-- Each row = one immutable delta. Append-only by design.
-- Freeze boundary enforced at application layer via ticketModerationSessions.

CREATE TABLE IF NOT EXISTS discovery_notes_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source VARCHAR(50) NOT NULL,
  delta TEXT NOT NULL,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS discovery_notes_log_tenant_idx
  ON discovery_notes_log (tenant_id, created_at DESC);
