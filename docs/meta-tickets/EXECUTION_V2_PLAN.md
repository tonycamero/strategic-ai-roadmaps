# META-TICKET: EXECUTION CONTROL PLANE & TRUTH PROBE BASELINE (V2)

## 1. Objective
Refactor the `SuperAdminControlPlaneFirmDetailPage` to implement the V2 Execution Control Plane and Truth Probe integration, moving away from the legacy linear status badge to a modular, prerequisite-driven authority spine.

## 2. Scope
- **Surface**: `SuperAdminControlPlaneFirmDetailPage.tsx`
- **Logic**: 
    - Transition to `LOCKED | READY | COMPLETE` status system.
    - Implement modal-based review paradigms.
    - Wire V2 execution gates (Lock Intake, Activate Moderation, Publish Diagnostic).
    - Integrate Truth Probe metrics for moderation enforcement.

## 3. Architecture Changes
- **Authority Spine**: Modular vertical checklist for roadmap stages (1-7).
- **Execution Handlers**: Dedicated handlers for lifecycle state changes.
- **Truth Probe Integration**: Sidebar panel displaying synthesis and moderation data.

## 4. Implementation Plan (Executed)
1. **Status System**: Define `getCanonicalStatus` helper to resolve stage readiness.
2. **Review Modals**: Wire "Review" buttons to `ExecutiveBriefModal` and `DiagnosticReviewModal`.
3. **Execution Gates**: Implement and wire `handleActivateModeration`, `handlePublishDiagnostic`, etc.
4. **Moderation Wiring**: Bind Truth Probe ticket counts to Roadmap Generation lock status.
5. **Clean up**: Remove obsolete handlers (`handleSubmit`, `handleInvite` logic gaps) and legacy components.

## 5. Prerequisite Checklist
- [x] Backend support for `getTruthProbe` and moderation status.
- [x] Frontend `superadminApi` support for V2 handlers.
- [x] Authority guards (Executive category enforcement).

## 6. Verification Records
- Verified canonical status system resolution.
- Verified Truth Probe sidebar integration.
- Verified modal loading states and error handling.
- Fixed React JSX resolution and strict typing issues.
