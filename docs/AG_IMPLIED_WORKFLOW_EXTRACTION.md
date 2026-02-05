# Forensic Extraction of AG’s Implied End-to-End Workflow

**Ticket ID**: META-AG-WORKFLOW-EXTRACTION-001  
**Title**: Forensic Extraction of AG’s Implied End-to-End Workflow  
**Mode**: EXTRACTION ONLY — NO CHANGES

---

## 1. Actors
*   **Super Admin (Operator)**: The primary controller of the platform. Manages firm accounts, triggers artifact generation (Brief/Diagnostic), locks/closes intake windows, and delivers final artifacts.
*   **Strategic Owner (Executive Lead)**: The primary individual at the Firm. Responsible for the initial "Owner Intake" and serves as the recipient of the Executive Brief and Diagnostic.
*   **Stakeholder**: Firm members invited to provide specific qualitative/quantitative feedback via Intake Vectors.
*   **System (Lifecycle Truth / TruthProbe)**: The automated authority that calculates the state of the workflow based on data availability and completion heuristics.
*   **AI Agents (Interpretive/Synthesis)**: Backend services that process intake data to produce Narratives (Briefs) and Technical Evaluations (Diagnostics).

---

## 2. Inputs
*   **Intake Vector Responses**: Qualitative answers provided by Stakeholders. Accepted once the individual submits their form. Can be updated only while the **Intake Window** is `OPEN`.
*   **Discovery Notes / Strategic Framing**: Contextual text entered manually by the Super Admin to guide the AI synthesis. Accepted and supplementable up until the **Executive Brief** is `APPROVED`.
*   **Coaching Feedback**: Specific manual corrections or refinements provided by the Super Admin to the AI-generated outputs. Accepted during the `DRAFT` phase of artifacts.
*   **Firm Metadata**: Cohort, Market, and Scale data provided during firm creation. Immutable once the workflow reaches the **Diagnostic** stage (by convention/UI constraint).

---

## 3. Artifacts
*   **Intake**:
    *   **Derived From**: Stakeholder responses.
    *   **Mutability**: Mutable while `OPEN`. Immutable once `LOCKED` or `CLOSED`.
    *   **State Transitions**: Triggers `READY` state for **Executive Brief** when `CLOSED` or `SUFFICIENT`.
*   **Executive Brief**:
    *   **Derived From**: Intake data + Discovery Notes + System Heuristics.
    *   **Mutability**: Mutable (regeneratable/editable) while in `DRAFT` or `APPROVED`. Immutable/Frozen once `DELIVERED`.
    *   **State Transitions**: Triggers `READY` state for **Diagnostic** when state reaches `APPROVED`, `DELIVERED`, or `REVIEWED`.
*   **Diagnostic**:
    *   **Derived From**: Intake data + Executive Brief approved narrative.
    *   **Mutability**: Mutable until final delivery/roadmap anchoring.
    *   **State Transitions**: Triggers `READY` state for **Roadmap Publication**.

---

## 4. State Transitions
**Intake Window**:
*   `OPEN` -> `LOCKED`: Explicit (Super Admin action). Freezes new responses but keeps the window conceptually open for processing.
*   `LOCKED` -> `CLOSED`: Explicit (Super Admin action). Terminal state for intake.
*   `CLOSED` -> `OPEN`: **UNKNOWN** (Reversibility is not explicitly exposed as a standard operation in the Control Plane).

**Executive Brief**:
*   `DRAFT`: Implicit (Created upon generation).
*   `APPROVED`: Explicit (Super Admin sign-off). Reversible (can revert to draft).
*   `DELIVERED`: Explicit (Super Admin delivery event). Terminal/Frozen.
*   `REVIEWED`: Explicit (Client/Lead acknowledgement).

**Diagnostic**:
*   `PENDING`: Implicit (No data exists).
*   `GENERATED`: Implicit (Calculated based on existence of artifact data in DB).
*   `DELIVERED`: Explicit (Super Admin action).

---

## 5. Gating Logic
*   **Executive Brief Generation**:
    *   **Must be True**: Intake must be `CLOSED` or `truthProbe.intake.sufficiencyHint` must be `COMPLETE`.
    *   **Blocked until Completed**: Diagnostic generation and Roadmap publication.
*   **Diagnostic Generation**:
    *   **Must be True**: Executive Brief must be `APPROVED`, `DELIVERED`, or `REVIEWED`.
    *   **Blocked until Completed**: Final Client Roadmap presentation.

---

## 6. Authority & Decision Points
*   **Authority Over State**: `TruthProbe` (System). Human judgment overrides are primarily enacted via state-changing actions (Generate, Approve, Deliver).
*   **Human Judgment (Super Admin)**: Expected at **Approval** (Brief/Diagnostic quality check) and **Discovery Ingress** (Framing).
*   **Human Judgment (Firm)**: Expected at **Intake** (Data provision) and **Acknowledgement** (Brief/Diagnostic receipt).
*   **System Automation**: Derivation of summary statistics, generation of narrative sections, and calculation of "Divergence" between data streams.

---

## 7. Assumptions
1.  **TruthProbe Seniority**: I assume that `truthProbe` results represent the "Single Brain" and that legacy database fields (like `tenant.executionPhase`) are eventually-consistent caches rather than direct authorities.
2.  **Linear Progression**: I assume a waterfall progression (Intake -> Brief -> Diagnostic). Although some steps can overlap, the gating logic assumes a strict dependency chain for generation.
3.  **Owner Priority**: I assume the "Strategic Owner" intake is mathematically or semantically required for the Brief, whereas other stakeholders are supplementary.
4.  **Audit Permanence**: I assume that the `deliveryAudit` is evidence of a legal/contractual fulfillment event, making artifacts immutable after that point.

---

## 8. Confidence Declaration
> “This represents my current understanding of the system. I acknowledge this model may be incomplete or incorrect.”
