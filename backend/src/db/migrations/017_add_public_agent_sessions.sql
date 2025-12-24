-- Migration 017: Add Public Agent Sessions
-- Creates table for tracking anonymous homepage PulseAgent sessions

CREATE TABLE IF NOT EXISTS public_agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(128) UNIQUE NOT NULL,
  openai_thread_id VARCHAR(128),
  page_context JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index for fast session lookups
CREATE INDEX IF NOT EXISTS idx_public_agent_sessions_session_id 
  ON public_agent_sessions(session_id);

-- Index for cleanup queries (old sessions)
CREATE INDEX IF NOT EXISTS idx_public_agent_sessions_last_activity 
  ON public_agent_sessions(last_activity_at);
