-- Add OpenAI Assistant provisioning columns to agent_configs
-- Enables per-firm Assistant instances with vector store support

ALTER TABLE agent_configs
  ADD COLUMN openai_assistant_id VARCHAR(128),
  ADD COLUMN openai_vector_store_id VARCHAR(128),
  ADD COLUMN openai_model VARCHAR(64) DEFAULT 'gpt-4-1106-preview',
  ADD COLUMN last_provisioned_at TIMESTAMP;

-- Index for quick lookup by assistant_id
CREATE INDEX idx_agent_configs_assistant ON agent_configs(openai_assistant_id) WHERE openai_assistant_id IS NOT NULL;
