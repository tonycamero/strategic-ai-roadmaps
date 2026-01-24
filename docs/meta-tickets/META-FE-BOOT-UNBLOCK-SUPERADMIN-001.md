# META-TICKET v2: META-FE-BOOT-UNBLOCK-SUPERADMIN-001

## Goal
Restore Vite dev-server GREEN by eliminating current frontend hard-fail errors (merge markers + missing imports) in the SuperAdmin surface, using minimal surgical fixes that preserve governance invariants and avoid scope creep.

## Critical Constraints
- MUST preserve platform invariants (authority gating / lifecycle contract / fail-closed behaviors).
- MUST NOT refactor unrelated code or "clean up" beyond what is required to boot.
- MUST NOT upgrade dependencies or run "npm i ...@latest" just because a warning suggests it.
  - The baseline-browser-mapping warning is NON-BLOCKING; ignore for this ticket.
- MUST NOT change package manager, build tooling, or Vite config unless explicitly necessary to fix the named errors.
- MUST resolve merge conflicts surgically (no wholesale deletions; choose a single canonical implementation).
- MUST store THIS META-TICKET in: `docs/meta-tickets/META-FE-BOOT-UNBLOCK-SUPERADMIN-001.md`
- MUST open a PR for review (no direct merges to main).

## Current Failing Signals (Authoritative)
1) `frontend/src/superadmin/api.ts` contains unresolved merge markers:
   - ERROR: Unexpected "<<" at line 1: "<<<<<<< Updated upstream"
2) Missing module import:
   - Failed to resolve import "./pages/SuperAdminExecuteFirmDetailPage" from "src/superadmin/SuperAdminLayout.tsx"
3) Missing module import:
   - Failed to resolve import "../../components/onboarding/StakeholderModal" from "src/superadmin/pages/SuperAdminControlPlaneFirmDetailPage.tsx"

## Scope
### IN SCOPE
- Fix unresolved merge markers in `frontend/src/superadmin/api.ts`
- Restore correct module graph for SuperAdmin by either:
  a) creating the missing files if they are supposed to exist, OR
  b) correcting imports to point at the canonical existing implementation, OR
  c) conditionally gating routes/components so missing modules are not imported at build time
- Ensure Vite dev server runs without pre-transform/import-analysis errors.

### OUT OF SCOPE
- Any backend changes
- Any database changes
- Any UI redesign
- Any feature additions
- Dependency upgrades (including baseline-browser-mapping)
- Refactors of shared domain logic unrelated to the failing imports

## Execution Plan

### Phase A - Persist ticket
- Write this META-TICKET verbatim to `docs/meta-tickets/META-FE-BOOT-UNBLOCK-SUPERADMIN-001.md` before any code edits.

### Phase B - Fix merge markers (hard-fail)
- Open `frontend/src/superadmin/api.ts`
- Remove all conflict markers (<<<<<<<, =======, >>>>>>>)
- Select the single canonical export surface for the SuperAdmin API client.
- Ensure file compiles and exports are consistent with current SuperAdmin pages/components usage.

### Phase C - Resolve missing page import: SuperAdminExecuteFirmDetailPage
- Search for any existing page with equivalent intent/name:
  - SuperAdminExecuteFirmDetailPage
  - ExecuteFirmDetail
  - ControlPlaneFirmDetail
  - FirmDetail variants
- If a canonical page exists:
  - Update `SuperAdminLayout.tsx` to import the canonical file.
- If no canonical page exists:
  - Implement a minimal placeholder page component at:
    `frontend/src/superadmin/pages/SuperAdminExecuteFirmDetailPage.tsx`
  - Placeholder must:
    - compile
    - render a clear "Not Implemented" panel
    - avoid side effects
    - not introduce new dependencies

### Phase D - Resolve missing StakeholderModal import
- Locate whether StakeholderModal was moved/renamed:
  - Search for "StakeholderModal" in `frontend/src`
- If it exists elsewhere:
  - Update import path in `SuperAdminControlPlaneFirmDetailPage.tsx` to the canonical location.
- If it does not exist:
  - Implement minimal StakeholderModal at:
    `frontend/src/components/onboarding/StakeholderModal.tsx`
  - Requirements:
    - export `StakeholderModal` named export
    - accept props compatible with call site (start with `open`, `onClose`, `firmId?` as optional to compile)
    - render a minimal modal shell and return null when closed
    - no backend calls, no new libs

### Phase E - Verification
- Run:
  - `pnpm -C frontend dev` (or the repo's standard dev command)
- Confirm:
  - No "Unexpected <<" errors
  - No missing import errors
  - Vite serves localhost without 500 internal server error from import-analysis
- Add PR notes listing exactly what was changed and why.

## Acceptance Criteria
- Vite dev server boots GREEN with no pre-transform/import-analysis hard failures.
- `frontend/src/superadmin/api.ts` has zero merge markers and compiles.
- `SuperAdminLayout.tsx` imports resolve.
- `SuperAdminControlPlaneFirmDetailPage.tsx` imports resolve.
- No dependency upgrades performed.
- PR opened and references META-FE-BOOT-UNBLOCK-SUPERADMIN-001.
