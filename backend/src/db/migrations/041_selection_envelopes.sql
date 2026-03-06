-- EXEC-TICKET-SELECTION-ENVELOPE-SCHEMA-001
-- Creates selection_envelopes table — deterministic compiler artifact storage.
-- Arrays (inventory_ids, adapter_ids, finding_ids) must be sorted before insert.
-- selection_hash = SHA-256(normalized envelope payload, timestamps excluded).

CREATE TABLE IF NOT EXISTS selection_envelopes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Binding anchors
    canonical_findings_hash VARCHAR(64) NOT NULL,
    registry_version VARCHAR(50) NOT NULL,
    envelope_version VARCHAR(50) NOT NULL,

    -- Constraint snapshot: persisted for forensic auditability and engine replay
    execution_envelope JSONB NOT NULL,

    -- Selection results (arrays must be sorted before insert)
    inventory_ids JSONB NOT NULL,
    adapter_ids JSONB NOT NULL,
    finding_ids JSONB NOT NULL,  -- full canonical finding input set, not filtered subset

    -- Determinism anchor
    selection_hash VARCHAR(64) NOT NULL,

    -- Audit only — excluded from hash input
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Uniqueness: one selection per (tenant, findings, registry version, engine version)
-- envelopeVersion included: engine rule changes must not collide with prior envelopes
CREATE UNIQUE INDEX IF NOT EXISTS selection_envelopes_unique_binding
  ON selection_envelopes (tenant_id, canonical_findings_hash, registry_version, envelope_version);

-- Fast lookup for moderation binding validation
CREATE INDEX IF NOT EXISTS selection_envelopes_selection_hash_idx
  ON selection_envelopes (selection_hash);
