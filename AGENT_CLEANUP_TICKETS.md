# 🎫 Agent Subsystem Cleanup - Warp Ticket Pack

**Status**: ⏸️ PAUSED (Non-blocking for core platform)  
**Estimate**: 2-3 days  
**Priority**: LOW - Only execute when agent features are actively needed  
**Context**: After tenant scoping refactor (commit 0ec8e59)

---

## Overview

These tickets address the remaining ~75 TypeScript errors in agent/thread controllers and related services. The core platform (auth, dashboards, roadmaps, intakes, documents) is stable and does not require these fixes.

**Execute only when**:
- You're actively using AI agent features
- Agent endpoints are needed for demos
- You want to eliminate all TypeScript errors

---

## 🎫 Ticket A1 — Agent Controllers Tenant Scoping

**Goal**: Update agent + thread controllers to use `tenantId` instead of `ownerId`.

**Files**:
- `backend/src/controllers/advisorThreads.controller.ts`
- `backend/src/controllers/agent.controller.ts`
- `backend/src/controllers/agentThread.controller.ts`
- `backend/src/controllers/assistantAgent.controller.ts`

**Tasks**:

```warp-runnable-command
1. Update AuthRequest interfaces to use tenantId from middleware
2. Replace all ownerId field references with tenantId
3. Update queries to filter by:
   - tenantId (primary)
   - agentConfigId (where applicable)
4. Add tenant validation guards at controller entry points
5. Update any ownerUserId references for user relationships
```

**Acceptance Criteria**:
- [ ] All controllers compile without TypeScript errors
- [ ] All agent routes require `tenantId` on request context
- [ ] Database queries are tenant-scoped
- [ ] No `ownerId` references remain (except in tenants.ownerUserId)

**Example Pattern**:
```ts
// Before
const tenant = await db.query.tenants.findFirst({
  where: eq(tenants.ownerId, user.ownerId),
});

// After
const tenantId = (req as any).tenantId;
if (!tenantId) {
  return res.status(403).json({ error: 'Tenant not resolved' });
}
const tenant = await db.query.tenants.findFirst({
  where: eq(tenants.id, tenantId),
});
```

---

## 🎫 Ticket A2 — Agent Schema Verification

**Goal**: Ensure agent_configs, agent_threads tables are tenant-aligned.

**Tasks**:

```warp-runnable-command
1. Verify agent_configs.tenantId is always set (NOT NULL)
2. Verify agent_threads.tenantId + agentConfigId combination enforced
3. Check agent_messages relationships are correct
4. Add indexes if missing:
   - agent_configs (tenantId, roleType)
   - agent_threads (tenantId, agentConfigId)
   - agent_messages (agentThreadId, createdAt)
```

**Acceptance Criteria**:
- [ ] All agent tables have proper tenant FKs
- [ ] No queries bypass tenant filtering
- [ ] Indexes support common query patterns

---

## 🎫 Ticket A3 — Agent Service Helpers

**Goal**: Create centralized service for agent config resolution.

**File**: `backend/src/services/agentConfig.service.ts`

**Tasks**:

```warp-runnable-command
Create file: backend/src/services/agentConfig.service.ts

Functions:
- getAgentConfig(tenantId, roleType) → agentConfig | null
- getAgentThread(tenantId, agentConfigId, threadId) → thread | null
- createAgentThread(tenantId, agentConfigId, userId) → thread

Ensure all functions require tenantId as first parameter
Return null if tenant validation fails
```

**Acceptance Criteria**:
- [ ] Service enforces tenant isolation
- [ ] All agent controllers use this service
- [ ] No direct agent_configs queries in controllers

---

## 🎫 Ticket A4 — Scripts & Utilities Refactor

**Goal**: Update scripts referencing `ownerId` to use tenant model.

**Files**: `backend/src/scripts/*.ts`

**Tasks**:

```warp-runnable-command
1. Search all scripts for "ownerId" references
2. For each occurrence, determine:
   - Should use tenantId for tenant relationship
   - Should use tenants.ownerUserId for owner user relationship
3. Update script logic and typings
4. Test each script with new schema
```

**Specific Scripts to Check**:
- `provision_all_assistants.ts`
- `check_hayes_intakes.ts`
- `compareTicketsVsSection6.ts`
- `hydrate_business_context.ts`
- `metricsCapture.ts`
- `metricsOutcome.ts`
- `queryHayesData.ts`
- `runSop01.ts`
- `saveDiscoveryNotes.ts`

