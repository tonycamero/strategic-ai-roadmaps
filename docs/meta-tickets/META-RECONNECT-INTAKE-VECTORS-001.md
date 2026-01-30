# META-TICKET v2
ID: META-RECONNECT-INTAKE-VECTORS-001
Title: Reconnect Intake Vectors (Stakeholder/Vector Lens) end-to-end in Tenant Portal
Owner: Tony
Authority: EXECUTIVE
Scope: FRONTEND+BACKEND (Tenant Portal only; SuperAdmin unaffected unless shared components)
Non-Negotiables:
- Do NOT invent new UX flows. Restore the real, existing Intake Vector logic already present.
- Keep Journey Tracking derivation logic intact.
- Must not break public pages or other onboarding steps.
- Fail-closed: if API fails, show an inline error and do not mutate local state optimistically.

Goal
Tenant Portal “Invite Team / Define Strategic Vectors” must allow:
1) Create an Intake Vector (stakeholder role definition)
2) Edit/Update an Intake Vector
3) Send Invite for an Intake Vector
4) List vectors reliably on refresh
Remove the “Phase D Placeholder” modal and restore functional stakeholder creation.

Current Symptom
- /invite-team shows “No stakeholders defined”
- “Add Stakeholder” opens placeholder modal (Create Stakeholder Locked)
- Backend endpoints exist and return 200 with { vectors: [] }
- UI is blocked because modal is stubbed, not because API is missing

Primary Files Identified
Frontend:
- frontend/src/pages/InviteTeam.tsx
- frontend/src/components/onboarding/StakeholderModal.tsx  (currently placeholder)
- frontend/src/components/onboarding/IntakeVectorCard.tsx
- frontend/src/lib/api.ts  (tenant api object)
Backend:
- backend/src/routes/tenants.routes.ts
- backend/src/controllers/intakeVector.controller.ts
- backend/src/db/schema.ts (intake_vectors table + types)

Execution Plan
PHASE 0 — Guardrails & Baseline
1) Create a working branch. (Simulated)
2) Confirm both servers run. (User managed)
3) Capture baseline behavior of /invite-team placeholder modal.

PHASE 1 — Verify Real API Surface (Tenant)
1) Inspect frontend tenant api for vector methods in `frontend/src/lib/api.ts`.
2) Confirm exact backend routes.
3) Confirm auth expectations (Bearer token).

PHASE 2 — Replace Placeholder StakeholderModal with Real Form
1) Rewrite `frontend/src/components/onboarding/StakeholderModal.tsx`.
2) Implement controlled form fields for `createIntakeVector` payload.
3) Add client-side validation.
4) Support CREATE and EDIT modes.

PHASE 3 — Wire Modal into InviteTeam.tsx (Tenant Portal)
1) Open `frontend/src/pages/InviteTeam.tsx`.
2) Verify query/mutations.
3) Fix handler hookup.
4) Ensure query invalidations use the correct key.
5) Ensure empty state CTA works.
6) Handle "Continue Onboarding" gating.

PHASE 4 — Ensure IntakeVectorCard renders real data + actions
1) Confirm response shape matches.
2) Render label, constraints, status, and actions (Edit, Send Invite).

PHASE 5 — Backend Failures & Edge Conditions (No new features)
1) Handle `intakeWindowState === FINALIZED`.
2) Handle API errors (401, 403, 500).

PHASE 6 — Acceptance Tests (Manual)
1) Verify empty state.
2) Verify create vector.
3) Verify edit vector.
4) Verify send invite.
5) Verify no console errors.
