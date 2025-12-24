# Migration 026: Agent Config Refactor

## Overview
This migration refactors `agent_configs` to support the single-assistant-per-tenant architecture.

## Changes

### Database Schema
1. **Added columns**:
   - `agent_type` (TEXT, default 'roadmap_coach') - replaces `role_type`
   - `config_version` (INTEGER, default 1) - tracks prompt iterations
   - `instructions_hash` (TEXT) - SHA-256 hash for change detection

2. **Removed columns**:
   - `role_type` (VARCHAR) - no longer needed

3. **Constraints updated**:
   - Dropped: `UNIQUE(tenant_id, role_type)`
   - Added: `UNIQUE(tenant_id, agent_type)`
   - This ensures exactly one `roadmap_coach` per tenant

4. **Data cleanup**:
   - Removes duplicate configs per tenant (keeps most recent)
   - Backfills all existing configs with `agent_type = 'roadmap_coach'`
   - Computes initial `instructions_hash` for existing configs

## How to Run

### Option 1: Direct psql (if database is running)
```bash
psql postgresql://postgres:postgres@localhost:5432/strategic_ai_roadmaps \
  -f backend/src/db/migrations/026_agent_config_refactor.sql
```

### Option 2: Via migration runner (if you have one)
```bash
npm run migrate:up
```

## Post-Migration Verification

```sql
-- Should show new columns
\d agent_configs

-- Should show exactly one config per tenant
SELECT tenant_id, COUNT(*) 
FROM agent_configs 
GROUP BY tenant_id;

-- Should all be 'roadmap_coach'
SELECT DISTINCT agent_type FROM agent_configs;
```

## Breaking Changes

### Code Updates Required
After running this migration, you **must** update:

1. All TypeScript code referencing `config.roleType` → `config.agentType`
2. All queries filtering by `role_type` → `agent_type`
3. Update `src/db/schema.ts` (already done in this ticket)

### Non-Breaking
- `agent_threads.roleType` is **unchanged** - it still tracks which user role created the thread
- `agent_logs.interaction_mode` is **unchanged** - it's used for logging only

## Rollback

If you need to rollback (not recommended after code changes):

```sql
-- Add back role_type column
ALTER TABLE agent_configs ADD COLUMN role_type VARCHAR(32);
UPDATE agent_configs SET role_type = 'owner' WHERE agent_type = 'roadmap_coach';
ALTER TABLE agent_configs DROP COLUMN agent_type;
ALTER TABLE agent_configs DROP COLUMN config_version;
ALTER TABLE agent_configs DROP COLUMN instructions_hash;
```

## Next Steps

After running this migration:
1. ✅ Update `src/db/schema.ts` (done)
2. ⏳ Run Ticket 2: Refactor `roadmapAgentSync.service.ts`
3. ⏳ Run Ticket 3: Add capability profile system
4. ⏳ Run Ticket 4: Update instruction layering
