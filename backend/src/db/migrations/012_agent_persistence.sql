-- Migration 012: Agent Persistence Tables
-- Adds message persistence, event logging, and routing rules for multi-agent system

-- ============================================================================
-- AGENT MESSAGES
-- Persist all user and assistant messages for conversation history
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_thread_id UUID NOT NULL REFERENCES agent_threads(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_messages_thread ON agent_messages(agent_thread_id);
CREATE INDEX idx_agent_messages_created ON agent_messages(created_at DESC);

-- ============================================================================
-- AGENT LOGS
-- Event logging for provisioning, queries, syncs, and errors
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_config_id UUID REFERENCES agent_configs(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_logs_config ON agent_logs(agent_config_id);
CREATE INDEX idx_agent_logs_type ON agent_logs(event_type);
CREATE INDEX idx_agent_logs_created ON agent_logs(created_at DESC);

-- ============================================================================
-- AGENT ROUTING RULES
-- Pattern-based routing overrides for intelligent agent selection
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  pattern TEXT NOT NULL,
  route_to VARCHAR(32) NOT NULL CHECK (route_to IN ('owner', 'ops', 'tc', 'agent_support')),
  priority INT DEFAULT 10,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_routing_tenant ON agent_routing_rules(tenant_id);
CREATE INDEX idx_agent_routing_priority ON agent_routing_rules(priority DESC, created_at);
CREATE INDEX idx_agent_routing_active ON agent_routing_rules(is_active) WHERE is_active = true;

-- Add helpful comments
COMMENT ON TABLE agent_messages IS 'Persists all agent conversation messages for history and audit';
COMMENT ON TABLE agent_logs IS 'Event log for agent provisioning, queries, syncs, and errors';
COMMENT ON TABLE agent_routing_rules IS 'Pattern-based routing rules for intelligent agent selection';
