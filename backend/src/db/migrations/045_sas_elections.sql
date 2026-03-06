-- EXEC-TICKET-SAS-ELECTIONS-AUDIT-001
-- Append-only decision log for SAS proposal elections.
-- No updates. No deletes. Current state = latest election by created_at.

CREATE TABLE IF NOT EXISTS sas_elections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    proposal_id UUID NOT NULL REFERENCES sas_proposals(id) ON DELETE CASCADE,

    decision VARCHAR(10) NOT NULL CHECK (decision IN ('keep','trash')),
    note TEXT,

    decided_by_user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sas_elections_proposal_idx ON sas_elections(proposal_id);
CREATE INDEX IF NOT EXISTS sas_elections_tenant_idx ON sas_elections(tenant_id);
