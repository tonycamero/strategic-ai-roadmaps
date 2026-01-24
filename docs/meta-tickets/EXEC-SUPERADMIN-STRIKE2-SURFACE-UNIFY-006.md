# EXECUTION TICKET

**ID:** EXEC-SUPERADMIN-STRIKE2-SURFACE-UNIFY-006  
**Title:** Strike 2 — SuperAdmin Surface Unification (Sole Client Imports + ApiClient Typing + Args-Object + TS6133)  
**Status:** APPROVED — EXECUTE  
**Parent:** META-SUPERADMIN-FULL-FIX-STRIKE-PLAN-001  
**Related:** META-SUPERADMIN-API-CONSTITUTION-001  
**Owner:** Tony Camero  
**Agent:** Antigravity (AG)

---

## MODE / GOVERNANCE

**Sole Client Law:** `frontend/src/lib/api.ts` is the ONLY frontend API client.  
No local API objects, wrappers, adapters, or fetch usage inside SuperAdmin.

### Allowed Files
- `frontend/src/superadmin/**`
- `frontend/src/lib/api.ts` ONLY if you discover a method missing AND you can cite backend route file+line proving it exists (do not add speculative methods)

### HARD PROHIBITIONS
- ❌ No backend changes.
- ❌ No new endpoints.
- ❌ No behavioral refactors (UI/logic) beyond what is required to fix type errors and compile.
- ❌ No “V2 feature work” (status spine, gating logic, etc.). This strike is compilation + import discipline only.

---

## 🎯 OBJECTIVE

Get `pnpm -C frontend exec tsc -p tsconfig.json` to pass by:
1) removing API drift (all SuperAdmin code must compile against `ApiClient`)
2) converting all SuperAdmin calls to args-object style
3) resolving TS6133 errors in SuperAdmin files (unused imports/vars) because they block build

---

## ✅ REQUIRED WORKSTREAMS

### Workstream A — Fix “method does not exist” (TS2339) via Import/Type Unification
The following methods MUST resolve by ensuring the calling file is using `ApiClient` (`api` export) and not a narrowed/drifted type:

- `getAgentSession`, `sendAgentMessage`, `resetAgentSession`
- `getProposedFindings`, `generateAssistedProposals`, `declareCanonicalFindings`
- `previewReadinessBatch`, `executeReadinessBatch`
- `assembleRoadmap`, `publishRoadmap`, `rerunSop01Diagnostic`

**Rule:** If the method exists on `ApiClient`, you fix the caller’s import/type.
Do NOT add methods to `api.ts` just to satisfy the caller unless backend route proof is provided.

### Workstream B — Fix positional-args mismatches (TS2554)
- `frontend/src/superadmin/components/TicketModerationPanel.tsx` currently passes 3 args.
Convert to the single args-object required by the corresponding `ApiClient` method signature.

### Workstream C — TS6133 cleanup (build-blocking)
For SuperAdmin files only (`frontend/src/superadmin/**`):
- Remove unused `React` imports where not required.
- Remove unused state variables/setters/handlers OR wire them minimally if they are clearly intended and already have UI hooks.

**Do NOT** introduce new logic to “justify” unused variables. Prefer deletion.

---

## 🛠️ EXECUTION PLAN (ORDER MATTERS)

### Step 0 — Inventory all non-canonical API imports in SuperAdmin
Run and save:
- `rg -n "from ['\"].*(/superadmin/api|superadminApi|src/superadmin/api)" frontend/src/superadmin > frontend/_logs/strike2_import_drift.txt`
- `rg -n "fetch\\(" frontend/src/superadmin > frontend/_logs/strike2_fetch_scan.txt`

### Step 1 — Enforce Sole Client import everywhere
Mechanically update SuperAdmin files to import:
- `import { api } from '../lib/api'` (path adjusted)
or
- `import { api as superadminApi } from '../../lib/api'` (path adjusted)

Then ensure calls target `api.*` (or `superadminApi.*`) typed as `ApiClient`.

### Step 2 — Convert all calls to args-object signatures
Fix every TS2554 and any TS2339 caused by wrong call shape (positional args).

### Step 3 — Remove TS6133 causes in SuperAdmin
Iterate through the TS output and remove unused items in SuperAdmin files.

### Step 4 — Verify
Run:
- `cd frontend && pnpm exec tsc -p tsconfig.json --pretty false`

Save:
- `frontend/_logs/strike2_after_tsc.txt`

---

## ✅ ACCEPTANCE CRITERIA

- No TS2339 “method does not exist” errors remain in `frontend/src/superadmin/**` caused by API drift.
- `TicketModerationPanel.tsx` has no TS2554 positional-args errors.
- TS6133 errors in `frontend/src/superadmin/**` reduced to ZERO.

(Any remaining errors outside `src/superadmin/**` or in frozen legacy page are Strike 3.)
