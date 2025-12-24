# Complete All Pending Migrations

This document provides instructions to complete all pending database migrations and code refactoring.

## ✅ Status Overview

Based on analysis, the following migrations need to be completed:

1. **add-tenant-to-invites** - Add tenant_id to invites table
2. **026_agent_config_refactor** - Agent configs schema update
3. **027_add_agent_strategy_contexts** - New table for strategy contexts
4. **028_add_tenant_vector_stores** - Per-tenant vector stores
5. **029_add_inventory_tracking** - SOP inventory tracking
6. **Code Refactoring** - Update code to use new schema (Migration 026)

---

## 🚀 Quick Start (Recommended)

### Option A: Run All Migrations at Once

```bash
# From WSL or Linux terminal
cd ~/code/Strategic_AI_Roadmaps/backend
node scripts/run-all-migrations.js
```

### Option B: Run Migrations One by One

```bash
cd ~/code/Strategic_AI_Roadmaps/backend

# 1. Invites migration
node scripts/apply-invites-migration.ts

# 2. Agent config refactor (026)
psql $DATABASE_URL -f src/db/migrations/026_agent_config_refactor.sql

# 3. Agent strategy contexts (027)
psql $DATABASE_URL -f src/db/migrations/027_add_agent_strategy_contexts.sql

# 4. Tenant vector stores (028)
psql $DATABASE_URL -f src/db/migrations/028_add_tenant_vector_stores.sql

# 5. Inventory tracking (029)
psql $DATABASE_URL -f src/db/migrations/029_add_inventory_tracking.sql
```

---

## 📋 Detailed Migration Steps

### Migration 1: Add tenant_id to invites

**File**: `backend/migrations/add-tenant-to-invites.sql`

```bash
cd ~/code/Strategic_AI_Roadmaps/backend
pnpm tsx scripts/apply-invites-migration.ts
```

**Expected Output**:
```
✅ Added tenant_id column
✅ Added foreign key constraint
ℹ️  Found X invites without tenant_id
```

---

### Migration 2: Agent Config Refactor (026)

**File**: `backend/src/db/migrations/026_agent_config_refactor.sql`

**What it does**:
- Adds `agent_type`, `config_version`, `instructions_hash` columns
- Removes `role_type` column
- Updates constraints

**Run**:
```bash
psql $DATABASE_URL -f src/db/migrations/026_agent_config_refactor.sql
```

**⚠️  Important**: This migration requires code updates (see Section below)

---

### Migration 3: Agent Strategy Contexts (027)

**File**: `backend/src/db/migrations/027_add_agent_strategy_contexts.sql`

**Run**:
```bash
psql $DATABASE_URL -f src/db/migrations/027_add_agent_strategy_contexts.sql
```

---

### Migration 4: Tenant Vector Stores (028)

**File**: `backend/src/db/migrations/028_add_tenant_vector_stores.sql`

**Run**:
```bash
psql $DATABASE_URL -f src/db/migrations/028_add_tenant_vector_stores.sql
```

---

### Migration 5: Inventory Tracking (029)

**File**: `backend/src/db/migrations/029_add_inventory_tracking.sql`

**Run**:
```bash
psql $DATABASE_URL -f src/db/migrations/029_add_inventory_tracking.sql
```

---

## 🔧 Code Refactoring for Migration 026

After applying migration 026, the following code files need to be updated to use `agentType` instead of `roleType`:

### Files Requiring Updates:

1. **`src/services/agentConfig.service.ts`** (HIGH PRIORITY)
   - Update `getConfigForTenantAndRole()` → `getConfigForTenant()`
   - Remove role parameter
   - Update to query by `agentType`

2. **`src/services/agentRouter.service.ts`**
   - Update `getAgentConfigForRole()` to use `agentType`

3. **`src/services/assistantQuery.service.ts`**
   - Update all `roleType` references to `agentType`

4. **`src/services/agent.service.ts`**
   - Update `roleType` references

5. **Controllers** (Medium Priority):
   - `src/controllers/assistantAgent.controller.ts`
   - `src/controllers/agentThread.controller.ts`
   - `src/controllers/superadmin.controller.ts`
   - `src/controllers/superadminAssistant.controller.ts`

6. **Routes**:
   - `src/routes/assistantAgent.routes.ts`
   - `src/routes/superadminAssistant.routes.ts`

**See**: `backend/ROLETYPE_MIGRATION_TODO.md` for complete checklist

---

## ✅ Verification

After running all migrations, verify with:

```bash
# Run verification script
cd ~/code/Strategic_AI_Roadmaps/backend
pnpm tsx scripts/verify-all-migrations.ts
```

**Expected output**:
```
✅ invites.tenant_id
✅ agent_configs.agent_type
✅ agent_configs.config_version
✅ agent_configs.instructions_hash
✅ agent_strategy_contexts table
✅ tenant_vector_stores table
✅ sop_tickets.inventory_id
✅ sop_tickets.is_sidecar
```

---

## 🐛 Troubleshooting

### Error: "UNC paths are not supported"
**Solution**: Run commands from WSL or Git Bash, not Windows CMD/PowerShell

```bash
# Open WSL
wsl

# Navigate to project
cd ~/code/Strategic_AI_Roadmaps/backend

# Run migrations
node scripts/run-all-migrations.js
```

### Error: "Module not found"
**Solution**: Ensure you're in the backend directory

```bash
cd ~/code/Strategic_AI_Roadmaps/backend
npm install  # or pnpm install
node scripts/run-all-migrations.js
```

### Error: "relation already exists"
**Solution**: This is expected if migration was partially applied. The script handles this gracefully.

---

## 📝 Summary

**To complete all migrations:**

```bash
# From WSL terminal
cd ~/code/Strategic_AI_Roadmaps/backend
node scripts/run-all-migrations.js
```

**After migrations, complete code refactoring:**
- See `ROLETYPE_MIGRATION_TODO.md` for file-by-file checklist
- Update 15+ files to use `agentType` instead of `roleType`

**Status**: 
- SQL Migrations: ✅ Ready to run
- Code Refactoring: ⏳ Pending

---

**Last Updated**: 2025-12-21
