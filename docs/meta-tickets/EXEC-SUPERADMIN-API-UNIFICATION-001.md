# EXECUTION TICKET

**ID:** EXEC-SUPERADMIN-API-UNIFICATION-001  
**Title:** SuperAdmin API Unification (Canonical Page → Sole Client, Args-Object Compliance)  
**Status:** APPROVED FOR EXECUTION  
**Parent:** META-SUPERADMIN-API-CONSTITUTION-001  
**Owner:** Tony Camero  
**Agent:** Antigravity (AG)

---

## MODE / GOVERNANCE

**MODE:** Surgical implementation, deterministic, no speculation.  
**Sole Client Law:** `frontend/src/lib/api.ts` is the ONLY frontend API client.  
**Canonical UI:** `frontend/src/superadmin/pages/SuperAdminControlPlaneFirmDetailPage.tsx` is CANONICAL.  
**Legacy UI:** `frontend/src/superadmin/pages/SuperAdminFirmDetailPage.tsx` is LEGACY/FROZEN (do not edit).  

### HARD PROHIBITIONS
- ❌ No backend code changes.
- ❌ No new endpoints.
- ❌ No refactors beyond required call-site argument shape updates in the CANONICAL page.
- ❌ No “TS stubs” in the Sole Client (no fake methods returning placeholders).
- ❌ Do not modify legacy/frozen pages.
- ❌ Do not introduce any new fetch/adapters/clients.
- ❌ Do not “implement what the contracts say” unless it is already represented in the Sole Client.

### KEY RULE (NON-NEGOTIABLE)
**Every SuperAdmin API call in the canonical page MUST match the exact `ApiClient` signature shape in `frontend/src/lib/api.ts` (args-object style).  
No positional arguments. No guesses. If missing, STOP and report.**

---

## 🎯 OBJECTIVE

Restore the SuperAdmin Control Plane UI to its “Locked” working state by:
1) Wiring the canonical page to the Sole Client export `api` (aliased as `superadminApi` locally), and  
2) Converting all SuperAdmin call sites in the canonical page to the **args-object signature style** required by `ApiClient`.

This ticket is **unification + signature compliance** only.

---

## 🧠 CURRENT FAILURE (PROVEN)
- Canonical page currently imports `superadminApi` from a non-canonical module (`../api`), violating the Sole Client Law.
- `frontend/src/lib/api.ts` exports `api: ApiClient`, whose SuperAdmin methods require a **single args object**.
- Canonical page currently calls methods using **positional arguments**, which will not compile once wired to `api`.

---

## 🛠️ EXECUTION PLAN (ORDER MATTERS)

### Step 1 — [MODIFY] Canonical Page Import (Single Surgical Change)
**File:** `frontend/src/superadmin/pages/SuperAdminControlPlaneFirmDetailPage.tsx`

**Action:**
Replace the non-canonical import:
- FROM: `import { superadminApi } from '../api';`
- TO:   Import `api` from `frontend/src/lib/api.ts` and alias it locally as `superadminApi`
        (use correct relative path from this file)
Example target pattern:
- `import { api as superadminApi } from '../../lib/api';`

**Constraint:** After this change, the canonical page must not import from `../api` or `frontend/src/superadmin/api.ts`.

---

### Step 2 — [INVENTORY] Enumerate Every Call Site in the Canonical Page
**Deliverable required in PR description: “Callsite Inventory” section**

List every usage of:
- `superadminApi.<methodName>(...)`

For each call site, capture:
- `methodName`
- file line number(s)
- current argument expression(s) (e.g., `params.tenantId`, `data.latestDiagnostic.id`)
- whether `diagnosticId` is available at that call site (`data.latestDiagnostic?.id` or `data.tenant?.lastDiagnosticId`)

**No changes yet beyond Step 1.**

---

### Step 3 — [MAP] For Each Method, Locate the Authoritative Signature in the Sole Client
**File:** `frontend/src/lib/api.ts`

For each method in the inventory, locate:
- `ApiClient` interface signature for that method
- confirm the implementation exists in `export const api: ApiClient = { ... }`

Record in PR notes (short table is fine):
- methodName
- required args object keys (e.g., `{ tenantId, diagnosticId }`)
- required vs optional keys

**Rule:** Do not infer keys. Use only what `ApiClient` declares.

---

### Step 4 — [MODIFY] Convert Canonical Page Calls to Args-Object Style
**File:** `frontend/src/superadmin/pages/SuperAdminControlPlaneFirmDetailPage.tsx`

For each method call, change from positional → args object.

**Transformation pattern:**
- BEFORE: `await superadminApi.someMethod(a, b)`
- AFTER:  `await superadminApi.someMethod({ a: <value>, b: <value> })`  (keys exactly per `ApiClient`)

#### Diagnostic ID discipline (fail-closed)
If a method signature requires `diagnosticId`:
- Prefer `data.latestDiagnostic.id` when operating on the latest diagnostic UI surface
- Else use `data.tenant.lastDiagnosticId` if that is the canonical “current” diagnostic pointer in the page state
- If neither exists at that call site:
  - Do NOT guess
  - Add/maintain a guard (no-op + user-facing error toast if appropriate, consistent with existing patterns)
  - Document this as a “missing prerequisite” in PR notes

---

### Step 5 — [VERIFY] TypeScript Compilation as Truth Oracle
Run TypeScript build/check (repo standard, e.g., `pnpm tsc` or `pnpm -r build` if required).

**Deliverable required in PR description: “Compiler Findings” section**
- List remaining TypeScript errors (if any)
- Categorize each as:
  - (A) Call signature mismatch (fixable in canonical page)
  - (B) Method missing from `ApiClient` / `api` implementation (STOP: do not stub; report)
  - (C) Non-SuperAdmin unrelated errors (do not address unless blocking this ticket)

---

## 🚫 SCOPE BOUNDARY FOR THIS TICKET

### Allowed
- Import rewiring in the canonical page to use Sole Client `api`
- Converting call arguments to match `ApiClient` args-object signatures
- Adding guards where required inputs (e.g., diagnosticId) are not available at a call site
- Minimal local variable extraction if needed to build the args object cleanly (no refactor)

### Not Allowed
- Adding new API methods to `frontend/src/lib/api.ts` in this ticket
- Adding “stubs” to satisfy compilation
- Introducing new endpoints
- Contract-driven redesign (thick-client → execution-state endpoint refactor) — separate ticket

---

## 🧪 ACCEPTANCE CRITERIA

- Canonical page imports SuperAdmin API exclusively from `frontend/src/lib/api.ts` export `api` (aliased locally is fine).
- Every `superadminApi.<method>` call in the canonical page passes a single args object matching the `ApiClient` signature.
- TypeScript check passes OR remaining failures are strictly “method missing from `ApiClient`” and are reported (not stubbed).
- No edits to legacy/frozen pages.
- No new clients/adapters/fetches introduced.

---

## ✅ COMPLETION OUTPUTS (REQUIRED)
1) PR description includes:
   - Callsite Inventory
   - Signature Map
   - Compiler Findings (with categories A/B/C)
2) A short final note:
   - “Canonical page now uses Sole Client `api`”
   - “All call sites are args-object compliant” 
