# Post-Migration Next Steps

**Status:** Migration 023 complete ✅  
**Date:** 2025-12-08  
**Commits:** `0ec8e59` (refactor), `581033e` (docs), `cb6913b` (schema model)

---

## What's Done ✅

1. **Database migration applied successfully**
   - All `owner_id` → `tenantId` / `ownerUserId` / `createdByUserId` transitions complete
   - 8 performance indexes created
   - SuperAdmin has platform tenant
   - All data backfilled and verified

2. **Code refactored**
   - 15 controller files updated
   - Core services updated (roadmaps, intakes, documents, discovery)
   - Schema aligned with database
   - TypeScript errors: 100+ → 75 (isolated to agent subsystem)

3. **Documentation locked in**
   - `SCHEMA_TENANT_MODEL.md` — canonical schema reference
   - Migration helper scripts preserved
   - Security protocol written (ready to implement)

---

## Quick Wins (Low Effort, High Leverage)

### 1. Residual `ownerId` Cleanup (30 min)
**Why:** Prevent regression and confusion

```bash
# Find any remaining references
grep -r "ownerId" backend/src --exclude-dir=migrations

# Only allowed:
# - tenants.ownerUserId (correct)
# - Historical migration files
# - Comments explaining the refactor
```

**Warp Ticket:**
```
Search codebase for "ownerId" and:
- Rename to tenantId, ownerUserId, or createdByUserId as appropriate
- Remove any legacy ownerId references in runtime code
- Confirm no controller, service, or util uses the old naming
- Keep migration files and comments untouched
```

---

### 2. Tenant Isolation Tests (1-2 hours)
**Why:** Turn the migration into a guardrail

Add tests to ensure cross-tenant data access is impossible:

```typescript
describe('Tenant Isolation', () => {
  it('prevents Tenant A from accessing Tenant B intakes', async () => {
    // Seed two tenants with data
    // Attempt cross-tenant access
    // Assert 403 or empty result
  });

  it('allows superadmin impersonation with audit trail', async () => {
    // Verify superadmin can access any tenant
    // Verify action is logged
  });
});
```

**Warp Ticket:**
```
Add tenant isolation regression tests for:
- intakes (cross-tenant access blocked)
- roadmaps (cross-tenant access blocked)
- tenant_documents (cross-tenant access blocked)
- owner dashboard (only tenant owner can access)
- superadmin impersonation (logged and allowed)

Use existing test framework. Seed two test tenants.
```

---

### 3. Agent Subsystem Alignment (2-3 days, when needed)
**Why:** Complete the refactor, eliminate remaining TypeScript errors

The agent subsystem (75 TypeScript errors) needs the same tenant scoping treatment:

- `agent_threads` table
- `agent_configs` table  
- `agent_messages` table
- Agent controllers

**Status:** Non-blocking for core platform. Defer until AI features are actively used.

**Reference:** See `AGENT_CLEANUP_TICKETS.md` (from earlier conversation)

---

## Security Protocol Implementation (Phased)

From your **Data Security Protocol v1.0**, here's the natural sequence:

### Phase 1: Immediate (Already Done)
✅ Tenant model hardening (Section 3 & 4)  
✅ SuperAdmin tenant separation (Section 8)  
✅ Schema alignment

### Phase 2: Next Sprint (High ROI)
- **Logging sanitization** (Section 6)
  - Ensure no intake answers, discovery notes, or roadmap content in logs
  - Add masking for structured logs
  
- **File storage hardening** (Section 5)
  - Move to private S3 or DB-backed storage
  - Generate signed URLs (< 15 min expiry)
  - Remove public file paths

**Warp Tickets:**
```
Ticket: Implement logging sanitization
- Review all logger.info/error calls in controllers
- Strip sensitive fields: intakeData, discoveryNotes, roadmapContent
- Add safe error boundaries (log error codes, not bodies)
- Confirm no JWTs or API keys in logs

Ticket: Secure file storage layer
- Audit current document storage approach
- Move tenant_documents to private bucket or DB storage
- Add signed URL generator (15min TTL)
- Update document.controller.ts to use signed URLs
- Remove any public file serving routes
```

### Phase 3: Quarterly Ritual (Ongoing)
- Secret rotation
- Backup restoration tests
- Vector store cleanup
- SQL audit for unscoped queries

---

## What NOT To Do

❌ **Don't** edit already-applied migration 023  
❌ **Don't** reintroduce `ownerId` in new code  
❌ **Don't** skip tenant scoping in new controllers  
❌ **Don't** commit without running TypeScript check first

---

## When You're Ready for More

### Validation Checklist Execution
Run through the complete validation checklist (from earlier conversation):
- Auth flows (login, JWT, MFA)
- Owner dashboard
- Intakes (create, view, edit)
- Roadmaps (generate, view tenant-scoped)
- Documents (upload, download, scoping)
- Invites (send, accept, tenant boundaries)
- Onboarding flows
- SuperAdmin impersonation

### Agent Layer Hardening
Once AI agent features are in active use:
- Apply tenant scoping to agent_threads, agent_configs, agent_messages
- Add vector store isolation per tenant
- Implement AI data scrubbing (allowlist fields sent to OpenAI)
- Add agent action audit trail

---

## Momentum Killers to Avoid

1. **Chasing TypeScript perfection** — 75 errors in agent subsystem are isolated and non-blocking
2. **Over-documenting** — You have schema model + security protocol. That's enough.
3. **Premature optimization** — Indexes are in. Wait for real load before more perf work.

---

## Your Position Now

✅ **Database and code aligned** on tenant-centric model  
✅ **Security foundation** ready to layer in  
✅ **Clear separation** between core (stable) and agent subsystem (cleanup deferred)  
✅ **Documented schema** prevents future drift  

**You're in a great spot.** The hard migration work is done. Everything from here is additive, not corrective.

---

## Copy/Paste Next Actions

**If you want to lock in the quick wins now:**

```bash
# 1. Residual cleanup
grep -r "ownerId" backend/src --exclude-dir=migrations | grep -v "ownerUserId" | grep -v "createdByUserId"

# 2. Start logging sanitization
# (Hand this to Warp as a ticket)

# 3. Add tenant isolation tests
# (Hand this to Warp as a ticket)
```

**If you want to implement security protocol next:**
- Start with Phase 2 (logging + file storage)
- See tickets in this doc above

**If you want to validate the platform now:**
- Run through validation checklist manually
- Test each tenant-scoped flow
- Verify superadmin impersonation

---

## Questions to Ask Yourself

1. **Am I ready to start validating?** (auth, dashboard, intakes, roadmaps)
2. **Do I want to harden logging/files now?** (security protocol Phase 2)
3. **Can the agent subsystem wait?** (yes, if AI features aren't actively used)

Pick one path, execute, then return here for the next layer.

---

**End of Next Steps**
