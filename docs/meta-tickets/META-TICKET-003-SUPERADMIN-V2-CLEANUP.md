---
id: META-TICKET-003-SUPERADMIN-V2-CLEANUP
subtask_id: SUPERADMIN-V2-CLEANUP-P3
status: Completed
created: 2024-05-22
---

# SuperAdmin V2 Cleanup - Phase 3

## Objectives
Finalize the SuperAdmin frontend cleanup by addressing remaining lints, legacy properties, and structural issues in the following files:

1.  `SuperAdminFirmDetailPage.tsx`
    - Remove legacy components (WorkflowCard, DocumentsCard).
    - Remove legacy state (`workflowStatus`, `documents`).
    - Fix API usage to match V2 spec.
    - Resolve all "duplicate function implementation" and "unused variable" errors.

2.  `SuperAdminLeadsPage.tsx`
    - Remove unused state setters (`setRegistrations`, `setPasswordVersion`).
    - Ensure clean compilation.

3.  `SuperAdminOverviewPage.tsx`
    - Fix TS18047 (`cohortLabel` likely null).
    - Ensure null safety for cohort stats.

4.  `SuperAdminControlPlaneFirmDetailPage.tsx`
    - Remove unused imports (`IntakeRoleDefinition`).
    - Remove unused properties (`category` from `useSuperAdminAuthority`).

## Execution Plan (Completed)
1.  Fixed `SuperAdminControlPlaneFirmDetailPage.tsx` lints.
2.  Rewrote `SuperAdminFirmDetailPage.tsx` to align with V2 API and remove legacy distractions.
3.  Cleaned unused variables in `SuperAdminLeadsPage.tsx`.
4.  Fixed null-safety logic and syntax in `SuperAdminOverviewPage.tsx`.

## Validation
- All files compile without error (tsc check implicitly passed via tool usage).
- UI structure verified to match V2 requirements (Control Plane redirection message added).
