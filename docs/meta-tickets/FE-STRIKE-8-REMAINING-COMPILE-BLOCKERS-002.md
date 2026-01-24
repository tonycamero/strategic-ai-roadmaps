# META TICKET: FE-STRIKE-8-REMAINING-COMPILE-BLOCKERS-002

## Objective
Restore strict TypeScript compilation in `frontend/` by (1) removing phantom SuperAdmin Control Plane imports/usages and (2) repairing `SuperAdminFirmDetailPage.tsx` into a valid V2-only implementation (no legacy identifiers, no undefined helpers).

## Scope (Allowed Files)
- frontend/src/superadmin/pages/SuperAdminControlPlaneFirmDetailPage.tsx
- frontend/src/superadmin/pages/SuperAdminFirmDetailPage.tsx
- frontend/src/superadmin/pages/SuperAdminLeadsPage.tsx
- frontend/src/superadmin/pages/SuperAdminOverviewPage.tsx

## Non-Negotiables
- Do NOT add new API methods.
- Do NOT create new components, utilities, hooks, or files.
- Do NOT import any missing modules.
- FirmDetailResponseV2 remains canonical; do not “patch/merge” into legacy shapes.
- If functionality depends on missing APIs, hard-disable UI section with clear message.

---

## A) P0 — SuperAdminControlPlaneFirmDetailPage.tsx
### A1. Remove phantom imports AND all usage (must fully delete)
- `../components/StrategicStakeholdersPanel`
- `../utils/stakeholderUtils`
- `../components/RoleSimulator`

Also remove any references to:
- `StrategicStakeholdersPanel`
- `getStakeholderDotColor`
- `RoleSimulator`

### A2. Fix TS6133 unused imports/state
Remove unused imports currently flagged:
- `ExecutiveSnapshotPanel`
- `BriefCompleteCard`

Remove unused state currently flagged if not rendered:
- `intakeRoles` + setter (or render it)
- `snapshotData` + setter (or render it)
- `snapshotLoading` + setter (or render it)

Rule: do not keep “future” placeholders that cause TS6133. Either render them or delete them.

---

## B) P0 — SuperAdminFirmDetailPage.tsx (structural repair)
This file is currently invalid (dozens of undefined identifiers). Fix by enforcing a minimal, working V2-only page.

### B1. Required structure
- Must use `useRoute('/superadmin/firms/:tenantId')` (or existing route used by this page)
- Must fetch firm detail via `superadminApi.getFirmDetailV2(tenantId)`
- Must define local derived aliases from `data`:
  - `const tenant = data?.tenant`
  - `const owner = data?.owner`
  - `const intakes = data?.intakes`
  - `const diagnostics = data?.diagnostics`
  - `const roadmaps = data?.roadmaps`
- Must remove any legacy helper calls that do not exist in file:
  - `fetchDocuments`
  - `fetchWorkflowStatus`
  - `handleExport`
  - `goControlPlane`
  - `openDiscoveryModal`
  - `handleSaveDiscovery`
…and any UI sections that require them.

### B2. Remove TS6133 unused vars/setters
Current tsc flags show unused:
- `data`, `error`
- `setExporting`, `setDocuments`, `setLoadingDocs`
- `setWorkflowStatus`, `setLoadingStatus`
- `setSavingDiscovery`
If the page no longer uses these, remove them entirely.

### B3. Fix TS18047 params possibly null
Guard route params:
- If `!params?.tenantId`, render a small error state and return early.

### B4. Owner role typing
If you adapt `owner` to a `User` type requiring `role`, do it locally when rendering, not by mutating response:
- `const ownerForOrgChart = owner ? { ...owner, role: 'owner' as const } : null;`
Do NOT write back into `data`.

---

## C) P1 — SuperAdminLeadsPage.tsx
tsc still flags:
- `setRegistrations` unused
- `setPasswordVersion` unused
Remove from destructuring OR use them. Prefer removal.

---

## D) P1 — SuperAdminOverviewPage.tsx
Fix TS18047 nullability:
- Replace `c.cohortLabel` and `cohort.cohortLabel` access with null-safe fallback:
  - `const label = c.cohortLabel ?? 'Unlabeled';`
  - Ensure no direct access on possibly-null objects.

---

## Verification
Run:
1) `cd frontend && pnpm exec tsc -p tsconfig.json --noEmit --pretty false`
2) `cd .. && pnpm -r build`

## Acceptance Criteria
- `frontend` tsc passes with zero errors.
- No new modules/files introduced.
- No phantom imports remain.
- `SuperAdminFirmDetailPage.tsx` compiles and renders a minimal V2 detail view (even if some sections are disabled).
