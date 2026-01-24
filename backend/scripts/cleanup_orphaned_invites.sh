#!/bin/bash
# COMPREHENSIVE cleanup for ALL orphaned records in the entire database
# Handles all foreign key relationships, not just tenant_id

echo "[Cleanup] Connecting to database and removing ALL orphaned records..."

# Use the DATABASE_URL from .env
source .env

psql "$DATABASE_URL" << 'EOF'
-- Step 1: Clean up orphaned records from tables that reference tenants
DO $$
DECLARE
    r RECORD;
    deleted_count INTEGER;
BEGIN
    FOR r IN 
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE column_name = 'tenant_id'
        AND table_schema = 'public'
        AND table_name != 'tenants'
    LOOP
        EXECUTE format('DELETE FROM %I WHERE %I IS NOT NULL AND %I NOT IN (SELECT id FROM tenants)', 
                      r.table_name, r.column_name, r.column_name);
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        IF deleted_count > 0 THEN
            RAISE NOTICE 'Deleted % orphaned records from %.%', deleted_count, r.table_name, r.column_name;
        END IF;
    END LOOP;
END $$;

-- Step 2: Clean up orphaned roadmap_sections (references roadmaps)
DELETE FROM roadmap_sections WHERE roadmap_id NOT IN (SELECT id FROM roadmaps);

-- Step 3: Clean up other orphaned records
DELETE FROM ticket_instances WHERE ticket_pack_id NOT IN (SELECT id FROM ticket_packs);
DELETE FROM roadmap_outcomes WHERE roadmap_id NOT IN (SELECT id FROM roadmaps);
DELETE FROM agent_threads WHERE agent_config_id NOT IN (SELECT id FROM agent_configs);
DELETE FROM agent_messages WHERE agent_thread_id NOT IN (SELECT id FROM agent_threads);
DELETE FROM agent_logs WHERE agent_config_id IS NOT NULL AND agent_config_id NOT IN (SELECT id FROM agent_configs);

-- Show final counts
SELECT 
  (SELECT COUNT(*) FROM tenants) as tenants,
  (SELECT COUNT(*) FROM roadmaps) as roadmaps,
  (SELECT COUNT(*) FROM roadmap_sections) as roadmap_sections;
EOF

echo "[Cleanup] ✅ Cleanup complete! You can now run: npm run db:push"

