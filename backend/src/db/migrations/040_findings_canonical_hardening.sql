-- EXEC-TICKET-CANONICAL-FINDINGS-HARDENING-001
-- Adds artifact_hash, is_immutable, and partial unique index for findings_canonical.
-- Pre-migration audit must confirm zero duplicate findings_canonical rows per tenant.

-- 1. Add artifact_hash column (nullable — existing rows unaffected)
ALTER TABLE tenant_documents
  ADD COLUMN IF NOT EXISTS artifact_hash VARCHAR(64);

-- 2. Add is_immutable flag (default false — no breaking change to existing rows)
ALTER TABLE tenant_documents
  ADD COLUMN IF NOT EXISTS is_immutable BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Enforce uniqueness: only one canonical findings row allowed per tenant
--    Partial index — affects ONLY rows where category = 'findings_canonical'
CREATE UNIQUE INDEX IF NOT EXISTS tenant_documents_canonical_findings_unique
  ON tenant_documents (tenant_id)
  WHERE category = 'findings_canonical';
