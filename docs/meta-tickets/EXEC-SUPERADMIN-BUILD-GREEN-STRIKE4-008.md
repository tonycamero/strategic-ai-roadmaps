# EXECUTION TICKET

**ID:** EXEC-SUPERADMIN-BUILD-GREEN-STRIKE4-008  
**Title:** Strike 4 — SuperAdmin Build Green (TS Hygiene + API Surface Proof-Driven Reconciliation)  
**Status:** APPROVED — EXECUTE  
**Parent:** META-SUPERADMIN-FULL-FIX-STRIKE-PLAN-001  
**Related:** META-SUPERADMIN-API-CONSTITUTION-001  
**Owner:** Tony Camero  
**Agent:** Antigravity (AG)

---

## MODE / GOVERNANCE

Objective: **Frontend build must go green** without violating Sole Client or inventing API surface.

### HARD RULES
- `frontend/src/lib/api.ts` is the **sole frontend API client**.
- No new API methods may be added unless the backend route is **proven** (file + line).
- No method stubs, no fake endpoints.
- If a UI calls a method that does not exist and cannot be proven → **disable the UI action** with explicit messaging (compile-safe).

---

## STARTING EVIDENCE (CURRENT FAILURES)

### API Surface Mismatches
- `BatchActionModal.tsx`
  - `previewReadinessBatch`
  - `executeReadinessBatch`
- `RoadmapGenerationPanel.tsx`
  - `assembleRoadmap`
  - `publishRoadmap`
  - `rerunSop01Diagnostic`
- `SuperAdminFirmDetailPage.tsx`
  - `saveDiscoveryNotes`
  - `exportFirmIntakes`
  - `updateTenant`
- `SuperAdminControlPlaneFirmDetailPage.tsx`
  - Passing `{ tenantId, diagnosticId }` to a method that only accepts `{ tenantId }` (TS2353)

### TS Hygiene / Type Errors
- TS6133 unused imports/vars across many SuperAdmin components/pages
- SVG `title` prop invalid on `<svg>` (ExecuteTenantRow.tsx)
- Missing `intakeWindowState` in firm detail types
- Type mismatch in `IntakeModal.tsx`
- Missing `outcomes` on snapshot/baseline types

---

## EXECUTION PLAN (STRICT ORDER)

### Step 0 — Capture Proof Artifacts
From repo root:
```bash
cd ~/code/Strategic_AI_Roadmaps
mkdir -p frontend/_logs
pnpm -r build > frontend/_logs/strike4_build.txt 2>&1 || true
cd frontend && pnpm exec tsc -p tsconfig.json --pretty false > _logs/strike4_tsc.txt 2>&1 || true
cd ..
rg -n "from ['\"].*(/superadmin/api|src/superadmin/api)" frontend/src/superadmin > frontend/_logs/strike4_import_drift.txt || true
rg -n "fetch\\(" frontend/src/superadmin > frontend/_logs/strike4_fetch_drift.txt || true
```

Acceptance:

* No imports from legacy superadmin APIs
* No raw `fetch()` calls in `src/superadmin/**`

---

### Step 1 — TS6133 Hygiene Sweep (Safe Only)

For every TS6133:

* Remove unused `React` imports (or convert to `import type` if genuinely needed)
* Remove unused locals (`editingId`, unused setters, unused flags, etc.)
* **No behavior changes**

---

### Step 2 — SVG Prop Fix

File: `ExecuteTenantRow.tsx`

* Remove invalid `title` attribute from `<svg>`
* If needed, replace with `<title>` child element
* Must resolve TS2322 at lines ~96 / 105 / 114

---

### Step 3 — Type Shape Corrections (No API Invention)

A) `SuperAdminFirmDetailPage.tsx`

* Fix missing `intakeWindowState`
* Only:

  * Make optional **if backend does not return it**, OR
  * Source it from already-loaded firm data
* Do **not** fabricate runtime values

B) `IntakeModal.tsx`

* Correct argument mismatch where `Record<string, CoachingFeedback>` is passed to a function expecting `string`
* Align with existing contract (e.g., stringify only if contract already expects string)

C) `FirmDrawer.tsx`

* Fix `outcomes` access:

  * Add optional typing if API returns it
  * Otherwise gate/remove the UI reference

---

### Step 4 — API Surface Reconciliation (Proof-Driven)

For EACH missing ApiClient method:

1. Search backend routes:

   * `backend/src/routes/superadmin.routes.ts` (or authoritative routes file)
2. If route EXISTS:

   * Add method to `frontend/src/lib/api.ts`
   * Use args-object signature
   * Must cite backend file + line in report
3. If route DOES NOT EXIST:

   * Do NOT add method
   * Disable the UI action (button disabled + explicit “Unavailable in ApiClient” messaging)

Methods to reconcile:

* `previewReadinessBatch`
* `executeReadinessBatch`
* `assembleRoadmap`
* `publishRoadmap`
* `rerunSop01Diagnostic`
* `saveDiscoveryNotes` (prefer aligning to `ingestDiscoveryNotes` if semantically identical)
* `exportFirmIntakes`
* `updateTenant`

Also fix:

* TS2353 in `SuperAdminControlPlaneFirmDetailPage.tsx` by aligning args with the actual ApiClient method signature

---

### Step 5 — Verification

```bash
cd frontend
pnpm exec tsc -p tsconfig.json --pretty false
pnpm exec vite build
```

Save:

* `frontend/_logs/strike4_tsc_after.txt`
* `frontend/_logs/strike4_vite_after.txt`

---

## ACCEPTANCE CRITERIA

* `pnpm exec tsc -p tsconfig.json` → exit 0
* `pnpm exec vite build` → exit 0
* Sole Client enforced
* No invented API surface
* All disabled features are explicit and intentional

---

## REQUIRED REPORT BACK

1. Table: error → file → line → fix
2. For each ApiClient method added: backend route file + line proof
3. Attach logs:

   * strike4_build.txt
   * strike4_tsc.txt
   * strike4_tsc_after.txt
   * strike4_vite_after.txt

---
