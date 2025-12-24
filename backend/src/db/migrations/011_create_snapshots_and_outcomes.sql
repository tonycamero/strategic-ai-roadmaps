-- Migration 011: Implementation snapshots + roadmap outcomes
-- Metrics capture + learning loop

CREATE TABLE implementation_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  roadmap_id UUID REFERENCES roadmaps(id) ON DELETE SET NULL,

  snapshot_date TIMESTAMPTZ NOT NULL,
  label VARCHAR(20) NOT NULL, -- baseline | 30d | 60d | 90d | custom
  source VARCHAR(20) NOT NULL, -- manual | ghl_export | api

  -- Metrics JSONB:
  -- {
  --   "lead_response_minutes": 12.0,
  --   "lead_to_appt_rate": 0.35,
  --   "close_rate": 0.28,
  --   "crm_adoption_rate": 0.2,
  --   "weekly_ops_hours": 12,
  --   "nps": 42
  -- }
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_impl_snapshots_tenant_roadmap
  ON implementation_snapshots (tenant_id, roadmap_id);

CREATE INDEX idx_impl_snapshots_label
  ON implementation_snapshots (label);

ALTER TABLE implementation_snapshots
  ADD CONSTRAINT check_impl_snapshots_label
  CHECK (label IN ('baseline', '30d', '60d', '90d', 'custom'));

ALTER TABLE implementation_snapshots
  ADD CONSTRAINT check_impl_snapshots_source
  CHECK (source IN ('manual', 'ghl_export', 'api'));

COMMENT ON TABLE implementation_snapshots IS 'Point-in-time metrics for roadmap implementation';


CREATE TABLE roadmap_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,

  baseline_snapshot_id UUID REFERENCES implementation_snapshots(id) ON DELETE SET NULL,
  at_30d_snapshot_id UUID REFERENCES implementation_snapshots(id) ON DELETE SET NULL,
  at_60d_snapshot_id UUID REFERENCES implementation_snapshots(id) ON DELETE SET NULL,
  at_90d_snapshot_id UUID REFERENCES implementation_snapshots(id) ON DELETE SET NULL,

  -- Deltas JSONB:
  -- { "lead_response_minutes": -8.5, "weekly_ops_hours": -7, "crm_adoption_rate": 0.53, "nps": 19 }
  deltas JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Realized ROI JSONB:
  -- {
  --   "time_savings_hours_annual": 720,
  --   "time_savings_value_annual": 36000,
  --   "revenue_impact_annual": 52500,
  --   "cost_avoidance_annual": 18000,
  --   "net_roi_percent": 381
  -- }
  realized_roi JSONB,

  status VARCHAR(20) NOT NULL DEFAULT 'on_track', -- on_track | at_risk | off_track
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_roadmap_outcomes_tenant_roadmap
  ON roadmap_outcomes (tenant_id, roadmap_id);

ALTER TABLE roadmap_outcomes
  ADD CONSTRAINT check_roadmap_outcomes_status
  CHECK (status IN ('on_track', 'at_risk', 'off_track'));

COMMENT ON TABLE roadmap_outcomes IS 'Real-world outcome summary and ROI for a roadmap';
