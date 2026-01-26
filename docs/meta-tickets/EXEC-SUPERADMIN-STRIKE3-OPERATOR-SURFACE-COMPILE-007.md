# EXECUTION TICKET

**ID:** EXEC-SUPERADMIN-STRIKE3-OPERATOR-SURFACE-COMPILE-007  
**Title:** Strike 3 — Operator/Executive SuperAdmin Firm Detail Compile Stabilization (No Behavior Changes)  
**Status:** APPROVED — EXECUTE  
**Parent:** META-SUPERADMIN-FULL-FIX-STRIKE-PLAN-001  
**Related:** META-SUPERADMIN-API-CONSTITUTION-001  
**Owner:** Tony Camero  
**Agent:** Antigravity (AG)

---

## MODE / GOVERNANCE

This page is a **distinct Operator/Executive surface** (not the Canonical Control Plane).  
This ticket authorizes **compile stabilization only** so the frontend build can pass.

### Allowed Files
- `frontend/src/superadmin/pages/SuperAdminFirmDetailPage.tsx`
- Any directly imported local component ONLY if `tsc` errors originate from this page and cannot be resolved otherwise (must cite file+line)

### HARD PROHIBITIONS
- ❌ No backend work.
- ❌ No new endpoints.
- ❌ No product/UX refactor.
- ❌ No re-architecture or moving logic between pages.
- ❌ No changes to Canonical Control Plane page (`SuperAdminControlPlaneFirmDetailPage.tsx`) under this ticket.

---

## 🎯 OBJECTIVE

Make `frontend/src/superadmin/pages/SuperAdminFirmDetailPage.tsx` compile cleanly under:
- `cd frontend && pnpm exec tsc -p tsconfig.json --pretty false`

This is strictly a build unblocker for the Operator/Executive surface.

---

## 📍 CURRENT FAILURES TO RESOLVE (FROM pnpm -r build OUTPUT)

1) TS6133 unused state:
- `runningSop01`, `setRunningSop01`
- `runningRoadmap`, `setRunningRoadmap`
- and any other TS6133 in this file

2) TS2741 missing property:
- `Property 'intakeWindowState' is missing in type ...` (at lines ~74 and ~594)

3) TS2552 navigation:
- `Cannot find name 'navigate'. Did you mean 'navigator'?` (line ~136)

4) Any additional errors in this file that appear after fixing the above.

---

## 🛠️ EXECUTION PLAN (ORDER MATTERS)

### Step 1 — Capture Baseline
Run:
- `cd frontend && pnpm exec tsc -p tsconfig.json --pretty false`

Save the block of errors for this file into:
- `frontend/_logs/strike3_operator_surface_baseline.txt`

### Step 2 — Fix `navigate` Correctly (No Guessing)
Identify routing library used in this file (e.g., `wouter`, `react-router-dom`, etc.) by inspecting existing imports and usage patterns in nearby pages.
Then implement the correct navigation mechanism for this project:

- If `wouter`: use `const [, navigate] = useLocation()` and call `navigate('/path')`
- If `react-router-dom`: use `const navigate = useNavigate()` and call `navigate('/path')`

Constraint:
- Do not change routes or destination strings except where necessary to compile.

### Step 3 — Resolve `intakeWindowState` Type/Shape Errors
At each TS2741 error site:
- Determine the expected type (find where the object is being constructed or passed).
- Provide `intakeWindowState` in the object literal using an existing, truthful source value if present (e.g., from fetched tenant/firm detail data).
- If no source exists locally, use a conservative placeholder value consistent with domain semantics (e.g., `'unknown'` or `'open'`) ONLY if the type is purely compile-time and does not affect runtime behavior. Prefer sourcing from real data already present in scope.

**Important:** This must not introduce new API calls or endpoints.

### Step 4 — TS6133 Cleanup (No Feature Work)
Remove or correctly wire unused state/handlers:
- If `runningSop01` and `runningRoadmap` are unused: remove them.
- If they are meant to disable buttons/spinners already present: wire them minimally to existing UI events and state usage (no UX redesign).

### Step 5 — Verify
Re-run:
- `cd frontend && pnpm exec tsc -p tsconfig.json --pretty false`

Save:
- `frontend/_logs/strike3_operator_surface_after.txt`

---

## ✅ ACCEPTANCE CRITERIA

- `SuperAdminFirmDetailPage.tsx` produces **zero** TypeScript errors under project `tsc`.
- No new API clients, fetches, or endpoints introduced.
- No changes to Canonical Control Plane page.

---

## ✅ REQUIRED OUTPUTS

1) `frontend/_logs/strike3_operator_surface_baseline.txt`
2) `frontend/_logs/strike3_operator_surface_after.txt`
3) Short diff summary: each fixed error → what was changed (file+line)

---
