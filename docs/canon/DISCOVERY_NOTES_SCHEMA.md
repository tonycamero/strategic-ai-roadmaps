# Canonical Discovery Notes Schema

**Status:** Canonical (Locked)  
**Authority:** META-TICKET-DISCOVERY-TO-ROADMAP-COMPILER-LOCK-1  
**Last Updated:** 2026-01-21  
**Enforcement:** Strict Validation (Reject on Failure)

---

## 1. Purpose of Discovery Notes

Discovery Notes serve as the single, immutable point of truth ingress for the Roadmap Generation pipeline. Their sole purpose is to record the client's current reality, constraints, and stated desires without pollution from consultant intuition, solutioneering, or future-state speculation. They represent "what is" and "what is wanted," never "what will be done."

---

## 2. Discovery Sections (Ordered, Fixed)

The following sections must appear in this exact order. Any deviation renders the Discovery Note invalid.

### 2.1. Session Metadata
*   **Description:** Contextual anchoring for the discovery session.
*   **Required:** Yes
*   **Allowed Content:** Date, Attendees (Client & Consultant), Firm Name, Duration.
*   **Forbidden Content:** "Next steps," follow-up tasks, sentiment analysis.

### 2.2. Current Business Reality
*   **Description:** Factual description of the client's business model, operations, and revenue flow as they exist today.
*   **Required:** Yes
*   **Allowed Content:** Revenue figures, team structure, current workflows, product/service descriptions, "How they make money" facts.
*   **Forbidden Content:** Critiques of the model, suggestions for pivoting, "Inefficient" labels without data.

### 2.3. Primary Friction Points
*   **Description:** The specific problems, bottlenecks, and costs causing pain to the business, as articulated by the client.
*   **Required:** Yes
*   **Allowed Content:** Direct quotes, estimated hours lost, error rates, "We hate doing X," operational fires.
*   **Forbidden Content:** Diagnoses of *why* it is happening (unless client-stated), proposed fixes, "This needs an AI agent."

### 2.4. Desired Future State
*   **Description:** The explicit goals and outcomes the client wishes to achieve, irrespective of feasibility.
*   **Required:** Yes
*   **Allowed Content:** Revenue targets, "I want to stop doing X," specific metrics (e.g., "10x throughput"), qualitative lifestyle goals.
*   **Forbidden Content:** Roadmap items, specific implementation tactics, promises of delivery.

### 2.5. Technical & Operational Environment
*   **Description:** The objective constraints and assets defining the execution boundary.
*   **Required:** Yes
*   **Allowed Content:** Software stack (CRM, ERP, etc.), team capabilities, compliance requirements (HIPAA, SOC2), integration limits.
*   **Forbidden Content:** "We should switch to HubSpot," technology evaluations, architectural diagrams.

### 2.6. Explicit Client Constraints
*   **Description:** Hard boundaries set by the client regarding timeline, budget, or forbidden approaches.
*   **Required:** No (Section must exist, but can be "None stated")
*   **Allowed Content:** "Budget cap $X," "Must launch by Q3," "No offshore talent," "Do not touch the sales team."
*   **Forbidden Content:** Consultant-imposed constraints, "We can't do that" commentary.

---

## 3. Global Rules

All content within the Discovery Notes must adhere to these invariants:

### 3.1. Tone & Anchoring
*   **Factual & Historic:** Use present or past tense.
*   **Neutral Voice:** Record what was said/observed. Do not advocate or judge.
*   **Client-Centric:** Information must originate from the client or direct observation of their systems.

### 3.2. Prohibitions (Zero Tolerance)
*   **NO Solutions:** Do not write "Build a chatbot" or "Automate email."
*   **NO Roadmap Thinking:** Do not organize notes into phases, sprints, or tiers.
*   **NO AI Prescriptions:** Do not mention specific AI models, agents, or automation strategies unless the client explicitly requested them as a constraint.
*   **NO Synthesis:** Do not summarize "The problem is actually X." Record the raw symptom.

---

## 4. Immutability Clause

*   **Modification:** The schema defined in this document is **IMMUTABLE**.
*   **Authorization:** Changes requires a new **Meta Ticket** explicitly overriding `META-TICKET-DISCOVERY-TO-ROADMAP-COMPILER-LOCK-1`.
*   **Invalidation:** Any change to this schema automatically **invalidates** all downstream "Findings" objects and "Roadmaps" generated under previous versions. They must be re-compiled or archived.

---

## 5. Canonical Status Declaration

This document is the **Canonical Source of Truth** for the Discovery Notes format.
Any Discovery Note that contains fields not listed here, or violates the Prohibitions, is **Invalid Input** and must be rejected by the Findings Compiler.


---

## 6. Execution Authority Boundary

### 6.1 Discovery ≠ Completion

The existence of a valid Discovery Note:

- Does not satisfy OWNER_INTAKE.
- Does not satisfy TEAM_INTAKES.
- Does not satisfy DIAGNOSTIC.
- Does not satisfy any execution stage.

Discovery is input evidence only.

Stage state is determined exclusively by:

backend/src/services/executionTruth.service.ts

---

### 6.2 Evidence vs Authority

Discovery Notes are:

- Evidence of stated reality.
- Raw signal input to the Findings Compiler.

Discovery Notes are not:

- Authorization artifacts.
- Approval events.
- Gate satisfiers.

No downstream stage may infer readiness based on the presence of Discovery content.

---

### 6.3 Invalidation Cascade (Authority Safe)

If Discovery changes:

- Findings must be invalidated.
- Tickets derived from those findings must be invalidated.
- Roadmaps compiled from those tickets must be archived.
- ExecutionTruthService must re-evaluate all stage states.

No silent continuation is permitted.

---

### 6.4 Fail-Closed Principle

If Discovery content is malformed, incomplete, or ambiguous:

- Findings compilation must reject.
- Ticket generation must halt.
- Stage state must remain LOCKED.

Ambiguity never escalates state.


**END OF DOCUMENT**
