-- EXEC-TICKET-STAGE6-CONSTRAINT-PLANE-001
-- Explicit constraint authority surface for Stage 6 compilation.
-- No default vertical. No default namespaces. No default adapters.
-- Row must exist explicitly per tenant before compilation may proceed.

CREATE TABLE IF NOT EXISTS tenant_stage6_config (
    tenant_id UUID PRIMARY KEY
        REFERENCES tenants(id)
        ON DELETE CASCADE,

    vertical VARCHAR(50) NOT NULL,

    allowed_namespaces JSONB NOT NULL,
    allowed_adapters JSONB NOT NULL,

    max_complexity_tier VARCHAR(10) NOT NULL
        CHECK (max_complexity_tier IN ('low','medium','high')),

    custom_dev_allowed BOOLEAN NOT NULL DEFAULT FALSE,

    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tenant_stage6_config_updated_idx
    ON tenant_stage6_config (updated_at);
