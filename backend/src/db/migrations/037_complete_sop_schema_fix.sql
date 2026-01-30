-- Comprehensive Fix for Stage 6 Legacy Support (sop_tickets)
-- Adds all potential missing columns that the backend service attempts to select.

DO $$
BEGIN
    -- 1. Core Classification (The one that caused the crash)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sop_tickets' AND column_name='category') THEN
        ALTER TABLE sop_tickets ADD COLUMN category VARCHAR(100);
    END IF;
    
    -- 2. Additional Classifiers
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sop_tickets' AND column_name='tier') THEN
        ALTER TABLE sop_tickets ADD COLUMN tier VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sop_tickets' AND column_name='value_category') THEN
        ALTER TABLE sop_tickets ADD COLUMN value_category VARCHAR(100);
    END IF;

    -- 3. Planning & ROI
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sop_tickets' AND column_name='sprint') THEN
        ALTER TABLE sop_tickets ADD COLUMN sprint INTEGER DEFAULT 30;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sop_tickets' AND column_name='time_estimate_hours') THEN
        ALTER TABLE sop_tickets ADD COLUMN time_estimate_hours INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sop_tickets' AND column_name='cost_estimate') THEN
        ALTER TABLE sop_tickets ADD COLUMN cost_estimate INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sop_tickets' AND column_name='projected_hours_saved_weekly') THEN
        ALTER TABLE sop_tickets ADD COLUMN projected_hours_saved_weekly INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sop_tickets' AND column_name='projected_leads_recovered_monthly') THEN
        ALTER TABLE sop_tickets ADD COLUMN projected_leads_recovered_monthly INTEGER DEFAULT 0;
    END IF;

    -- 4. Implementation Details
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sop_tickets' AND column_name='ghl_implementation') THEN
        ALTER TABLE sop_tickets ADD COLUMN ghl_implementation TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sop_tickets' AND column_name='implementation_steps') THEN
        ALTER TABLE sop_tickets ADD COLUMN implementation_steps JSON;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sop_tickets' AND column_name='success_metric') THEN
        ALTER TABLE sop_tickets ADD COLUMN success_metric TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sop_tickets' AND column_name='roi_notes') THEN
        ALTER TABLE sop_tickets ADD COLUMN roi_notes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sop_tickets' AND column_name='pain_source') THEN
        ALTER TABLE sop_tickets ADD COLUMN pain_source TEXT;
    END IF;
END $$;
