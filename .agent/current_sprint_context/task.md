# Task Checklist - SuperAdmin Control Plane Polish

## Meta-Ticket: CR-ROOT
**Status:** In Progress
**Focus:** Control Plane, Executive Authority, & Delegation Safety

---

## ── Phase 1: Foundation & Navigation (CR-UX-1) ──
- [x] **Control Plane Identification**
    - [x] Create distinct "Control Plane" branding/header in Layout.
    - [x] Implement "AuthorityGuard" visual indicators (e.g., Purple for Exec).
- [x] **Navigation Partitioning**
    - [x] Separate "Authority Core" (Firms, Pipeline) from "Operational Admin" (Command Center, Leads).
    - [x] Hide "Authority Core" from Operators/Agents.
- [x] **Route Protection (Patch CR-UX-1A)**
    - [x] Implement Fail-Closed guard for `/superadmin/control-plane/*`.
    - [x] Redirect unauthorized roles to legacy admin.

## ── Phase 2: Portfolio Visibility (CR-UX-2) ──
- [x] **Firms List (Control Plane Portfolio)**
    - [x] Implement high-density "Control Surface" view (not CRUD table).
    - [x] Add Executive-Only columns (Brief Status, Roadmap Lock).
    - [x] Enforce structural invisibility (columns removed from DOM for delegates).
    - [x] Add "Intake Velocity" and "Diagnostic Status" visualizers.

## ── Phase 3: Master Flow Alignment (PLANNING) ──
- [x] Memorialize `CR_UX_MASTER_FLOW.md`.
- [ ] Create `IMPLEMENTATION_PLAN_MASTER_FLOW.md` to map strict A->Z gating.
- [ ] Align Firm Detail Logic to Master Flow Steps 3-9.

## ── Phase 4: Lead-Defined Intake UX (CR-UX-2) ──
*(Aligns with Master Flow Step 3 & 5)*
- [x] **Role Definition Surface (Zone 2)**
    - [x] Create "Lead-Defined Role Configuration" card.
    - [x] Implement "Add Role Participant" flow.
    - [x] Capture "Perceived Constraints" (Management Hypotheses).


- [x] **Intake Control Gate (Step 5)**
    - [x] Add explicit "Close Intake Window" action (Executive Only).
    - [x] Enforce gate: cannot generate Diagnostic until Intake is closed.
    - [x] **Intake Freeze (CR-UX-5)**: Block submissions when window is closed.

## ── Phase 5: Executive Authority Layer (CR-UX-4) ──
*(Aligns with Master Flow Steps 6-9)*
- [x] **Executive Brief Integration (Step 6)**
    - [x] Ensure `ExecutiveBriefSurface` is visible ONLY to Executives.
    - [x] verify "Structural Invisibility" in Detail Page.
- [x] **Brief Acknowledgment Gate (Step 7)**
    - [x] Block Diagnostic Generation until Brief is ACKNOWLEDGED/WAIVED.
- [ ] **Diagnostic Release Gate (Step 9)**
    - [/] Implement "Release- [x] **Diagnostic Review & Ticket Moderation (CR-UX-6)**
    - [x] BE: Modify `ticketModeration.controller.ts` for Delegate visibility (hide rejected, sanitize notes)
    - [x] FE: Create `DiagnosticModerationSurface.tsx` (Approve/Reject UI for Execs, Read-only for Delegates)
    - [x] FE: Integrate into `SuperAdminControlPlaneFirmDetailPage.tsx`
    - [x] Verify: Ensure Delegates cannot see rejected tickets and roadmap button is gated

- [x] **Executive Authority & Sanitization (CR-UX-6A)**
    - [x] BE: Update `approve`/`reject` endpoints to allow Executives (Owner), deny Delegates.
    - [x] BE: Implement strict "Delegate-Safe DTO" in `getDiagnosticTickets` (Allow-list only).
    - [x] Verify: Update `verify_ticket_moderation.ts` to test Owner writes and Delegate payload strictness.

- [x] **Roadmap Finalization UX (CR-UX-7)**
    - [x] BE: Ensure `getFirmDetail` or similar exposes canonical gating truth (Intake, Brief, Mod Status, Roadmap Status).
    - [x] BE: Implement `finalizeRoadmap` endpoint (Status: FINALIZED, Timestamp, Author).
    - [x] FE: Create `RoadmapReadinessPanel.tsx` (Exec-only, Gated Checklist, "What's Included").
    - [x] FE: Implement Deliberate Confirmation (Type to Confirm or Distinct UI).
    - [x] FE: Implement Post-Finalization Read-Only State.
    - [x] Verify: Test Gates (Disabled when not ready), Execution (Finalize), and Visibility (Exec vs Delegate).

## ── Phase 6: Roadmap Authority (CR-UX-5) ──
*(Aligns with Master Flow Step 12)*
- [x] **Roadmap Finalization Lock**
    - [x] Ensure "Generate Final Roadmap" is irreversible.
    - [x] Add explicit confirmation/signing step.

## ── Phase 6B: Backend Immutability (CR-UX-7B) ──
- [x] **Backend Immutability & Idempotency**
    - [x] `finalizeRoadmap`: Implement Idempotency (return 200 if already finalized).
    - [x] Protect Mutation Endpoints (`upsert`, `updateStatus`, `refresh`, `sync`) -> 409 if Finalized.
- [x] **Canonical Status**
    - [x] `getFirmDetail`: Expose `latestRoadmap` field.
    - [x] Frontend: Consume `latestRoadmap` instead of array inference.
- [x] **Verification**
    - [x] Update `verify_roadmap_finalization.ts` with assertions.


## ── Phase 7: Snapshots & ROI Panel (CR-UX-8) ──
- [x] **Data Aggregation Service**
    - [x] Create `SnapshotService` to aggregate existing signals (Intake, Tickets, Moderation).
    - [x] Implement `GET /api/superadmin/snapshot/:tenantId` endpoint.
    - [x] **Backend**: Create `snapshot.controller.ts` (Aggregates without financial models)
- [x] **Backend**: Register `/snapshot` route
- [x] **Frontend**: Create `ExecutiveSnapshotPanel.tsx` (Visual friction map)
- [x] **Frontend**: Integrate into Firm Detail Page (Executive Zone)
- [x] **Verification**: Verify data mapping and permission gating (Manual Verification Approved)
    - [x] Verify Data Integrity (matches diagnostics).

---


## ── Verification & Polish ──
- [x] **Role Simulator Walkthrough**
    - [x] Verify Executive View (All Gates Open).
    - [x] Verify Delegate View (Gates Visible but Locked/Invisible).
    - [x] Verify Operator View (Access Denied).
- [ ] **End-to-End Flow Test**
- [ ] **End-to-End Flow Test**
    - [ ] "Ninkasi" Mock Run (E2E Verification Pending (Manual Run Required)).
