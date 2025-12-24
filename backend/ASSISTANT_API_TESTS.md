# Assistant API Test Recipes

Complete test suite for the new Assistants API endpoints. These tests validate per-firm Assistant isolation, thread management, and superadmin tap-in.

## Prerequisites

1. **Provision assistants first**:
   ```bash
   npm run provision:assistants
   ```

2. **Get auth tokens**:
   ```bash
   # Owner token (Roberta Hayes)
   OWNER_JWT="your-owner-jwt-here"
   
   # SuperAdmin token (Tony)
   SA_JWT="your-superadmin-jwt-here"
   
   # Get Hayes tenant ID from database
   HAYES_TENANT_ID="4e2c6eb1-0767-43d6-b6a4-3fca8efd3f64"
   ```

## Test 1: Owner/Team Agent Query

Owner queries their firm's Assistant. Should see firm-scoped context and thread reuse.

```bash
curl -X POST http://localhost:3001/api/assistant/query \
  -H "Authorization: Bearer $OWNER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Who am I and what firm do you serve?",
    "roleType": "owner"
  }'
```

**Expected response**:
```json
{
  "reply": "You are Roberta Hayes, and I serve Hayes Real Estate Group...",
  "runId": "run_abc123",
  "threadId": "thread_xyz789"
}
```

**What to verify**:
- ✅ Reply references correct owner name and firm
- ✅ No mention of other tenants
- ✅ `threadId` returned for thread reuse
- ✅ Subsequent calls reuse same thread

---

## Test 2: Thread Reuse (Owner)

Send another message to verify thread continuity.

```bash
curl -X POST http://localhost:3001/api/assistant/query \
  -H "Authorization: Bearer $OWNER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What did I just ask you?",
    "roleType": "owner"
  }'
```

**Expected**:
- ✅ Assistant remembers previous question
- ✅ Same `threadId` returned

---

## Test 3: SuperAdmin Tap-In (Private Thread)

SuperAdmin taps into Hayes Owner Agent with private thread.

```bash
curl -X POST http://localhost:3001/api/superadmin/assistant/query \
  -H "Authorization: Bearer $SA_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "'$HAYES_TENANT_ID'",
    "roleType": "owner",
    "visibility": "superadmin_only",
    "message": "Give me a brutally honest snapshot of this firm."
  }'
```

**Expected response**:
```json
{
  "reply": "...",
  "runId": "run_def456",
  "threadId": "thread_admin_123",
  "tenantName": "Hayes Real Estate Group"
}
```

**What to verify**:
- ✅ Different `threadId` than owner's thread
- ✅ Response includes ADMIN TAP-IN preamble in logs
- ✅ `tenantName` returned for context
- ✅ Owner (Roberta) cannot see this thread

---

## Test 4: Tenant Firewall (Cross-Tenant Block)

Verify assistant won't leak info about other firms.

```bash
curl -X POST http://localhost:3001/api/assistant/query \
  -H "Authorization: Bearer $OWNER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tell me about other real estate firms you work with.",
    "roleType": "owner"
  }'
```

**Expected**:
- ✅ Reply states "I am restricted to Hayes Real Estate Group only"
- ✅ No information about other tenants leaked

---

## Test 5: SuperAdmin Shared Thread

SuperAdmin creates a shared thread visible to both admin and owner.

```bash
curl -X POST http://localhost:3001/api/superadmin/assistant/query \
  -H "Authorization: Bearer $SA_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "'$HAYES_TENANT_ID'",
    "roleType": "owner",
    "visibility": "shared",
    "message": "This is a shared note for the owner to see later."
  }'
```

**Expected**:
- ✅ Creates new thread with `visibility=shared`
- ✅ (Future UI) Owner can see this thread in their history

---

## Test 6: Error Handling - Missing Assistant

Try querying a tenant that hasn't provisioned an assistant yet.

```bash
curl -X POST http://localhost:3001/api/superadmin/assistant/query \
  -H "Authorization: Bearer $SA_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "some-unprovisioned-tenant-id",
    "roleType": "owner",
    "message": "Hello"
  }'
```

**Expected**:
```json
{
  "error": "Failed to query agent as SuperAdmin",
  "details": "Assistant not provisioned for firm..."
}
```

---

## Test 7: Unauthorized Access

Non-superadmin tries to use tap-in endpoint.

```bash
curl -X POST http://localhost:3001/api/superadmin/assistant/query \
  -H "Authorization: Bearer $OWNER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "'$HAYES_TENANT_ID'",
    "message": "Test"
  }'
```

**Expected**:
```json
{
  "error": "SuperAdmin access required"
}
```

---

## Monitoring & Debugging

### Check backend logs
```bash
# Watch for provisioning and query logs
tail -f backend/logs/app.log | grep -E "\[Provisioning\]|\[Query\]|\[AssistantAgent\]|\[SuperadminAssistant\]"
```

### Verify database state
```sql
-- Check assistant IDs
SELECT id, tenant_id, role_type, openai_assistant_id, openai_vector_store_id 
FROM agent_configs;

-- Check threads
SELECT id, tenant_id, role_type, actor_role, visibility, last_activity_at
FROM agent_threads
ORDER BY last_activity_at DESC;
```

---

## Success Criteria

- ✅ Owner can query their firm's Assistant
- ✅ Threads are isolated per user + role
- ✅ SuperAdmin can tap into any firm with separate threads
- ✅ Tenant firewall prevents cross-firm leakage
- ✅ Thread reuse works (conversation memory)
- ✅ Error handling graceful for missing assistants
- ✅ Auth enforcement works (unauthorized blocked)

---

## Next Steps

Once these pass, you can:
1. Wire frontend components (AgentChat.tsx for owner dashboard)
2. Add document upload → vector store integration (DOCS-1)
3. Implement thread history UI for owners
4. Build SuperAdmin "tap-in" dashboard view
