-- Ensure ticket_moderation_sessions table exists
CREATE TABLE IF NOT EXISTS ticket_moderation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    source_doc_id UUID NOT NULL REFERENCES tenant_documents(id),
    source_doc_version VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    started_by UUID REFERENCES users(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure source_doc_id exists (drift correction)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ticket_moderation_sessions' AND column_name='source_doc_id') THEN
        ALTER TABLE ticket_moderation_sessions ADD COLUMN source_doc_id UUID REFERENCES tenant_documents(id);
    END IF;
END $$;

-- Ensure tickets_draft table exists
CREATE TABLE IF NOT EXISTS tickets_draft (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    moderation_session_id UUID NOT NULL REFERENCES ticket_moderation_sessions(id) ON DELETE CASCADE,
    finding_id VARCHAR(255) NOT NULL,
    finding_type VARCHAR(100) NOT NULL,
    ticket_type VARCHAR(100) NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    evidence_refs JSONB,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    
    -- Rich fields
    category VARCHAR(100),
    tier VARCHAR(50),
    ghl_implementation TEXT,
    implementation_steps JSON,
    success_metric TEXT,
    roi_notes TEXT,
    time_estimate_hours INTEGER DEFAULT 0,
    sprint INTEGER DEFAULT 30,
    pain_source TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Verify Sprint column exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets_draft' AND column_name='sprint') THEN
        ALTER TABLE tickets_draft ADD COLUMN sprint INTEGER DEFAULT 30;
    END IF;
END $$;
