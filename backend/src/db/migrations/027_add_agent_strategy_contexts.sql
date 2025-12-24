-- Migration 027: Add agent_strategy_contexts table
-- Purpose: Store runtime StrategyContext for debugging and auditing
-- Date: December 2025

CREATE TABLE IF NOT EXISTS agent_strategy_contexts (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  context JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_agent_strategy_contexts_updated_at 
  ON agent_strategy_contexts(updated_at DESC);

-- Comment for documentation
COMMENT ON TABLE agent_strategy_contexts IS 
  'Stores runtime StrategyContext (roadmap signals, tactical frame, objectives) for each tenant. Used for debugging and auditing assistant behavior.';

COMMENT ON COLUMN agent_strategy_contexts.context IS 
  'JSONB containing StrategyContext: { tenantId, personaRole, roadmapSignals, tacticalFrame, objectives }';
