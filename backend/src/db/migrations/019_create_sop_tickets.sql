-- Migration 019: Create SOP Tickets table
-- Stores structured tickets generated from diagnostics via Prompt 1

CREATE TABLE IF NOT EXISTS sop_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  diagnostic_id VARCHAR(255) NOT NULL,
  ticket_id VARCHAR(10) NOT NULL,
  
  -- Core ticket content
  title TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  pain_source TEXT NOT NULL,
  description TEXT NOT NULL,
  current_state TEXT NOT NULL,
  target_state TEXT NOT NULL,
  
  -- Technical implementation
  ai_design TEXT NOT NULL,
  ghl_implementation TEXT NOT NULL,
  implementation_steps JSONB NOT NULL DEFAULT '[]',
  
  -- Ownership and dependencies
  owner VARCHAR(100) NOT NULL,
  dependencies JSONB NOT NULL DEFAULT '[]',
  
  -- Cost modeling
  time_estimate_hours INTEGER NOT NULL,
  cost_estimate INTEGER NOT NULL,
  success_metric TEXT NOT NULL,
  
  -- Roadmap integration
  roadmap_section VARCHAR(50) NOT NULL,
  priority VARCHAR(20) NOT NULL,
  sprint INTEGER NOT NULL,
  
  -- ROI projections
  projected_hours_saved_weekly INTEGER NOT NULL DEFAULT 0,
  projected_leads_recovered_monthly INTEGER NOT NULL DEFAULT 0,
  roi_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index for tenant-based queries
CREATE INDEX IF NOT EXISTS idx_sop_tickets_tenant_id 
  ON sop_tickets(tenant_id);

-- Index for diagnostic-based queries
CREATE INDEX IF NOT EXISTS idx_sop_tickets_diagnostic_id 
  ON sop_tickets(diagnostic_id);

-- Unique constraint on ticket_id per diagnostic
CREATE UNIQUE INDEX IF NOT EXISTS idx_sop_tickets_diagnostic_ticket 
  ON sop_tickets(diagnostic_id, ticket_id);

-- Index for sprint-based queries
CREATE INDEX IF NOT EXISTS idx_sop_tickets_sprint 
  ON sop_tickets(tenant_id, sprint);

-- Index for roadmap section queries
CREATE INDEX IF NOT EXISTS idx_sop_tickets_section 
  ON sop_tickets(tenant_id, roadmap_section);
