# Pull Request: META-FE-BOOT-UNBLOCK-SUPERADMIN-001

## Governing Ticket
[META-FE-BOOT-UNBLOCK-SUPERADMIN-001](file:///\\wsl$\Ubuntu\home\tonycamero\code\Strategic_AI_Roadmaps\docs\meta-tickets\META-FE-BOOT-UNBLOCK-SUPERADMIN-001.md)

## Summary
Resolved the critical frontend build failures and Vite 500 errors that were blocking development work on the SuperAdmin surface. These issues were primarily caused by unresolved merge conflicts and broken/missing imports.

## Changes

### [Component: SuperAdmin API]
#### [MODIFY] [api.ts](file:///\\wsl$\Ubuntu\home\tonycamero\code\Strategic_AI_Roadmaps\frontend\src\superadmin\api.ts)
- Removed all git conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`).
- Preserved the "Stashed changes" version as the canonical implementation as it contained the most up-to-date SuperAdmin endpoints (Truth Probe, Snapshot gating).

### [Component: SuperAdmin Layout]
#### [MODIFY] [SuperAdminLayout.tsx](file:///\\wsl$\Ubuntu\home\tonycamero\code\Strategic_AI_Roadmaps\frontend\src\superadmin\SuperAdminLayout.tsx)
- Corrected the import of `SuperAdminExecuteFirmDetailPage`.
- Aligned implementation with naming canon: replaced the non-existent `./pages/SuperAdminExecuteFirmDetailPage` import with `./pages/SuperAdminControlPlaneFirmDetailPage`.

### [Component: Onboarding Stakeholders]
#### [NEW] [StakeholderModal.tsx](file:///\\wsl$\Ubuntu\home\tonycamero\code\Strategic_AI_Roadmaps\frontend\src\components\onboarding\StakeholderModal.tsx)
- Implemented a minimal placeholder component to resolve the hard-fail import in `SuperAdminControlPlaneFirmDetailPage.tsx`.
- Satisfies the call-site prop contract (`isOpen`, `onClose`, `onSubmit`, `loading`) while preventing side effects in this recovery build.

## Verification
- **Vite Stability**: Confirmed that Vite no longer throws 500 pre-transform or import-analysis errors.
- **Type Integrity**: Ran `npm run typecheck` in the `frontend` directory.
- **Routing**: Verified that `/superadmin` routes resolve correctly and main components mount without crashing.

## Governance & Compliance
- Compliant with `META-FE-BOOT-UNBLOCK-SUPERADMIN-001` goal of restoring "GREEN" state.
- Surgical fixes only; no dependency upgrades or unrelated refactors.
- Platform invariants (Authority gating) preserved.
