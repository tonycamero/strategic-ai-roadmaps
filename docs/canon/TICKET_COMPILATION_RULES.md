# Canonical Ticket Compilation Rules

**Status:** Canonical (Locked)  
**Authority:** META-TICKET-DISCOVERY-TO-ROADMAP-COMPILER-LOCK-1  
**Last Updated:** 2026-01-21  
**Enforcement:** Strict Validation (Reject on Failure)

---

## 1. Purpose of Ticket Compilation

Ticket Compilation is the authorized bridge between the mechanical truth of Findings and the intentional action of Roadmaps. It projects static observations (`CurrentFact`, `FrictionPoint`) into discrete, executable units of work without prescribing *how* that work is done. It serves as a mechanism to name the work required to address specific findings, ensuring that no execution occurs without a traceable origin in reality.

---

## 2. Ticket Invariants

All tickets generated within this pipeline must strictly adhere to the following invariants:

1.  **One-Way Derivation:** Tickets flow exclusively from Findings. A ticket cannot exist without at least one parent Finding.
2.  **Explicit Traceability:** Every ticket must cite the specific `findingId(s)` that justify its existence.
3.  **No Hidden Inputs:** Tickets cannot be generated based on "best practices," "consultant intuition," or external knowledge not present in the Findings Object.
4.  **Problem-First:** Tickets define the *problem space* to be solved, not the *solution design*.
5.  **No Dependency Inference:** Logic linking tickets (e.g., "A blocks B") is forbidden at this layer. Tickets are atomic claims on execution.
6.  **Non-Lossy Reference:** The ticket must accurately reflect the scope of the referenced finding(s) without expanding or reducing it arbitrarily.

---

## 3. Allowed Ticket Types (Closed Set)

The Ticket Compiler may **only** generate tickets of the following classes.

### 3.1. Class: `Diagnostic`
*   **Description:** A unit of work to analyze, audit, or deeply investigate a specific friction point or gap.
*   **Allowed Source Findings:** `FrictionPoint`, `CurrentFact` (with ambiguous data)
*   **Required Fields:** `title`, `findingIds`, `investigationScope`
*   **Optional Fields:** `requiredAccess`
*   **Forbidden Fields:** `solutionProposal`, `implementationPlan`

### 3.2. Class: `Optimization`
*   **Description:** A unit of work to improve an existing process, metric, or workflow identified as inefficient.
*   **Allowed Source Findings:** `FrictionPoint`, `Goal`
*   **Required Fields:** `title`, `findingIds`, `targetOutcome`
*   **Optional Fields:** `currentMetric`
*   **Forbidden Fields:** `toolSelection`, `vendorPreference`

### 3.3. Class: `ConstraintCheck`
*   **Description:** A unit of work to validate or satisfy a hard constraint (e.g., regulatory compliance, budget audit).
*   **Allowed Source Findings:** `Constraint`, `CurrentFact`
*   **Required Fields:** `title`, `findingIds`, `validationCriteria`
*   **Optional Fields:** `regulatoryReference`
*   **Forbidden Fields:** `workaroundStrategy`

### 3.4. Class: `CapabilityBuild`
*   **Description:** A unit of work to establish a new operational capability required to meet a stated goal.
*   **Allowed Source Findings:** `Goal`, `CurrentFact` (identifying a gap)
*   **Required Fields:** `title`, `findingIds`, `capabilityDefinition`
*   **Optional Fields:** `successMetric`
*   **Forbidden Fields:** `specificArchitecture`, `UIWireframes`

---

## 4. Finding → Ticket Mapping Rules

*   **Cardinality:** A ticket may reference **1 to N** findings, provided they are thematically related (e.g., three friction points about "slow invoicing").
*   **Mixed Types:** Tickets may reference mixed finding types (e.g., a `FrictionPoint` coupled with a `Constraint`) if the work addresses both.
*   **Orphan Prohibition:** Any ticket with `findingIds: []` (empty list) is **INVALID**.
*   **No "Pattern" Generation:** Tickets cannot be generated from "implied patterns." If the client didn't say it (resulting in a finding), you cannot ticket it.

