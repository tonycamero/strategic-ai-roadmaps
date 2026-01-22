# SuperAdmin System Audit Report
**Date:** 2026-01-07
**Scope:** Frontend `src/superadmin` & related API surface.

## A. SuperAdmin Route Inventory

| Path | Component | Purpose | Context / Protection |
| :--- | :--- | :--- | :--- |
| `/superadmin` | `SuperAdminOverviewPage` | **Command Center:** High-level dashboard for stats and quick actions. | **Public** (to all SuperAdmin roles) |
| `/superadmin/pipeline` | `EugeneCohortPage` | **Cohort Pipeline:** Kanban board for "Eugene - Q1 2026" cohort. | **Restricted:** Hidden from Operators. |
| `/superadmin/firms` | `SuperAdminFirmsPage` | **Control Plane Directory:** List active tenants with intake/diagnostic status. | **Restricted:** Redirects Operators to `/superadmin`. |
| `/superadmin/control-plane/firms/:id` | `SuperAdminControlPlaneFirmDetailPage` | **Control Plane Detail:** Decision-focused view for Executives/Delegates. | **Restricted:** Redirects Operators to `/superadmin`. |
| `/superadmin/firms/:id` | `SuperAdminFirmDetailPage` | **Legacy/Ops Detail:** Operational view with deep data edit capabilities. | **Public** (to all SuperAdmin roles). |
| `/superadmin/leads` | `SuperAdminLeadsPage` | **Leads Queue:** Manage webinar registrations. | **Public** (to all SuperAdmin roles). |
| `/superadmin/agent` | `SuperAdminAgentPage` | **Agent Tap-In:** Console to masquerade as client assistants. | **Public** (to all SuperAdmin roles). |
| `/superadmin/tenant/:id/roadmap` | `SuperAdminRoadmapViewerPage` | **Roadmap View:** Read-only view of client roadmap artifacts. | **Public** (to all SuperAdmin roles). |

**Redirects:**
- `/superadmin/cohort-pipeline` → `/superadmin/pipeline`
- `/superadmin/cohorts/eugene-q1-2026` → `/superadmin/pipeline`
- `/superadmin/roadmaps` → `/superadmin/firms`

---

## B. Screen-by-Screen Workflow Map

### 1. Command Center (`/superadmin`)
- **Entry Points:** Default Sidebar ("Command Center").
- **Primary Actions:**
  - View aggregate stats (Tenants, Roadmaps, Pilots, Cohorts).
  - Quick navigate to Leads, Pipeline, Firms, Agent.
- **Side Effects:** None (Read-only dashboard).

### 2. Cohort Pipeline (`/superadmin/pipeline`)
- **Entry Points:** Sidebar ("Cohort Pipeline").
- **Primary Actions:**
  - **Drag & Drop:** Move firms between `Prospect` → `Engaged` → `Qualified` → `Pilot Candidate` → `Pilot Active` → `No Fit`.
  - **Firm Detail Drawer:** View condensed firm details.
- **Side Effects:**
  - Writes `status` to Tenant record.
- **Hard Constraints:**
  - **HARDCODED COHORT:** Filters to `cohortLabel=EUGENE_Q1_2026`.
  - **MAX 10 PILOTS:** Hard block preventing >10 firms in `pilot_active` column (requires manual confirmation override).

### 3. Firm Directory (`/superadmin/firms`)
- **Entry Points:** Sidebar ("Firm Directory").
- **Primary Actions:**
  - Table sort/scan.
  - Click row → Navigates to **Control Plane Detail** (`/superadmin/control-plane/firms/:id`).
- **Authorization:**
  - `isOperator` → Redirects to Dashboard.
  - `isExecutive` → See "Executive Brief" and "Roadmap Authority" columns.

### 4. Control Plane Firm Detail (`/superadmin/control-plane/firms/:id`)
- **Entry Points:** Firm Directory click.
- **Primary Actions:**
  - **Zone 2 (Delegate):** "Assemble Knowledge Base", "Validate Team Roles", "Signal Executive Readiness" (Buttons appear visual-only or untethered in code scan).
  - **Zone 3 (Executive Only):** 
    - Toggle "Executive Brief" status (Pending/Ack/Waived).
    - **Execute Diagnostic Synthesis:** Triggers `generateSop01`.
    - **Finalize Strategic Roadmap:** Triggers `generateFinalRoadmap`.
- **Side Effects:**
  - Triggers AI generation jobs (SOP-01, Roadmap).
  - Reloads page on completion.

### 5. Legacy Firm Detail (`/superadmin/firms/:id`)
- **Entry Points:** URL navigation (no direct sidebar link found in "Control Plane" group, likely linked from legacy operational lists or direct access).
- **Primary Actions:**
  - **Edit Meta:** Update Status, Cohort, Segment, Region.
  - **Workflow Actions:**
    - Generate SOP-01 (Redundant with Control Plane).
    - Edit Discovery Notes.
    - Generate Roadmap (Legacy).
    - Ticket Moderation (Approve/Reject tickets).
  - **Data Management:**
    - Upload Document.
    - Export CSV/JSON.
    - View/Download generated artifacts (PDFs).

