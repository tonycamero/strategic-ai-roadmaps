# PROJECTION_CONSTRAINT_PRIMITIVES_REALITY.md

**Ticket Authority:** EXECUTION-TICKET-PROJECTION-CONSTRAINT-PRIMITIVES-FORENSIC-001
**Mode:** READ-ONLY
**Date:** 2026-03-02

---

## 1. firmSizeTier

### Origin
- **Table:** `tenants`
- **Column:** `firm_size_tier`, `varchar(20)`, default `'small'`
- **Schema file:** `backend/src/db/schema.ts`, line 19
- **Allowed values (schema comment):** `micro | small | mid | large`

### Write Paths
| Location | File | Lines | Method |
|---|---|---|---|
| Direct update (tenants.controller) | `tenants.controller.ts` | 166–167, 193–195 | Validated: must be one of `['micro','small','mid','large']`. Writes `tenants.firmSizeTier` directly. |

### Current Consumers

| Consumer | File | Lines | Usage |
|---|---|---|---|
| Command center summary | `superadmin.controller.ts` | 933 | SELECT firmSizeTier for display |
| generateSop01 handler | `superadmin.controller.ts` | 1129 | Passed to SOP generation |
| TruthProbe | `superadmin.controller.ts` | 1197 | Returned in probe response |
| generateDiagnostics | `superadmin.controller.ts` | 1459 | Passed to diagnostic generation |
| activateTicketModeration | `superadmin.controller.ts` | 4224, 4241 | Fetched and passed as `firmSize` to `generateRawTickets()` |
| Owner Dashboard | `ownerDashboard.controller.ts` | 176 | Returned in dashboard |
| tenants.controller | `tenants.controller.ts` | 66, 219 | Read/write |
| Road map agent sync | `roadmapAgentSync.service.ts` | 247, 359 | Used in agent context as `firmSizeTier` |
| QnA context | `roadmapQnAContext.service.ts` | 280 | Included in QnA context payload |
| SOP ticket generator | `sopTicketGenerator.service.ts` | 29, 41, 117–125 | Min/max ticket count logic |
| Prompt builder | `trustagent/prompts/diagnosticToTickets.ts` | 37, 55, 65, 179 | Injected directly into LLM prompt |
| Inventory selection | `trustagent/services/inventorySelection.service.ts` | — | Derived independently (see below) |

### Hardcoded Tier Logic in sopTicketGenerator.service.ts (lines 117–125)
```typescript
const minTickets = firmSizeTier === 'micro' ? 12 : 15;
const maxTickets = firmSizeTier === 'large' ? 30 : firmSizeTier === 'mid' ? 25 : 20;
```

### Prompt-Based Scaling Logic in diagnosticToTickets.ts (lines 67–70, 179)
```
- Micro (3-7 people): 8-12 tickets
- Small (8-20 people): 10-15 tickets
- Mid (20-50 people): 15-20 tickets
- Large (50+ people): 20-25 tickets

For ${firmSizeTier} firms: Keep ADVANCED minimal (0-3 tickets max)
```

### Projection Involvement
- **firmSizeTier is NOT in the Projection output.**
- `TenantLifecycleView` does not include `firmSizeTier` anywhere.
- No derived capability is gated on `firmSizeTier`.

---

## 2. teamHeadcount

### Origin
- **Table:** `tenants`
- **Column:** `team_headcount`, `integer`, default `5`
- **Schema file:** `backend/src/db/schema.ts`, line 17

### Write Paths
| Location | File | Lines | Method |
|---|---|---|---|
| Direct update (tenants.controller) | `tenants.controller.ts` | 143, 158–159, 193 | Required on tenant creation. Must be positive number. |

### Current Consumers

| Consumer | File | Lines | Usage |
|---|---|---|---|
| Command center | `superadmin.controller.ts` | 931 | Display |
| generateSop01 | `superadmin.controller.ts` | 1127 | Passed to SOP generation |
| TruthProbe | `superadmin.controller.ts` | 1195 | Returned in probe |
| generateDiagnostics | `superadmin.controller.ts` | 1460 | Passed to diagnostic gen |
| activateTicketModeration | `superadmin.controller.ts` | 4225, 4242 | `employeeCount: teamHeadcount || 5` |
| Owner Dashboard | `ownerDashboard.controller.ts` | 174 | Returned |
| tenants.controller | `tenants.controller.ts` | 64, 143, 217 | Read/write |
| Roadmap agent sync | `roadmapAgentSync.service.ts` | 247, 361 | Agent context string |
| QnA context | `roadmapQnAContext.service.ts` | 44, 266, 269, 284 | Context assembly |
| SOP ticket generator | `sopTicketGenerator.service.ts` | 30, 41, 47, 64 | Passed to prompt |
| Prompt builder | `trustagent/prompts/diagnosticToTickets.ts` | 38, 55, 65 | Injected into LLM prompt |
| Inventory selection | `trustagent/services/inventorySelection.service.ts` | 43, 47 | Input to `deriveFirmSizeTier()` |
| Onboarding progress | `onboardingProgress.service.ts` | 120–121 | Business profile completion check |

### Implicit Scaling Logic — deriveFirmSizeTier()
**File:** `backend/src/trustagent/services/inventorySelection.service.ts`, lines 20–26

```typescript
export function deriveFirmSizeTier(teamHeadcount?: number | null): 'micro' | 'small' | 'mid' | 'large' {
  const n = teamHeadcount ?? 5;
  if (n <= 7)  return 'micro';
  if (n <= 20) return 'small';
  if (n <= 50) return 'mid';
  return 'large';
}
```

This function **re-derives** `firmSizeTier` independently from `teamHeadcount`, bypassing the stored `tenants.firmSizeTier` column. The inventory selection pipeline uses this derived value, not the canonical column.

