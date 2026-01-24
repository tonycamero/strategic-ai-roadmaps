
-- Surgical Fix for Stage 6 Fallback Query (sop_tickets drift)

DO $$
BEGIN
    -- 1. Rich Fields (aligning with recent schema updates)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sop_tickets' AND column_name='ghl_implementation') THEN
        ALTER TABLE sop_tickets ADD COLUMN ghl_implementation TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sop_tickets' AND column_name='implementation_steps') THEN
        ALTER TABLE sop_tickets ADD COLUMN implementation_steps JSON;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sop_tickets' AND column_name='sprint') THEN
        ALTER TABLE sop_tickets ADD COLUMN sprint INTEGER DEFAULT 30;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sop_tickets' AND column_name='category') THEN
        ALTER TABLE sop_tickets ADD COLUMN category VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sop_tickets' AND column_name='tier') THEN
        ALTER TABLE sop_tickets ADD COLUMN tier VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sop_tickets' AND column_name='success_metric') THEN
        ALTER TABLE sop_tickets ADD COLUMN success_metric TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sop_tickets' AND column_name='roi_notes') THEN
        ALTER TABLE sop_tickets ADD COLUMN roi_notes TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sop_tickets' AND column_name='time_estimate_hours') THEN
        ALTER TABLE sop_tickets ADD COLUMN time_estimate_hours INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sop_tickets' AND column_name='pain_source') THEN
        ALTER TABLE sop_tickets ADD COLUMN pain_source TEXT;
    END IF;

END $$;
