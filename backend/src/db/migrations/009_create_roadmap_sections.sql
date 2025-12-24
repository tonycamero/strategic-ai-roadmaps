-- Migration 009: Create roadmap_sections table
-- Individual roadmap sections with status + agent metadata

CREATE TABLE roadmap_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  section_number INTEGER NOT NULL,
  section_name VARCHAR(50) NOT NULL,
  content_markdown TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'planned',
  last_updated_at TIMESTAMPTZ,
  agent_cheatsheet JSONB DEFAULT '{}'::jsonb,
  word_count INTEGER,
  diagrams JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_roadmap_sections_roadmap_id
  ON roadmap_sections (roadmap_id);

CREATE INDEX idx_roadmap_sections_section_number
  ON roadmap_sections (roadmap_id, section_number);

CREATE INDEX idx_roadmap_sections_status
  ON roadmap_sections (status);

-- Enums via CHECKs
ALTER TABLE roadmap_sections
  ADD CONSTRAINT check_roadmap_sections_name
  CHECK (section_name IN (
    'executive_summary',
    'diagnostic_analysis',
    'ghl_architecture',
    'pilot_scope',
    'implementation_sprint',
    'ghl_config',
    'workflow_sops',
    'metrics_dashboard',
    'appendix',
    'outcomes_learning'
  ));

ALTER TABLE roadmap_sections
  ADD CONSTRAINT check_roadmap_sections_status
  CHECK (status IN ('planned', 'in_progress', 'implemented', 'deprecated'));

COMMENT ON TABLE roadmap_sections IS 'Individual sections of a strategic roadmap with implementation status and AI cheatsheets';
COMMENT ON COLUMN roadmap_sections.section_number IS 'Section order (1–10)';
COMMENT ON COLUMN roadmap_sections.section_name IS 'Section type identifier';
COMMENT ON COLUMN roadmap_sections.status IS 'Implementation status: planned | in_progress | implemented | deprecated';
COMMENT ON COLUMN roadmap_sections.agent_cheatsheet IS 'Quick reference for AI agents (role, facts, decisions, actions, connections)';
COMMENT ON COLUMN roadmap_sections.diagrams IS 'Array of Mermaid diagram definitions';
