-- Migration 010: Ticket packs and per-ticket instances
-- Per-firm execution plan + completion state

CREATE TABLE ticket_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  roadmap_id UUID REFERENCES roadmaps(id) ON DELETE SET NULL,

  version VARCHAR(20) NOT NULL DEFAULT 'v1.0',
  status VARCHAR(20) NOT NULL DEFAULT 'not_started', -- not_started | in_progress | completed

  total_tickets INTEGER NOT NULL DEFAULT 0,
  total_sprints INTEGER NOT NULL DEFAULT 0,

  -- JSON structure:
  -- [
  --   {
  --     "sprint_number": 1,
  --     "name": "Foundation",
  --     "ticket_instances": ["uuid-1", "uuid-2"],
  --     "planned_start": "2025-01-01",
  --     "planned_end": "2025-01-14"
  --   }, ...
  -- ]
  sprint_assignments JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Rollup stats:
  -- { "tickets": 85, "done": 45, "in_progress": 20, "blocked": 3, "not_started": 17 }
  totals JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ticket_packs_tenant_id
  ON ticket_packs (tenant_id);

CREATE INDEX idx_ticket_packs_roadmap_id
  ON ticket_packs (roadmap_id);

ALTER TABLE ticket_packs
  ADD CONSTRAINT check_ticket_packs_status
  CHECK (status IN ('not_started', 'in_progress', 'completed'));

COMMENT ON TABLE ticket_packs IS 'Per-tenant ticket pack that organizes execution tickets into sprints';


CREATE TABLE ticket_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_pack_id UUID NOT NULL REFERENCES ticket_packs(id) ON DELETE CASCADE,

  -- Reference to master ticket ID from SCEND_GHL_TICKET_LIBRARY (e.g. "T1.3.1")
  ticket_id VARCHAR(50) NOT NULL,

  status VARCHAR(20) NOT NULL DEFAULT 'not_started', -- not_started | in_progress | blocked | done | skipped
  assignee VARCHAR(255),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ticket_instances_pack_id
  ON ticket_instances (ticket_pack_id);

CREATE INDEX idx_ticket_instances_status
  ON ticket_instances (status);

ALTER TABLE ticket_instances
  ADD CONSTRAINT check_ticket_instances_status
  CHECK (status IN ('not_started', 'in_progress', 'blocked', 'done', 'skipped'));

COMMENT ON TABLE ticket_instances IS 'Per-firm, per-pack ticket instance with completion status';
COMMENT ON COLUMN ticket_instances.ticket_id IS 'ID from master ticket library (e.g. T1.3.1)';
