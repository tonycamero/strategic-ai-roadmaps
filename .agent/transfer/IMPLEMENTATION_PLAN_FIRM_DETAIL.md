# Firm Detail Page - Implementation Plan (Greenfield)
**Status:** COMPLETED
**Target:** `SuperAdminControlPlaneFirmDetailPage.tsx`

## Phase 1: Scaffold & Data (Completed)
- [x] Create generic layout shell.
- [x] Define TypeScript interfaces (extending existing ones).
- [x] Fetch data via `superadminApi.getFirmDetail`.
- [x] Handle Loading/Error states.
- [x] Implement "Role Simulator" for dev verification.

## Phase 2: Visual Zoning (Completed)
- [x] **Header Zone:** Firm Identity, Client Context (High-level metadata).
- [x] **Zone 1 (Shared):** Team List, Intake Status (Visual progress bars).
- [x] **Zone 2 (Delegate):** Pre-analysis tasks (Placeholders/Buttons).
- [x] **Zone 3 (Executive - Structural Invisibility):**
  - [x] `AuthorityGuard` wrapper.
  - [x] **Executive Brief:** Status indicator, Edit/View toggle (Mock/Real).
  - [x] **Diagnostic Synthesis:** Gating logic (Locked if Brief not ACK).
  - [x] **Roadmap Finalization:** Gating logic (Locked if Tickets not Moderated).

## Phase 3: Integration (Completed)
- [x] Wire `handleExecuteDiagnostic` to API.
- [x] Wire `handleFinalizeRoadmap` to API.
- [x] Implement "Fail-Closed" disabling of buttons based on backend status.
- [x] Ensure real-time status reflection (e.g. "Pending Moderation" warning).

## Phase 4: Refinement (Current State)
- [x] Apply "Dark Premium" aesthetics.
- [x] Fix Lint errors.
- [x] Verify Structural Invisibility via Simulator.