### Projection Involvement
- `teamHeadcount` is NOT in `TenantLifecycleView`.
- No derived capability is gated on `teamHeadcount`.

---

## 3. vertical

### Origin
- **Table:** `tenants`
- **Column:** `segment`, `varchar(255)` — see note below.
- **Alternative field:** There is no `vertical` column on `tenants`. The `businessType` column (`text`, default `'default'`) exists but is not used as vertical.
- **Actual vertical source:** `tenant.vertical` is referenced in `inventorySelection.service.ts` line 42 as `vertical?: string | null`. This suggests `tenants.segment` is passed as `vertical` in the DiagMap, or the field is absent. Investigation:
  - `superadmin.controller.ts` line 4240: `firmSize: tenantData.firmSizeTier || 'Small'` — no `vertical` field fetched in `activateTicketModeration` DiagMap construction.
  - `inventorySelection.service.ts` `buildSelectionContext` accepts `tenant.vertical?: string | null`.
  - **Finding:** No `vertical` column exists on `tenants` table. The `buildSelectionContext` receives `undefined` for `vertical` in current `activateTicketModeration` call path, defaulting to `'generic'`.

### Vertical String Mapping (inventorySelection.service.ts lines 50–58)
```typescript
let vertical: SelectionContext['vertical'] = 'generic';
if (tenant.vertical) {
  const v = tenant.vertical.toLowerCase();
  if (v.includes('chamber')) vertical = 'chamber';
  else if (v.includes('agency') || v.includes('marketing')) vertical = 'agency';
  else if (v.includes('trades') || v.includes('hvac') || v.includes('plumbing')) vertical = 'trades';
  else if (v.includes('coach')) vertical = 'coaching';
  else if (v.includes('professional') || v.includes('law') || v.includes('accounting')) vertical = 'professional';
}
```

Allowed vertical values: `'generic' | 'chamber' | 'agency' | 'trades' | 'coaching' | 'professional'`

### Projection Involvement
- Vertical is NOT in `TenantLifecycleView`. No capability is gated on vertical.

---

## 4. integrations / adapter

### Origin
- **No `integrations` column exists on `tenants` table.**
- **No `adapter` column exists on `tenants` table.**
- The `Execution Envelope Spec` (canon) defines `adapters` and `namespaces` as projection-emitted fields, but **the Projection (`TenantStateAggregationService`) does NOT emit `executionEnvelope`**.
- GHL is treated as the default and only adapter in all prompt logic and inventory. No tenant-level integration field gates inventory selection.

### Current implicit integration assumption
- All inventory items are assumed GHL-based. The `diagnosticToTickets.ts` prompt references `ghl_implementation` field as a required ticket field.
- `inventorySelection.service.ts` references `getGHLNativeInventory()` and `getSidecarInventory()` — GHL is the hardcoded adapter surface.

---

## 5. customDevAllowed

### Finding
- **`customDevAllowed` does not exist anywhere in the codebase.**
- A search for `customDev` across all `.ts` files returned: **No results found.**
- The `EXECUTION_ENVELOPE_SPEC.md` canon document describes `customDevAllowed: boolean` as a required projection field, but it is not implemented in the Projection or anywhere in the backend.

---

## 6. complexity / complexityTier

### Finding
- **No `complexity` or `complexityTier` field exists in the backend schema or services.**
- `diagnosticToTickets.ts` assigns tier as `'core' | 'recommended' | 'advanced'` (not a numeric complexity tier).
- `inventorySelection.service.ts` line 146–153 assigns `baseCount` by `firmSizeTier` — no numeric complexity tier.
- `EXECUTION_ENVELOPE_SPEC.md` defines `complexityTier: 1–5` and `maxComplexityTier` as required inventory fields, but these are **not implemented** in inventory JSON structures or the selection service.

---

## 7. COMPLETE CONSTRAINT PRIMITIVE MAP

| Primitive | DB Column | Projection Emitted | Prompt Injected | Hardcoded Logic |
|---|---|---|---|---|
| firmSizeTier | `tenants.firm_size_tier` varchar(20) | NO | YES (diagnosticToTickets.ts L55,65,179) | YES (sopTicketGenerator.ts L117–125, inventorySelection.ts L146–177) |
| teamHeadcount | `tenants.team_headcount` integer | NO | YES (diagnosticToTickets.ts L55,65) | YES (deriveFirmSizeTier L20–26) |
| vertical | NO COLUMN | NO | Implicitly (via buildSelectionContext) | YES (keyword matching L50–58) — defaults to 'generic' in current code path |
| integrations | NOT PRESENT | NO | NO (GHL assumed globally) | YES (GHL hardcoded as only adapter) |
| customDevAllowed | NOT PRESENT | NO | NO | NOT IMPLEMENTED |
| complexityTier | NOT PRESENT | NO | NO | NOT IMPLEMENTED |
| adapter | NOT PRESENT | NO | YES (ghl_implementation field required) | YES (GHL assumed) |

---

## 8. ALL IMPLICIT SCOPE DECISIONS

1. **Ticket count range** is derived by `firmSizeTier` at prompt time — lives in `sopTicketGenerator.service.ts` and LLM prompt, not in Projection.

2. **Sidecar cap** (`maxSidecars`) is derived by `firmSizeTier` inside `inventorySelection.service.ts` lines 156–177 — not in Projection.

3. **Vertical-based inventory filtering** is computed by keyword matching of an untracked string — not in Projection, not in schema.

4. **`firmSizeTier` in inventory selection is derived from `teamHeadcount`** (via `deriveFirmSizeTier`) at selection time, NOT read from the canonical `tenants.firmSizeTier` column. These two can diverge.

5. **GHL is the only adapter surface** in inventory. No multi-adapter routing exists despite the canon defining it.
