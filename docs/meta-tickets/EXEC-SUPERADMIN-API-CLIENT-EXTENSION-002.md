# EXECUTION TICKET

**ID:** EXEC-SUPERADMIN-API-CLIENT-EXTENSION-002  
**Title:** Strike 1 — Constitution Restore (Canonical Page ↔ Sole Client)  
**Status:** APPROVED — EXECUTE  
**Parent:** META-SUPERADMIN-FULL-FIX-STRIKE-PLAN-001  
**Related:** META-SUPERADMIN-API-CONSTITUTION-001  
**Owner:** Tony Camero  
**Agent:** Antigravity (AG)

---

## MODE / GOVERNANCE

**Intent:** Restore constitutional truth at the boundary. Fix the canonical page first.  
**Sole Client Law:** `frontend/src/lib/api.ts` is the ONLY frontend API client.  
**Canonical Page:** `frontend/src/superadmin/pages/SuperAdminControlPlaneFirmDetailPage.tsx`

### HARD PROHIBITIONS
- ❌ No backend code changes.
- ❌ No new endpoints.
- ❌ No stubs / placeholders / mock returns.
- ❌ No placeholder IDs (e.g., `diagnosticId || 'NEW'`).
- ❌ No refactors outside what is required to make the canonical page compile and behave deterministically.

### EVIDENCE RULE (NON-NEGOTIABLE)
If a method is added to `ApiClient`, you MUST prove the backend route already exists by citing:
- `backend/src/**/routes*.ts` (or equivalent) with file + line range.
No proof → do not add the method.

---

## 🎯 OBJECTIVE

Eliminate **Category B** failures blocking the canonical control plane by aligning it strictly to the Sole Client surface:
- Prefer **renaming canonical page calls** to existing `ApiClient` methods.
- **Only** extend `ApiClient` when a required method truly does not exist **and** backend proof is provided.
- Enforce **fail-closed** behavior for required identifiers.

---

## 📍 CURRENTLY BLOCKING FAILURES (FROM `pnpm -r build`)

Canonical page reports missing client methods and compile blockers, including (not exhaustive):
- `getFirmDetail` (client exposes `getFirmDetailV2`)
- `getSnapshot`
- `getDiscoveryNotes`
- `ingestDiscoveryNotes`
- `getDiagnosticArtifacts`
- Missing import: `../components/ExecutiveBriefPanel`
- Fail-open ID fallbacks present
- `params` possibly null at call sites

These must be resolved **within this ticket’s scope**.

---

## 🛠️ EXECUTION PLAN (ORDER MATTERS)

### Step 0 — Capture Baseline
- Run `pnpm -r build`
- Save first ~80 lines of **frontend** errors to:  
  `frontend/_logs/strike1_baseline.txt`

---

### Step 1 — Canonical Page Method Name Alignment (Prefer Rename)
**File:** `frontend/src/superadmin/pages/SuperAdminControlPlaneFirmDetailPage.tsx`

For each “Property X does not exist on type ApiClient” error:

1) Search `frontend/src/lib/api.ts` for an **existing equivalent**.
2) If found, **rename the canonical page call** to the existing method and adjust response handling minimally (no shape invention).
   - Example: replace `getFirmDetail` → `getFirmDetailV2` if exposed.
3) Do **not** extend the client if an equivalent exists.

---

### Step 2 — Extend Sole Client ONLY When Proven Necessary
**Files:**  
- `frontend/src/lib/api.ts`  
- Backend route file(s) for proof

If (and only if) Step 1 confirms a method is absent **and** the canonical page requires it:

Eligible methods **only with backend proof**:
- `getSnapshot({ tenantId, diagnosticId? })`
- `getDiscoveryNotes({ tenantId, diagnosticId? })`
- `ingestDiscoveryNotes({ tenantId, diagnosticId, payload })`
- `getDiagnosticArtifacts({ diagnosticId })`

**Constraints:**
- Args-object signatures only.
- Do not mark required fields optional unless backend proves optional.
- Implementation must follow existing request helpers/patterns in `api.ts`.
- Include backend route proof (file + line) in PR notes.

---

### Step 3 — Enforce Fail-Closed ID Discipline
**File:** `SuperAdminControlPlaneFirmDetailPage.tsx`

- Remove **all** placeholder ID fallbacks (e.g., `|| 'NEW'`).
- Where `diagnosticId` (or other required ID) is missing:
  - Block the action.
  - Surface a clear toast/error.
  - Do **not** call the API.

---

### Step 4 — Resolve Canonical-Only Compile Blockers
**File:** `SuperAdminControlPlaneFirmDetailPage.tsx`

- Fix missing `ExecutiveBriefPanel` import:
  - Correct the path to an existing component **or**
  - Remove/replace usage with an existing component already in the repo.
- Address `params possibly null` with explicit guards (no non-null assertions).

---

### Step 5 — Verify Strike 1 Gates
- Run `pnpm -r build`
- Save first ~80 lines of frontend output to:  
  `frontend/_logs/strike1_after.txt`

**Success for this ticket:**
- Canonical page has **zero** “method missing on ApiClient” errors.
- No placeholder IDs remain for required args.
- Canonical page compiles deterministically (other SuperAdmin components may still fail — handled in Strike 2).

---

## ✅ REQUIRED OUTPUTS (IN PR DESCRIPTION OR COMPLETION COMMENT)

1) **Method Resolution Table (Canonical Page)**
   - Method referenced
   - Resolution: renamed to existing ApiClient method **or** added to ApiClient
   - Final call site file + line

2) **If ApiClient Extended**
   - Backend route proof (file + line)
   - `api.ts` method signature + implementation location

3) **Logs**
   - `frontend/_logs/strike1_baseline.txt`
   - `frontend/_logs/strike1_after.txt`

---

**Authorization:** Execute immediately.  
**Next:** Upon completion, proceed to Strike 2 ticket issuance.