---

## 5. Scope & Authority Rules

*   **Declared Scope:** The ticket's `title` and `description` must strictly encompass the content of the referenced findings.
*   **Out-of-Scope Discoveries:** If a finding exists but no approved Ticket Type fits (e.g., "Personal grievance"), it remains an unticketed Finding. It is *not* forced into a ticket.
*   **Conflict Representation:** If two findings conflict (e.g., "Want to save money" & "Want premium tool"), the ticket must represent the *conflict* as the unit of work (e.g., `Diagnostic: Resolve Budget vs. Tooling Conflict`), not choose a winner.

---

## 6. ID, Provenance & Approval Requirements

### 6.1. Ticket ID Format
*   **Format:** `TCK-<FindingHashPrefix>-<Type>-<Index>`
*   **Purpose:** Ensures partial determinism and immediate visual link to source.

### 6.2. Provenance
*   **Required Metadata:**
    *   `findingIds`: Array of strings.
    *   `schemaVersion`: Version of this rule file used at generation time.
    *   `compilerTimestamp`: ISO-8601 timestamp.

### 6.3. Approval Gates
*   A ticket is merely a **proposal** until accepted.
*   Status flows: `PROPOSED` → `ACCEPTED` (Roadmap candidate) or `REJECTED` (Archived).

---

## 7. Immutability & Invalidation

*   **Locking:** Once a ticket references `ACCEPTED` findings, its core definition (Title, Findings Links) is **LOCKED**.
*   **Invalidation:** If a source Finding is invalidated (due to Discovery change), the Ticket is explicitly **INVALIDATED** and flagged for review.
*   **Roadmap Relation:** Only `ACCEPTED` tickets may be candidates for Roadmap compilation.

---

## 8. Canonical Status Declaration

This document is the **Canonical Source of Truth** for Ticket Compilation logic.
Any ticket generated without explicit Finding traceability, or containing solutioneering/prioritization logic, is **Invalid Input** and must be rejected before Roadmap usage.

---

## 9. Execution Gate Anchor (Authority Boundary)

### 9.1 Ticket Acceptance ≠ Stage Completion

The status `ACCEPTED` means:

- The ticket is authorized as a valid unit of work.
- The ticket may be considered for Roadmap compilation.

It does NOT mean:

- The Diagnostic stage is COMPLETE.
- The Roadmap stage is READY.
- The system may advance execution state.

Stage transitions are governed exclusively by:

backend/src/services/executionTruth.service.ts

---

### 9.2 Stage Saturation Requirement

The existence of one or more `ACCEPTED` tickets does not satisfy the DIAGNOSTIC stage.

Diagnostic stage is COMPLETE only when:

1. Required Diagnostic-class tickets have been generated.
2. Required non-diagnostic tickets (if mandated by stage contract) are resolved.
3. Operator authority confirms sufficiency.
4. No blocking clarification or invalidation signal exists.

Ticket quantity is irrelevant.
Authority confirmation is mandatory.

---

### 9.3 Roadmap Eligibility Gate

A ticket may only be included in a Roadmap if:

- Status = ACCEPTED
- Ticket is not INVALIDATED
- Source Findings remain valid
- ExecutionTruthService confirms DIAGNOSTIC stage COMPLETE

If Diagnostic stage is not COMPLETE, Roadmap compilation must fail closed.

---

### 9.4 Acceptance Authority Rule

Transition from PROPOSED → ACCEPTED must be:

- Explicit
- Persisted
- Audit-traceable

Implicit acceptance (e.g., bulk toggles, UI inference) is forbidden.

---

### 9.5 Atomic Authority Principle

Tickets represent atomic execution claims.

Authority over the Ticket does not imply authority over the Stage.

Stage authority must be independently verified through ExecutionTruthService.

---

### 9.6 Supersession Behavior

If a referenced Finding is invalidated:

- Ticket must transition to INVALIDATED.
- Ticket cannot remain ACCEPTED silently.
- ExecutionTruthService must re-evaluate downstream stage state.

No silent drift permitted.


**END OF DOCUMENT**
