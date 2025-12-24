-- Migration: Add tenant_documents table for storing SOP outputs and other tenant-specific files
-- Created: 2025-11-21

CREATE TABLE IF NOT EXISTS tenant_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- File metadata
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL, -- Storage path (relative or URL)
  file_size INTEGER NOT NULL, -- Bytes
  mime_type VARCHAR(100),
  
  -- Document classification
  category VARCHAR(50) NOT NULL, -- 'sop_output', 'roadmap', 'report', 'other'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- SOP-specific metadata
  sop_number VARCHAR(20), -- e.g., 'SOP-01', 'SOP-02'
  output_number VARCHAR(20), -- e.g., 'Output-1', 'Output-2'
  
  -- Access control
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT FALSE, -- If true, all team members can see
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_tenant_documents_tenant_id ON tenant_documents(tenant_id);
CREATE INDEX idx_tenant_documents_owner_id ON tenant_documents(owner_id);
CREATE INDEX idx_tenant_documents_category ON tenant_documents(category);
CREATE INDEX idx_tenant_documents_sop_number ON tenant_documents(sop_number);

-- Comments
COMMENT ON TABLE tenant_documents IS 'Stores tenant-specific documents like SOP outputs, roadmaps, and reports';
COMMENT ON COLUMN tenant_documents.category IS 'Document category: sop_output, roadmap, report, other';
COMMENT ON COLUMN tenant_documents.is_public IS 'If true, all team members of tenant can access; if false, owner-only';