### 6. Leads Queue (`/superadmin/leads`)
- **Entry Points:** Sidebar ("Webinar Leads").
- **Primary Actions:**
  - Edit Registration Status/Notes.
  - **Update Webinar Password:** Global setting change.
- **Side Effects:**
  - Writes to `WebinarRegistration` table.
  - Rotates global webinar access password.

---

## C. Authority & Visibility Matrix

| Feature Surface | Executive | Delegate | Operator/System |
| :--- | :--- | :--- | :--- |
| **Control Plane Nav** | Visible | Visible | **Hidden** |
| **Control Plane Access** | Allowed | Allowed | **Blocked (Redirect)** |
| **Executive Brief Widget** | Read/Write | **Invisible** | **Invisible** |
| **Roadmap Authority Widget** | Read/Write | **Invisible** | **Invisible** |
| **Zone 3 (Detail Page)** | Visible | **Invisible** | **Invisible** |
| **Ticket Moderation** | Visible | Visible | Visible |
| **Firm Meta Editing** | Visible | Visible | Visible |

**Key Mechanism:** `AuthorityGuard` component returns `null` (Structural Invisibility) if `requiredCategory` is not met.

---

## D. Gating & Transition Map

### Frontend Gating
- `SuperAdminLayout` checks `useSuperAdminAuthority`.
  - **System/Agent**: Returns full-screen blocking message `AGENT_ACCESS_RESTRICTED_TO_API`.
  - **Operator**: Hides "Authority Core" sidebar section. Redirects protected routes to `/superadmin`.
- `AuthorityGuard` used inside components for granular element hiding.

### Backend Gating (Inferred from Frontend)
- `superadminApi` calls use `Bearer ${token}`.
- Specific endpoints (e.g., `generate-sop01`) likely rely on backend-side role checks matching the frontend visibility, but frontend is the primary discovery surface here.

### Critical Transitions
1.  **Lead → Prospect:** Manual status change in Leads Queue (conceptually) or Firm Directory.
2.  **Prospect → Pilot Active:** Drag-and-drop in Cohort Pipeline (Hard max 10).
3.  **Intake → Diagnostic:**
    - Triggered via "Execute Diagnostic Synthesis" (Control Plane) or "Generate SOP-01" (Legacy).
    - **Condition:** Intakes must be complete (Workflow status check).
4.  **Diagnostic → Roadmap:**
    - Triggered via "Finalize Strategic Roadmap" (Control Plane) or "Generate Roadmap" (Legacy).
    - **Condition:** "Moderate tickets above" (Legacy view warning).

---

## E. Snapshot / Metrics Surface Inventory

### 1. Command Center Statistics
- **Tenant Status Counts:** Breakdown by status.
- **Roadmap Status Counts:** Breakdown by delivery state.
- **Pilot Stage Counts:** Funnel view.

### 2. Firm-Level Metrics (`MetricsCard`)
- **Inputs:** `SnapshotInputModal` allows manual entry of:
  - `revenue_annual`
  - `fte_count`
  - `blended_rate`
  - `hiring_plan`
  - `tool_spend`
- **Computed Outputs:**
  - "Cost Per FTE"
  - "Revenue Per FTE"
  - "Estimated Efficiency Cap"

### 3. Ticket Moderation
- **Stats:** Total Tickets, Approved, Rejected, Pending.
- **Status:** Readiness for Roadmap generation.

---

## F. Orphaned or Ambiguous Behaviors

1.  **Dual Detail Pages:**
    - `SuperAdminControlPlaneFirmDetailPage` (New, authorized) and `SuperAdminFirmDetailPage` (Legacy, operational) **co-exist**.
    - Both can trigger `generateSop01`.
    - Both display status.
    - **Risk:** Inconsistent state modification if used concurrently. Legacy page allows editing "Status" dropdown freely, while Pipeline page enforces Kanban transitions.

2.  **Hardcoded Cohort:**
    - `EugeneCohortPage` hardcodes `EUGENE_COHORT = 'EUGENE_Q1_2026'`.
    - Other cohorts are effectively invisible on the pipeline board unless code is changed.

3.  **Legacy Roadmap Generation:**
    - Legacy Detail page has a "Generate Roadmap (Legacy)" button that calls `generateRoadmap`.
    - Control Plane page has "Finalize Strategic Roadmap" that calls `generateFinalRoadmap`.
    - **Ambiguity:** Are these the same process? The endpoint names differ.

4.  **Delegate Zone Buttons (Control Plane):**
    - "Assemble Knowledge Base", "Validate Team Roles", "Signal Executive Readiness" in the Control Plane detail page appear to be **UI-only** stubs. They have no `onClick` handlers in the viewed code.
