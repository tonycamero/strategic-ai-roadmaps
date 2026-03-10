-- 051_stabilize_sas_proposals_constraint.sql
-- STAGE5-STABILIZATION-PATCH
-- Drop old dedupe constraint (if exists) and add run-scoped unique constraint.

ALTER TABLE sas_proposals
DROP CONSTRAINT IF EXISTS sas_proposals_tenant_concept_unique;

-- Drop index if it was created as an index instead of a constraint
DROP INDEX IF EXISTS idx_sas_proposals_concept_hash;

CREATE UNIQUE INDEX IF NOT EXISTS sas_proposals_run_concept_unique
ON sas_proposals(tenant_id, sas_run_id, concept_hash);
