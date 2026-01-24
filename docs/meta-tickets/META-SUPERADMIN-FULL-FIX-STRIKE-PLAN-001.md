# META TICKET

**ID:** META-SUPERADMIN-FULL-FIX-STRIKE-PLAN-001  
**Title:** SuperAdmin Full-Fix Program — Three-Strike Execution Plan  
**Status:** ACTIVE  
**Owner:** Tony Camero  
**Authority:** SuperAdmin / Architecture  
**Scope:** Frontend SuperAdmin Surface + Sole Client Alignment  
**Related:** META-SUPERADMIN-API-CONSTITUTION-001

---

## PURPOSE

Establish a **sequenced, constitution-safe execution plan** to fully stabilize the SuperAdmin frontend, eliminate API drift, and achieve a clean production build — without shortcuts, stubs, or speculative backend assumptions.

This META ticket defines **intent, boundaries, and order of operations only**.  
All actual code changes MUST occur under explicitly scoped EXECUTION tickets derived from this plan.

---

## CORE PRINCIPLES (NON-NEGOTIABLE)

1. **Sole Client Law**
   - `frontend/src/lib/api.ts` is the ONLY frontend API client.
   - If a method is not declared on `ApiClient`, it does not exist for the UI.

2. **Fail-Closed Discipline**
   - Required identifiers (e.g. `tenantId`, `diagnosticId`) must be present.
   - No placeholder IDs, defaults, or inferred values.

3. **No Invention**
   - No new backend endpoints.
   - No frontend stubs.
   - Any extension of `ApiClient` requires proof that a backend route already exists.

4. **Sequence Over Speed**
   - Each strike must complete and pass its exit criteria before the next begins.
   - Skipping ahead creates churn and invalidates prior work.

---

## THE THREE-STRIKE PLAN

### 🔹 STRIKE 1 — CONSTITUTION RESTORE
**Objective:**  
Stabilize the **Canonical SuperAdmin Control Plane** so it compiles and runs using the Sole Client, with zero API-surface violations.

**Scope:**
- `SuperAdminControlPlaneFirmDetailPage.tsx` only
- `frontend/src/lib/api.ts` only if extension is proven necessary

**Problems Addressed:**
- Category B failures (methods called by UI but missing on `ApiClient`)
- Method-name drift vs canonical client
- Fail-open diagnosticId fallbacks
- Canonical-page-only compile blockers

**Exit Criteria:**
- Canonical page has **no** `Property X does not exist on type ApiClient` errors
- No placeholder IDs for required args
- Canonical page compiles deterministically

➡ Follow-up: `EXEC-SUPERADMIN-API-CLIENT-EXTENSION-002`

---

### 🔹 STRIKE 2 — SUPERADMIN SURFACE UNIFICATION
**Objective:**  
Eliminate API drift across **all SuperAdmin components** by unifying them under the Sole Client and args-object signatures.

**Scope:**
- `frontend/src/superadmin/**` components and pages
- Imports, call signatures, and local API typings only

**Problems Addressed:**
- Components importing drift clients
- Positional argument usage
- Narrowed or incompatible API typings

**Exit Criteria:**
- No SuperAdmin component calls a non-existent `ApiClient` method
- All SuperAdmin API calls use args-object signatures
- Category B method-missing errors eliminated across SuperAdmin surface

➡ Follow-up: `EXEC-SUPERADMIN-SUPERADMIN-SURFACE-UNIFICATION-003`

---

### 🔹 STRIKE 3 — BUILD HYGIENE & TYPE STABILIZATION
**Objective:**  
Achieve a **green strict build** and production readiness.

**Scope:**
- Remaining TypeScript errors across frontend
- Legacy pages only if explicitly authorized under a stabilization-only mandate

**Problems Addressed:**
- Broken imports / missing modules
- Real type mismatches (TS23xx / TS25xx)
- TS6133 unused imports/vars (last priority)

**Exit Criteria:**
- `pnpm -r build` passes
- App deploys cleanly to production
- Smoke test passes on `https://portal.strategicai.app`

➡ Follow-up: `EXEC-SUPERADMIN-BUILD-HYGIENE-004`

---

## GOVERNANCE NOTES

- This META ticket authorizes **no code changes by itself**.
- Each STRIKE requires its own EXECUTION ticket with:
  - explicit scope
  - explicit prohibitions
  - file-level targets
  - acceptance criteria
- Completion of a STRIKE must be evidenced by build output and/or logs.

---

## SUCCESS DEFINITION

The SuperAdmin system is considered **fully fixed** when:
- All SuperAdmin UI surfaces are downstream of the Sole Client
- API drift is structurally impossible without explicit tickets
- The system builds, deploys, and supports real onboarding (e.g., Ninkasi) without runtime surprises

---

**Status:** Ready to issue STRIKE 1 execution ticket.
