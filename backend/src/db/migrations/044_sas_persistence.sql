-- EXEC-TICKET-SAS-PERSISTENCE-PLANE-001
-- Deterministic, auditable persistence layer for Assisted Synthesis proposals.
-- Proposals are run-scoped, tenant-bound, and immutable once created.

CREATE TABLE IF NOT EXISTS sas_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    scope JSONB NOT NULL,
    source_artifact_refs JSONB NOT NULL,
    created_by_user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sas_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sas_run_id UUID NOT NULL REFERENCES sas_runs(id) ON DELETE CASCADE,

    proposal_type VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    source_anchors JSONB NOT NULL,

    agent_model VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sas_proposals_tenant_idx ON sas_proposals(tenant_id);
CREATE INDEX IF NOT EXISTS sas_proposals_run_idx ON sas_proposals(sas_run_id);
CREATE INDEX IF NOT EXISTS sas_runs_tenant_idx ON sas_runs(tenant_id);
