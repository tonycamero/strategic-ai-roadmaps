# META-TICKET: SuperAdmin UI Polish & Cleanup (P2)

## Context
We are polishing the SuperAdmin frontend to eliminate React warnings, unused variables, and potential null-pointer exceptions before the V2 release.

## Scope
1.  **SuperAdminFirmDetailPage.tsx**:
    *   Transition `handleUpdateTenant` to use V2 pattern (refresh after update instead of optimistic local patch).
    *   Start using `refreshFirmDetail` pattern.
    *   Resolve `User.role` requirement in OrgChart mock.
2.  **Cleanup Compile Blockers**:
    *   Remove unused variables (TS6133) in:
        *   `SuperAdminFirmsPage.tsx`
        *   `SuperAdminLeadsPage.tsx`
        *   `SuperAdminOperatorExecutionPage.tsx`
        *   `SuperAdminOverviewPage.tsx`
    *   Fix potential null property access (TS18048) in `SuperAdminOverviewPage.tsx`.

## Constraints
*   Do not change business logic.
*   Keep existing "Action disabled" guards for unimplemented methods.
