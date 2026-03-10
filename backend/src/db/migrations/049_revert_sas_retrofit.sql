-- 049_revert_sas_retrofit.sql
-- META-TICKET: SAS-CAPABILITY-ROLLBACK-01
-- Rollback the incorrect schema retrofit that added capability columns to sas_proposals.
-- Capability mapping now lives inside the source_anchors JSONB column.

ALTER TABLE sas_proposals
DROP COLUMN IF EXISTS capability_id;

ALTER TABLE sas_proposals
DROP COLUMN IF EXISTS capability_namespace;
