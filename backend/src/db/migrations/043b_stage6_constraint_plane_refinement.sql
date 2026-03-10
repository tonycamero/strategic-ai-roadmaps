-- EXEC-TICKET-STAGE6-CONSTRAINT-PLANE-001 (Refinement)
-- Converts allowed_namespaces and allowed_adapters from JSONB to TEXT[],
-- adds created_at, and adds vertical index.
-- Safe to run: table has no data yet.

DROP TABLE IF EXISTS tenant_stage6_config;

CREATE TABLE tenant_stage6_config (
    tenant_id UUID PRIMARY KEY
        REFERENCES tenants(id)
        ON DELETE CASCADE,

    vertical VARCHAR(40) NOT NULL,

    allowed_namespaces TEXT[] NOT NULL,
    allowed_adapters TEXT[] NOT NULL,

    max_complexity_tier VARCHAR(10) NOT NULL
        CHECK (max_complexity_tier IN ('low','medium','high')),

    custom_dev_allowed BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tenant_stage6_config_vertical_idx
    ON tenant_stage6_config (vertical);
