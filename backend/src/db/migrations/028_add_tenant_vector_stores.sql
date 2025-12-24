-- 028_add_tenant_vector_stores.sql
-- V2 architecture: Per-tenant vector stores decoupled from assistants
-- Date: 2025-12-09

CREATE TABLE tenant_vector_stores (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  vector_store_id VARCHAR(128) NOT NULL,
  last_refreshed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for quick lookup by vector store ID
CREATE INDEX idx_tenant_vector_stores_vector_store_id ON tenant_vector_stores(vector_store_id);

-- Rollback (if needed):
-- DROP TABLE IF EXISTS tenant_vector_stores;
