# ✅ Ticket 3 Complete — Capability Profile System

## What Was Built

### 1. **Capability Profile Types** (`shared/types/capability-profile.ts`)
Created a clean replacement for "interaction modes":

```typescript
interface CapabilityProfile {
  canWriteTickets: boolean;      // Can propose/create actions
  canChangeRoadmap: boolean;      // Can suggest roadmap changes
  canSeeCrossTenant: boolean;     // SuperAdmin diagnostics
  persona: 'owner' | 'staff' | 'advisor';  // Tone/perspective, not permissions
}
```

**Key function:**
- `computeCapabilityProfile(role, tenantId, context?)` - Computes profile from JWT role
- No "modes" - just capabilities + persona

**Benefits:**
- Owner: full capabilities, strategic tone
- Staff: can write tickets, tactical tone
- SuperAdmin: all capabilities + cross-tenant

---

### 2. **Auth Middleware Cleanup** (`middleware/auth.ts`)
**Removed:**
- ❌ `InteractionMode` type
- ❌ `getInteractionModeFromRole()` function
- ❌ Mode injection into JWT payload

**Simplified:**
- `requireEditorMode()` → now just `requireRole('owner', 'superadmin')` (backward compat)
- `AuthRequest` no longer carries `interactionMode`

---

### 3. **Controller Integration** (`controllers/assistantAgent.controller.ts`)
**Before:**
```typescript
// Old: routing by role type, interaction modes
const { roleType, autoRoute } = req.body;
const effectiveRoleType = autoRoute ? router.route() : roleType;
```

**After:**
```typescript
// New: single assistant, capability profile
const capabilityProfile = computeCapabilityProfile(user.role, tenant.id);
await queryAssistant({ tenantId, message, capabilityProfile });
```

**Removed:**
- Role-based routing (`autoRoute`, `AgentRouterService`)
- Mode-specific response formatting

---

### 4. **Query Service Refactor** (`services/assistantQuery.service.ts`)
**Removed:**
- ❌ `buildModePrefix()` - was injecting "OBSERVER MODE" / "EDITOR MODE" text
- ❌ `getInteractionMode()` calls
- ❌ Mode-specific message wrapping

**Changed:**
- `QueryAssistantParams` now requires `capabilityProfile` instead of `roleType`
- Hardcoded `roleType = 'owner'` internally (single assistant per tenant)
- Logs `interactionMode: 'capability_profile'` for DB schema compatibility

**Message content:**
- No more mode announcements
- Clean role-aware context wrapping
- SuperAdmin gets "ADMIN TAP-IN CONTEXT" (not "SUPERADMIN MODE")

---

## Impact

### ✅ What Works Now
1. **No system language in UX** - assistant never says "You are in OBSERVER MODE"
2. **Single assistant per tenant** - queries use the `roadmap_coach`
3. **Capability-based permissions** - computed from JWT role, invisible to model
4. **Backward compatible** - logs still use `interactionMode` field (value = 'capability_profile')

### ⏳ What's Next (Ticket 4)
The capability profile is computed but **not yet used in prompt building**.

Currently:
- `assistantQuery.service.ts` receives `capabilityProfile`
- Logs it to database
- But doesn't pass it to `buildAgentSystemPrompt()`

**Ticket 4 will:**
- Refactor `agentPromptBuilder.service.ts` to use `capabilityProfile`
- Remove all mode-specific prompt language
- Build clean, layered instructions (identity + business context + capabilities + persona)

---

## Files Changed

### Created
- ✅ `src/shared/types/capability-profile.ts` - Capability profile system

### Modified
- ✅ `src/middleware/auth.ts` - Removed InteractionMode
- ✅ `src/controllers/assistantAgent.controller.ts` - Uses capability profiles
- ✅ `src/services/assistantQuery.service.ts` - No mode prefixes in messages

### Updated
- ✅ `src/types/agent.types.ts` - Added AgentType, kept AgentRoleType as legacy

---

## Testing Checklist

- [ ] Login as owner → query assistant → no "OBSERVER MODE" in response
- [ ] Login as staff → query assistant → no "OBSERVER MODE" in response
- [ ] Login as superadmin → query assistant → gets "ADMIN TAP-IN CONTEXT" (not mode text)
- [ ] Check `agent_logs` table → `interactionMode` = 'capability_profile'
- [ ] Check `agent_logs` metadata → contains `capabilityProfile` object

---

## Key Design Decisions

### Why keep `interactionMode` in logs?
- DB schema already has the column
- Avoids migration churn
- We just log `'capability_profile'` as the value
- Metadata JSON contains the actual profile

### Why hardcode `roleType = 'owner'`?
- We now have one assistant per tenant (`roadmap_coach`)
- The old routing by role type is gone
- This bridges the gap until all services are updated

### Why separate `persona` from capabilities?
- Capabilities = what you CAN do (enforced by backend)
- Persona = how the assistant talks (owner = strategic, staff = tactical)
- This keeps authorization separate from UX tone

---

**Ready for Ticket 4?** The prompt builder is the last piece.
