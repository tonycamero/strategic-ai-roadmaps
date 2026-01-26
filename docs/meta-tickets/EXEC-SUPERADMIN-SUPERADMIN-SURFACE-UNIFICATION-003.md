# EXECUTION TICKET

**ID:** EXEC-SUPERADMIN-SUPERADMIN-SURFACE-UNIFICATION-003  
**Title:** Strike 2 — SuperAdmin Surface Unification (Imports + ApiClient Typing + Args-Object)  
**Status:** APPROVED — EXECUTE  
**Parent:** META-SUPERADMIN-FULL-FIX-STRIKE-PLAN-001  
**Related:** META-SUPERADMIN-API-CONSTITUTION-001  
**Owner:** Tony Camero  
**Agent:** Antigravity (AG)

---

## MODE / GOVERNANCE

**Intent:** Remove SuperAdmin API drift by forcing all SuperAdmin UI surfaces to depend on the Sole Client.

**Sole Client Law:** `frontend/src/lib/api.ts` is the ONLY frontend API client.  
**Canonical Client Export:** `api` (type: `ApiClient`)

### HARD PROHIBITIONS
- ❌ No backend code changes.
- ❌ No new endpoints.
- ❌ No new frontend API clients, wrappers, adapters, or fetch usage.
- ❌ Do not change business logic or UX behavior unless required to satisfy typing/compilation.
- ❌ Do not touch frozen legacy page behavior (Strike 3 handles legacy compile fixes explicitly).

---

## 🎯 OBJECTIVE

Eliminate TypeScript build failures caused by SuperAdmin components:
1) importing/typing against drifted API surfaces, and
2) using positional arguments instead of args-object style.

This strike makes the SuperAdmin surface compile against `ApiClient` as the single source of truth.

---

## 📍 CURRENT FAILURE SIGNALS (FROM pnpm -r build)

The following failures must be resolved as part of this strike:

### A) Missing methods on wrong API type (import/type drift)
Files include (not exhaustive):
- `src/superadmin/components/AssistedSynthesisAgentConsole.tsx`
- `src/superadmin/components/AssistedSynthesisModal.tsx`
- `src/superadmin/components/BatchActionModal.tsx`
- `src/superadmin/components/RoadmapGenerationPanel.tsx`
- plus any other `src/superadmin/**` files with TS2339 for methods that exist on `ApiClient`.

### B) Signature mismatch (positional args)
- `src/superadmin/components/TicketModerationPanel.tsx` (TS2554: Expected 1 argument, got 3)

### C) TS6133 unused imports/vars in SuperAdmin files
- Multiple `src/superadmin/**` files (React import unused, unused handlers/state)

---

## 🛠️ EXECUTION PLAN (ORDER MATTERS)

### Step 0 — Inventory Drift Imports
Run ripgrep and save output:
- `rg -n "from ['\"].*(/superadmin/api|superadminApi|fetch\\()" frontend/src/superadmin > frontend/_logs/strike2_api_import_inventory.txt`

Goal: identify every non-sole-client import/call.

### Step 1 — Unify API Imports to Sole Client (Mechanically)
For each SuperAdmin file that calls `superadminApi.*` (or equivalent):

- Ensure it imports ONLY from the Sole Client:
  - `import { api as superadminApi } from '../../lib/api'` (path adjusted per file depth)
  - or use `import { api } from '../../lib/api'` and call `api.*` directly

Remove any imports from:
- `frontend/src/superadmin/api.ts`
- any `superadminApi` wrapper module
- any local typed partial objects

**Rule:** No SuperAdmin file may import an API client from anywhere except `frontend/src/lib/api.ts`.

### Step 2 — Normalize All Calls to Args-Object Signatures
For each call failing typing OR using positional args:
- Convert to the exact `ApiClient` signature (args-object style).

Critical must-fix:
- `TicketModerationPanel.tsx`: replace 3-arg calls with the required args object per `ApiClient` method signature.

### Step 3 — Fix Narrowed Types Causing “method does not exist”
If a file defines something like:
- `const superadminApi: { ... } = ...`
- or imports a type that narrows methods

Remove/replace so the object is typed as `ApiClient` (via the `api` export).

### Step 4 — Resolve TS6133 Unused Imports/Vars (SuperAdmin Surface Only)
Because TS6133 is build-blocking:
- Remove unused `React` imports where JSX runtime doesn’t require them.
- Remove unused state vars/handlers that are truly unused.
- If a handler is intended but unused, wire it minimally to its UI trigger (no UX redesign).

Scope limit: only `frontend/src/superadmin/**` in this strike.

### Step 5 — Verify Strike 2 Gate
Run:
- `pnpm -C frontend exec tsc -p tsconfig.json --pretty false`
Save:
- `frontend/_logs/strike2_after_tsc.txt`

**Success for this ticket:**
- All TS2339 “Property X does not exist on type …” errors inside `frontend/src/superadmin/**` caused by API drift are eliminated.
- `TicketModerationPanel` no longer has TS2554 positional-arg errors.
- TS6133 errors within `frontend/src/superadmin/**` are substantially reduced or eliminated (goal: zero in superadmin surface).

---

## ✅ REQUIRED OUTPUTS

1) `frontend/_logs/strike2_api_import_inventory.txt`
2) `frontend/_logs/strike2_after_tsc.txt`
3) A short completion table listing:
   - file changed
   - import normalized (yes/no)
   - args-object conversions applied (yes/no)

---

**Authorization:** Execute immediately.  
**Next:** Strike 3 ticket will address remaining non-SuperAdmin TS errors and the frozen legacy page compilation failures under explicit authorization.
