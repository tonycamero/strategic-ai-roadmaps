-- Migration 018: Add Public Agent Events
-- Logs public chat interactions for analytics

CREATE TABLE IF NOT EXISTS public_agent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(128) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index for session-based queries
CREATE INDEX IF NOT EXISTS idx_public_agent_events_session_id 
  ON public_agent_events(session_id);

-- Index for event type analytics
CREATE INDEX IF NOT EXISTS idx_public_agent_events_type 
  ON public_agent_events(event_type);

-- Index for time-based analytics
CREATE INDEX IF NOT EXISTS idx_public_agent_events_created_at 
  ON public_agent_events(created_at);
