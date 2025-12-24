# Agent Configs Testing Guide

**Status:** ✅ Minimal cut implemented - agent.service.ts now uses agent_configs

---

## What Changed

**Single file modified:** `backend/src/services/agent.service.ts`

**Changes:**
1. Added `agentConfigs` and `AgentConfig` imports
2. Extracted hardcoded prompt into `buildFallbackSystemPrompt()`
3. Added `composePromptFromConfig()` for multi-field composition
4. Added `getSystemPromptForContext()` loader with graceful fallback
5. Changed `queryAgent()` to use: `const systemPrompt = await getSystemPromptForContext(context);`

**Behavior:**
- If `HAYES_TENANT_ID` env var NOT set → uses fallback (hardcoded prompt)
- If `HAYES_TENANT_ID` set → loads Hayes Owner Agent config from DB
- If DB lookup fails → graceful fallback to hardcoded prompt
- Zero breaking changes - agent continues working exactly as before

---

## Testing Steps

### **Test 1: Verify Fallback (No Env Var)**

```bash
# Don't set HAYES_TENANT_ID
cd backend
pnpm dev
```

**Expected:**
- Agent starts normally
- No `[Agent] Loaded agent_config from DB` logs
- Agent responds using fallback prompt
- Behavior identical to before

**Test query:**
```bash
curl -X POST http://localhost:3001/api/agent/query \
  -H "Authorization: Bearer <SUPERADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"message": "How many firms do I have?"}'
```

---

### **Test 2: Deploy DB Changes**

```bash
# Get your database URL
echo $DATABASE_URL

# Run migration
psql $DATABASE_URL -f backend/src/db/migrations/005_add_agent_configs.sql

# Expected output: "CREATE TABLE", "CREATE INDEX" messages
```

**Verify table exists:**
```sql
psql $DATABASE_URL -c "\d agent_configs"
```

**Expected:** Table definition with columns: id, tenant_id, role_type, system_identity, business_context, custom_instructions, role_playbook, tool_context, is_active, version, etc.

---

### **Test 3: Seed Hayes Owner Agent Config**

```bash
# Run seed
psql $DATABASE_URL -f backend/src/db/seeds/seed_hayes_owner_agent.sql

# Expected output: "NOTICE: Hayes Owner Agent config seeded successfully"
```

**Verify seed worked:**
```sql
psql $DATABASE_URL -c "SELECT id, tenant_id, role_type, version FROM agent_configs;"
```

**Expected:** One row with `role_type = 'owner'`

**Get Hayes tenant ID:**
```sql
psql $DATABASE_URL -c "SELECT id, name FROM tenants WHERE name ILIKE '%Hayes%';"
```

Copy the UUID for next step.

---

### **Test 4: Enable Agent Configs (Set Env Var)**

Add to `backend/.env`:
```bash
HAYES_TENANT_ID=<uuid-from-previous-step>
```

Or export temporarily:
```bash
export HAYES_TENANT_ID=<uuid>
cd backend
pnpm dev
```

**Expected startup logs:**
```
🚀 Server running on http://localhost:3001
```

---

### **Test 5: Verify Agent Uses Config**

**Test query:**
```bash
curl -X POST http://localhost:3001/api/agent/query \
  -H "Authorization: Bearer <SUPERADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"message": "hello"}'
```

**Check backend logs for:**
```
[Agent] Loaded agent_config from DB: { tenantId: '<uuid>', roleType: 'owner', version: 1 }
```

**Expected behavior:**
- Agent responds normally
- Prompt now composed from DB config fields:
  - `systemIdentity` (Owner Agent template)
  - `businessContext` (placeholder for now)
  - `customInstructions` (null - not set yet)
  - `rolePlaybook` (Owner Agent playbook)

---

### **Test 6: Test Graceful Fallback**

**Simulate DB error:**
```bash
# Set invalid tenant ID
export HAYES_TENANT_ID=00000000-0000-0000-0000-000000000000
cd backend
pnpm dev
```

**Check logs:**
```
[Agent] No agent_config found for Hayes tenant. Using fallback system prompt.
```

**Test query still works:**
```bash
curl -X POST http://localhost:3001/api/agent/query \
  -H "Authorization: Bearer <SUPERADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"message": "hello"}'
```

**Expected:** Agent responds using fallback prompt (not DB config)

---

## Next Steps

Once this is stable, you can:

### **1. Make it context-aware (not just env var)**

```typescript
// In getSystemPromptForContext()
const tenantId = context.firm_id ?? hayesTenantId;
```

This allows passing `firm_id` from the frontend when ready.

### **2. Filter tools by toolContext**

Use `config.toolContext.tools` to build the `tools` array dynamically:

```typescript
const allowedTools = config.toolContext.tools
  .filter(t => t.enabled)
  .map(t => t.key);

const tools = allTools.filter(tool => 
  allowedTools.includes(tool.function.name)
);
```

### **3. Add business context generator**

```typescript
async function regenerateBusinessContext(tenantId: string) {
  const tenant = await getTenant(tenantId);
  const intakes = await getIntakes(tenantId);
  
  const context = `
Firm: ${tenant.name}
Team: ${intakes.length} members
CRM: ${intakes[0]?.answers?.crm || 'Unknown'}
Top pain points: ${extractPainPoints(intakes)}
  `.trim();
  
  await db.update(agentConfigs)
    .set({ businessContext: context })
    .where(eq(agentConfigs.tenantId, tenantId));
}
```

---

## Troubleshooting

### "Property 'agentConfigs' does not exist on type..."

**Fix:** Make sure Drizzle schema is properly exported:
```typescript
// backend/src/db/schema.ts
export const agentConfigs = pgTable('agent_configs', { ... });
```

### "Cannot find module '../types/agent.types'"

**Fix:** Verify file exists at `backend/src/types/agent.types.ts`

### Agent still using old prompt

**Checklist:**
- [ ] `HAYES_TENANT_ID` env var is set
- [ ] Migration ran successfully
- [ ] Seed ran successfully
- [ ] Backend restarted after setting env var
- [ ] Check logs for `[Agent] Loaded agent_config from DB`

### No logs showing config load

**Possible causes:**
- Env var not set
- Tenant ID doesn't match DB
- Agent config row doesn't exist

**Debug query:**
```sql
SELECT * FROM agent_configs 
WHERE tenant_id = '<HAYES_TENANT_ID>' 
AND role_type = 'owner';
```

---

## Success Criteria

✅ Agent starts with or without `HAYES_TENANT_ID`  
✅ With env var set: agent loads config from DB  
✅ Without env var: agent uses fallback prompt  
✅ DB errors don't crash the agent  
✅ Agent responses are functionally identical  
✅ Logs clearly show which prompt source is used  

---

**Status:** Ready for testing  
**Risk:** Very low - clean fallback ensures zero breaking changes
