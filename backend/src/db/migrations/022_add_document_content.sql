-- 022_add_document_content.sql
-- Add content storage for text-based documents and storage_provider hint

ALTER TABLE tenant_documents
  ADD COLUMN IF NOT EXISTS content text,
  ADD COLUMN IF NOT EXISTS storage_provider varchar(50);

-- Optional: set default storage provider to 'db' for new rows
-- drizzle does not support altering defaults uniformly across all providers here,
-- so set via application code; backfill existing rows as needed.