**Acceptance Criteria**:
- [ ] No `ownerId` references in scripts (except historical migrations)
- [ ] All scripts run without TypeScript errors
- [ ] Scripts tested against current database schema

---

## 🎫 Ticket A5 — TenantContext Type

**Goal**: Centralize tenant context into reusable type.

**File**: `backend/src/types/tenantContext.ts`

**Tasks**:

```warp-runnable-command
Create file: backend/src/types/tenantContext.ts

export interface TenantContext {
  userId: string;
  tenantId: string;
  role: UserRole;
}

Update agent services to accept TenantContext instead of separate params
Update controllers to construct TenantContext from middleware
```

**Acceptance Criteria**:
- [ ] Single source of truth for tenant context
- [ ] TypeScript enforces presence of both userId and tenantId
- [ ] Agent services use TenantContext type

---

## 🎫 Ticket A6 — Agent Access Control

**Goal**: Enforce role-based access for different agent types.

**Tasks**:

```warp-runnable-command
Implement access control rules:

1. roleType = 'owner':
   - Only tenant owners can invoke
   
2. roleType = 'ops' or 'tc':
   - Owner + staff roles permitted
   
3. roleType = 'agent_support':
   - SuperAdmin only, or guarded path

Add middleware or decorator: @RequiresAgentRole(roleType)
Return 403 with clear error for unauthorized access
```

**Acceptance Criteria**:
- [ ] Access rules implemented at controller layer
- [ ] Unauthorized roles get 403 with clear error message
- [ ] SuperAdmin can access all agent types

---

## 🎫 Ticket A7 — Agent Logging & PII Safety

**Goal**: Ensure agent logs never leak sensitive data.

**Tasks**:

```warp-runnable-command
1. Review agent_logs table usage
2. Confirm only metadata stored:
   - event type
   - duration
   - tokens used
   - outcome (success/error)
3. Strip conversation content or intake payloads
4. Add redaction helper for sensitive keys
```

**Sensitive Keys to Redact**:
- `email`, `phone`, `ssn`, `address`
- Any intake answers containing PII
- Customer names, business details

**Acceptance Criteria**:
- [ ] agent_logs.metadata contains no raw client data
- [ ] Logging helper enforces redaction
- [ ] Sample logs validated for PII safety

---

## 🎫 Ticket A8 — Final Typecheck & Test Pass

**Goal**: Restore clean `pnpm typecheck` and basic integration tests.

**Tasks**:

```warp-runnable-command
1. Run: pnpm typecheck
2. Fix remaining errors from:
   - Agent controllers
   - Scripts
   - Services referencing old fields
3. Run: pnpm lint
4. Fix linting issues
5. Run agent-related tests (if any exist)
```

**Acceptance Criteria**:
- [ ] TypeScript: zero errors
- [ ] Linting: zero warnings
- [ ] Existing agent tests pass (if any)
- [ ] Manual smoke test of agent endpoints

---

## Execution Order

**Recommended sequence**:
1. A1 (Agent Controllers) — Biggest impact
2. A2 (Schema Verification) — Foundation check
3. A3 (Service Helpers) — Centralize logic
4. A5 (TenantContext Type) — Type safety
5. A6 (Access Control) — Security
6. A7 (Logging Safety) — Compliance
7. A4 (Scripts) — Cleanup
8. A8 (Final Pass) — Validation

---

## Testing After Each Ticket

**Quick validation**:
```bash
# TypeScript check
pnpm typecheck

# Count remaining errors
pnpm typecheck 2>&1 | grep -c "error TS"

# Run specific test if available
pnpm test -- agent.controller.test.ts
```

---

## When to Execute

✅ **Execute now if**:
- AI agent features are critical for current demo
- You want to ship with zero TypeScript errors
- Agent endpoints are actively used in production

⏸️ **Defer if**:
- Core platform features are priority
- Agent features aren't being used yet
- You want to focus on business validation first

---

## Support

If issues arise:
- Reference REFACTOR_CHECKPOINT.md for context
- Check migration 023 for schema details
- Review auth middleware for tenantId resolution pattern
- Consult existing updated controllers for examples

---

**Last Updated**: 2025-12-08  
**Related**: REFACTOR_CHECKPOINT.md, VALIDATION_CHECKLIST.md
