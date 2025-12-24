-- Migration 008: Add roadmap metadata and document tagging
-- Adds roadmap_metadata to agent_configs and section/tags to tenant_documents

-- Add roadmap_metadata JSONB field to agent_configs
ALTER TABLE agent_configs 
ADD COLUMN roadmap_metadata JSONB DEFAULT '{}'::jsonb;

-- Add section and tags fields to tenant_documents
ALTER TABLE tenant_documents 
ADD COLUMN section VARCHAR(50),
ADD COLUMN tags JSONB DEFAULT '[]'::jsonb;

-- Create index on section for faster queries
CREATE INDEX idx_tenant_documents_section ON tenant_documents(section);

-- Create GIN index on tags for array queries
CREATE INDEX idx_tenant_documents_tags ON tenant_documents USING GIN (tags);

-- Add comment
COMMENT ON COLUMN agent_configs.roadmap_metadata IS 'Extracted roadmap metadata: pain points, goals, systems, timeline';
COMMENT ON COLUMN tenant_documents.section IS 'Roadmap section name: executive, diagnostic, architecture, systems, implementation, sop_pack, metrics, appendix';
COMMENT ON COLUMN tenant_documents.tags IS 'Document tags for filtering and categorization';
