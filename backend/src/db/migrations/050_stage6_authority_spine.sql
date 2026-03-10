-- 050_stage6_authority_spine.sql
-- META-TICKET: STAGE6-AUTHORITY-SPINE-01
-- Implement deterministic Stage-6 compilation provenance and election architecture.

DO $$
BEGIN
    -- 1. SOP Ticket Provenance & Identity (Part 1 & 10)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sop_tickets' AND column_name='selection_envelope_id') THEN
        ALTER TABLE sop_tickets ADD COLUMN selection_envelope_id UUID REFERENCES selection_envelopes(id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sop_tickets' AND column_name='source_finding_ids') THEN
        ALTER TABLE sop_tickets ADD COLUMN source_finding_ids JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sop_tickets' AND column_name='envelope_version') THEN
        ALTER TABLE sop_tickets ADD COLUMN envelope_version INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sop_tickets' AND column_name='generation_event_id') THEN
        ALTER TABLE sop_tickets ADD COLUMN generation_event_id UUID;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sop_tickets' AND column_name='projection_hash') THEN
        ALTER TABLE sop_tickets ADD COLUMN projection_hash TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sop_tickets' AND column_name='ticket_key') THEN
        ALTER TABLE sop_tickets ADD COLUMN ticket_key TEXT;
        ALTER TABLE sop_tickets ADD CONSTRAINT sop_tickets_ticket_key_unique UNIQUE (ticket_key);
    END IF;


    -- 2. SAS Runs Artifact State (Part 3)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sas_runs' AND column_name='artifact_state') THEN
        ALTER TABLE sas_runs ADD COLUMN artifact_state JSONB;
    END IF;


    -- 3. Election Architecture (Part 8)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sas_elections' AND column_name='updated_at') THEN
        ALTER TABLE sas_elections ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Update UNIQUE constraint on sas_elections (proposal_id, decided_by_user_id)
    -- Drop old regular index if exists
    DROP INDEX IF EXISTS sas_elections_proposal_idx;
    -- Drop old unique index if exists (from previous failed attempts or Drizzle drift)
    DROP INDEX IF EXISTS sas_elections_proposal_id_unique;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sas_elections_proposal_user_unique') THEN
        ALTER TABLE sas_elections ADD CONSTRAINT sas_elections_proposal_user_unique UNIQUE (proposal_id, decided_by_user_id);
    END IF;


    -- 3. Election Events Table (Part 8)
    CREATE TABLE IF NOT EXISTS sas_election_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        proposal_id UUID NOT NULL REFERENCES sas_proposals(id) ON DELETE CASCADE,
        decision VARCHAR(10) NOT NULL CHECK (decision IN ('keep','trash')),
        note TEXT,
        decided_by_user_id UUID NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS sas_election_events_proposal_idx ON sas_election_events(proposal_id);
    CREATE INDEX IF NOT EXISTS sas_election_events_tenant_idx ON sas_election_events(tenant_id);

END $$;
