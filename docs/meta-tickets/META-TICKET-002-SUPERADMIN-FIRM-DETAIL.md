# META TICKET: FE-STRIKE-8-CONTROLPLANE-V2-COMPILE-001

## Objective
Restore strict TypeScript compilation for SuperAdmin Control Plane and legacy Firm Detail surfaces by removing phantom UI modules and legacy field assumptions, and by enforcing FirmDetailResponseV2 contract usage without mutating V2 objects into legacy shapes.

## Scope (Allowed Files)
- frontend/src/superadmin/pages/SuperAdminControlPlaneFirmDetailPage.tsx
- frontend/src/superadmin/pages/SuperAdminFirmDetailPage.tsx
- frontend/src/superadmin/pages/SuperAdminFirmsPage.tsx
- frontend/src/superadmin/pages/SuperAdminLeadsPage.tsx
- frontend/src/superadmin/pages/SuperAdminOperatorExecutionPage.tsx
- frontend/src/superadmin/pages/SuperAdminOverviewPage.tsx

## Non-Negotiables
- Do NOT add new API methods.
- Do NOT create new components or utilities.
- Remove/disable UI sections that depend on missing modules or non-existent V2 fields.
- FirmDetailResponseV2 must remain canonical; no re-mapping into legacy shapes.

## Required Fixes

### A) SuperAdminControlPlaneFirmDetailPage.tsx (P0)
1) Remove phantom imports and all usage:
   - ../components/StrategicStakeholdersPanel
   - ../utils/stakeholderUtils
   - ../components/RoleSimulator
   - StakeholderModal
   - useAuth
2) Replace/Remove legacy fields that do not exist in FirmDetailResponseV2:
   - latestRoadmap => roadmaps.lastRoadmap
   - tenant.intakeWindowState => remove UI references (derive from intakes if needed)
   - tenant.executiveBriefStatus => remove UI references (derive from onboarding steps if available, else remove)
   - tenant.executionPhase => remove UI references
3) Fix status compare:
   - Remove or replace any comparison to "active" with valid V2 statuses (e.g., "pilot_active")
4) Fix handler types:
   - Any prop requiring () => Promise<void> must receive an async function (wrap sync handler in async).

### B) SuperAdminFirmDetailPage.tsx (P1)
1) Remove any setState merge that produces non-V2 tenant shapes.
   - setFirmDetail must only be assigned FirmDetailResponseV2 or null.
   - Any local UI edits must go into separate component state (draft fields), not into FirmDetailResponseV2.
2) Resolve User.role requirement:
   - Either update receiving prop type to accept owner shape, OR inject a valid role field when adapting owner into User.

### C) Cleanup compile blockers (P2)
- Remove TS6133 unused vars:
  - SuperAdminFirmsPage.tsx: isDelegate
  - SuperAdminLeadsPage.tsx: setRegistrations, setPasswordVersion, registrationId
  - SuperAdminOperatorExecutionPage.tsx: synthesis
  - SuperAdminOverviewPage.tsx: stage
- Fix TS18047 null issues in SuperAdminOverviewPage.tsx using null-safe access or fallback strings.

## Verification
Run:
1) cd frontend && pnpm exec tsc -p tsconfig.json --noEmit --pretty false
2) cd .. && pnpm -r build

## Acceptance Criteria
- frontend tsc passes with zero errors.
- pnpm -r build passes.
- No new API methods, no new files, no new module imports introduced.
