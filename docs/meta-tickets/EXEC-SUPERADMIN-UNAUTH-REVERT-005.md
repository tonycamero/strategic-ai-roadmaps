# EXECUTION TICKET

**ID:** EXEC-SUPERADMIN-UNAUTH-REVERT-005  
**Title:** Revert Unauthorized SuperAdmin V2 Refactor (Restore Strike Baseline Integrity)  
**Status:** APPROVED — EXECUTE  
**Parent:** META-SUPERADMIN-FULL-FIX-STRIKE-PLAN-001  
**Related:** META-SUPERADMIN-API-CONSTITUTION-001, EXEC-SUPERADMIN-API-CLIENT-EXTENSION-002  
**Owner:** Tony Camero  
**Agent:** Antigravity (AG)

---

## MODE / GOVERNANCE

This ticket is a **governance correction**.

### Allowed Files
- `frontend/src/superadmin/pages/SuperAdminControlPlaneFirmDetailPage.tsx`
- `frontend/src/superadmin/types.ts` (ONLY if needed to restore compile baseline)

### HARD PROHIBITIONS
- ❌ No backend work.
- ❌ No new endpoints.
- ❌ No feature work.
- ❌ No refactors beyond reverting unauthorized changes.
- ❌ Do not remove the authorized Sole Client alignment and fail-closed guards.

---

## 🎯 OBJECTIVE

Revert the unauthorized "V2" UI refactor work performed in the canonical page, while preserving the authorized Strike 1 work:
- Sole Client API usage (ApiClient)
- route-backed client methods
- args-object signatures
- fail-closed diagnosticId guards

Restore the canonical page to a **pre-V2 behavior baseline** such that it compiles and does not introduce new lifecycle/UI logic outside ticket scope.

---

## 📍 UNAUTHORIZED CHANGE LOCATIONS (MUST BE REMOVED)

From the Proof Bundle:

- Status Spine Derivation: `SuperAdminControlPlaneFirmDetailPage.tsx` lines 272–321 (`getCanonicalStatus`)
- Execution Control Plane Gates: lines 413–468 (V2 handlers)
- Truth Probe Sidebar + Gating: lines 193–206 (data wiring)
- Modal Wiring Refactor: lines 1160–1212 (mounting changes)

Also remove the consolidated unused state/handlers that caused TS6133:
- `execBriefLoading`, `execBriefError`, `handleSubmit` (and any other unused introduced by the V2 refactor)

---

## ✅ AUTHORIZED WORK THAT MUST REMAIN

Do NOT revert these (unless they were only introduced as part of unauthorized refactor and can be preserved independently):

- Sole Client usage: canonical page must call `api` from `frontend/src/lib/api.ts`
- Args-object calls
- Fail-closed guards preventing lifecycle actions when `diagnosticId` is missing
- Client-side method naming corrections consistent with `ApiClient`
- Any ApiClient additions already proven against backend routes (do not touch `frontend/src/lib/api.ts`)

---

## 🛠️ EXECUTION PLAN

### Step 1 — Capture Baseline
Run:
- `cd frontend && pnpm exec tsc -p tsconfig.json --pretty false`

Save to:
- `frontend/_logs/unauth_revert_baseline.txt`

### Step 2 — Revert Unauthorized Blocks
In `SuperAdminControlPlaneFirmDetailPage.tsx`:
- Remove `getCanonicalStatus` and all dependent logic/UI.
- Remove Truth Probe sidebar + gating logic added in the unauthorized scope.
- Remove V2 handler refactors and restore prior handler wiring (as close as possible).
- Revert modal mounting refactor to prior behavior (do not invent; restore previous pattern from git history if available).

### Step 3 — Remove TS6133 Blockers Introduced by V2
Remove unused state/handlers introduced by the unauthorized refactor.

### Step 4 — Verify
Re-run:
- `cd frontend && pnpm exec tsc -p tsconfig.json --pretty false`

Save to:
- `frontend/_logs/unauth_revert_after.txt`

**Success for this ticket:**
- The three canonical page TS6133 errors are gone:
  - line ~127 `execBriefLoading`
  - line ~128 `execBriefError`
  - line ~1237 `handleSubmit`
- No new canonical page errors introduced.

---

## ✅ REQUIRED OUTPUTS

- `frontend/_logs/unauth_revert_baseline.txt`
- `frontend/_logs/unauth_revert_after.txt`
- Short note listing exactly what was reverted and what was preserved.

---
