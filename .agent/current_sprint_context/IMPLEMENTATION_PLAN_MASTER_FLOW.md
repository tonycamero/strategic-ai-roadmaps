# IMPL PLAN: SuperAdmin Control Plane Master Flow Alignment

## Purpose
This document maps the **CR-UX Master Flow (Steps 3-12)** to concrete implementation tasks within the `SuperAdminControlPlaneFirmDetailPage`.

## 1. Context & Zoning Re-Alignment
Current implementation has distinct Zones (1, 1.5, 2, 3). We must align these zones to the Master Flow stages.

| Master Flow Stage | Implementation Zone | Component / Feature |
| :--- | :--- | :--- |
| **3. Lead-Defined Roles** | Zone 1.5 (Ops Context) | `LeadDefinedRoleCard` (New) |
| **4. Team Intakes** | Zone 1.5 (Ops Context) | `IntakeStatusCard` (Enhance) |
| **5. Intake Closure** | Zone 2 (Delegation) | `IntakeGateControl` (New) |
| **6. Exec Brief** | Zone 3 (Exec Authority) | `ExecutiveBriefSurface` (Existing) |
| **7. Brief Ack** | Zone 3 (Exec Authority) | `BriefAckGate` (Enhance) |
| **8. Diagnostic** | Zone 2 (Delegation) | `DiagnosticViewer` (New/Enhance) |
| **9. Diag Release** | Zone 2 (Delegation) | `DiagnosticReleaseGate` (New) |

## 2. Component Specifications

### 2.1 Lead-Defined Role Configuration (Zone 1.5)
**Status:** Missing
**Requirement:** Allow adding semantic roles instead of just listing users.
**Logic:**
- Input: Role Label (e.g., "Ops Lead")
- Input: Perceived Constraint (Text)
- Input: Email (Optional at start)
- Output: Creates `IntakeInvitation` record with `role_definition` payload.

### 2.2 Intake Closure Gate (Zone 2)
**Status:** Missing
**Requirement:** Explicit "Close Intakes" button.
**Logic:**
- Visible to: Executive & Delegate (Delegates can *prepare* closure, Execs *finalize*? No, Master Flow says Exec Only).
- **Correction:** Master Flow Step 5 says **Executive Only**.
- Action: Sets `intake_status: CLOSED`.
- Invariant: Cannot proceed to Step 8 (Diagnostic) if `intake_status != CLOSED`.

### 2.3 Executive Brief Surface (Zone 3)
**Status:** Partially Implemented
**Requirement:** Strict invisibility.
**Logic:**
- Wrapped in `AuthorityGuard(EXECUTIVE)`.
- If `intake_status != CLOSED`, Brief is entering "Draft" mode but cannot be Finalized?
- **Correction:** Brief draws from Intakes. It implies Intakes should be closed, OR Brief captures dynamic signal.
- **Decision:** Brief can be drafted anytime, but **Acknowledgment (Step 7)** is the hard gate for Diagnostic.

### 2.4 Diagnostic Release Gate (Zone 2)
**Status:** Missing
**Requirement:** Mechanism to "Publish" the diagnostic.
**Logic:**
- Generated Diagnostic is visible to SuperAdmins.
- Action: "Release to Ticket Moderation".
- Gating: Ticket Moderation UI is disabled/hidden until `diagnostic_status == RELEASED`.

## 3. Implementation Sequence

### Ticket CR-UX-3 (Intake Logic)
1. Add `IntakeGateControl` to Zone 2.
2. Implement `LeadDefinedRoleCard` in Zone 1.5.
3. Wire "Close Intake" action to backend.

### Ticket CR-UX-4 (Authority Gates)
1. Enforce: `ExecutiveBriefSurface` requires `intake_status == CLOSED` to be Acknowledged? (Optional, but recommended for data stability).
2. Enforce: `DiagnosticGeneration` button DISABLED until `brief_status == ACKNOWLEDGED`.
3. Add `DiagnosticReleaseControl` to allow transition to Moderation.

### Ticket CR-UX-5 (Roadmap Authority)
1. Enforce: `RoadmapGeneration` button DISABLED until `tickets_moderated == TRUE`.
2. Add "Finalize Roadmap" locking mechanism.

## 4. Immediate Next Step
Execute **Ticket CR-UX-3** to build the Intake Configuration and Closure mechanics.
