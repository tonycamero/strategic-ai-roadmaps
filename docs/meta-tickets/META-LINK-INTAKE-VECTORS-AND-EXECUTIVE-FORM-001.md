# META-TICKET v2
ID: META-LINK-INTAKE-VECTORS-AND-EXECUTIVE-FORM-001
Title: Link Intake Vectors on Submission & Implement Executive Intake Form
Owner: Tony
Authority: EXECUTIVE
Scope: FRONTEND+BACKEND
Priority: P0 (blocks demo completeness)

Context
- Stakeholder intake vectors are successfully invited, but their completion status does not sync back to the "Invite Team" dashboard.
- Executives (GM/Supervisors) are currently receiving the "Operations Intake" form, which is too granular.

Goal
1) Connect subitted intakes to their parent Intake Vectors so status pills update to "COMPLETED".
2) Implement a dedicated "Executive Intake" form (exec_sponsor role) for leadership stakeholders.

Execution Plan
PHASE 1 — Backend: Intake Linking Logic
1) Modify `backend/src/controllers/intake.controller.ts` > `submitIntake`:
   - After saving the intake, look up an `intake_vectors` record where `tenantId` matches AND `recipientEmail` matches the current `user.email`.
   - Update the found `intake_vectors` record's `intakeId` with the new intake's ID.
   - This ensures `leftJoin` in `getIntakeVectors` correctly identifies the completion status.

PHASE 2 — Backend: Map EXECUTIVE to exec_sponsor
1) Modify `backend/src/controllers/intakeVector.controller.ts` > `mapRoleTypeToUserRole`:
   - Change mapping: `EXECUTIVE` -> `exec_sponsor`.

PHASE 3 — Frontend: Executive Intake Page
1) Create `frontend/src/pages/intake/ExecutiveIntake.tsx`:
   - Design a high-level form for Executives.
   - Fields: Strategic Priorities, Growth Constraints, Organizational Blindspots, Resource Allocation, Transformation Appetite.
   - Use the same styling as `OpsIntake`.
2) Register route in `frontend/src/App.tsx`:
   - Path: `/intake/executive`
   - Component: `ExecutiveIntake`

PHASE 4 — Frontend: Redirect & Status
1) Update `frontend/src/pages/AcceptInvite.tsx`:
   - Handle `role === 'exec_sponsor'` redirect to `/intake/executive`.
2) Verify `IntakeVectorCard` now renders "Intake Complete" (green) for submitted team members.

Non-Negotiables
- Do NOT break existing Ops/Sales/Delivery intakes.
- Maintain multi-tenant isolation (always check tenantId).
- Ensure "Back to Dashboard" at end of intake works for all roles.
