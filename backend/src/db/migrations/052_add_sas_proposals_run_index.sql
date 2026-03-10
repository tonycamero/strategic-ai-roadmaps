-- Create index on sas_proposals for (tenant_id, sas_run_id) to optimize Stage 5 modal loading
CREATE INDEX IF NOT EXISTS idx_sas_proposals_run 
ON sas_proposals (tenant_id, sas_run_id);
