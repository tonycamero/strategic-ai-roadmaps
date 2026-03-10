-- S6-13: Add concept_hash column for proposal deduplication
ALTER TABLE sas_proposals
ADD COLUMN IF NOT EXISTS concept_hash TEXT;

-- Index for fast dedup lookups
CREATE INDEX IF NOT EXISTS idx_sas_proposals_concept_hash
ON sas_proposals(tenant_id, concept_hash);
