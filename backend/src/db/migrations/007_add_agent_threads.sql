-- Create agent_threads table for per-user conversation management
-- Supports owner threads + superadmin tap-in threads with visibility control

CREATE TABLE agent_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_config_id UUID NOT NULL REFERENCES agent_configs(id) ON DELETE CASCADE,
  role_type VARCHAR(32) NOT NULL,
  openai_thread_id VARCHAR(128) NOT NULL,
  actor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_role VARCHAR(32) NOT NULL,
  visibility VARCHAR(32) NOT NULL DEFAULT 'owner',
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Index for fast lookup of threads by tenant + role + actor
CREATE INDEX idx_agent_threads_tenant_role_actor 
  ON agent_threads (tenant_id, role_type, actor_user_id, actor_role);

-- Index for listing threads by visibility (for admin views)
CREATE INDEX idx_agent_threads_visibility 
  ON agent_threads (visibility, last_activity_at DESC);
