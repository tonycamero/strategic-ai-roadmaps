# Canonical Roadmap Compilation Rules

**Status:** Canonical (Locked)  
**Authority:** META-TICKET-DISCOVERY-TO-ROADMAP-COMPILER-LOCK-1  
**Last Updated:** 2026-01-21  
**Enforcement:** Strict Validation (Reject on Failure)

---

## 1. Purpose of Roadmap Compilation

Roadmap Compilation is the final, read-only assembly layer of the generation pipeline. Its sole purpose is to present `ACCEPTED` tickets in a coherent, deterministic structure without adding narrative, strategy, or consultant interpretation. It functions as a "container view" of authorized execution claims, ensuring that the final deliverable is a direct, traceable reflection of approved work units, free from hallucinated phases or unapproved "recommendations."

---

## 2. Roadmap Invariants

All Roadmaps generated within this pipeline must strictly adhere to the following invariants:

1.  **Tickets-Only Input:** The Roadmap may *only* contain data derived from `ACCEPTED` tickets. It has absolutely no access to raw Findings, Discovery Notes, or external knowledge.
2.  **Deterministic Assembly:** Given the same set of `ACCEPTED` tickets, the Roadmap compiler must produce the exact same document hierarchy and ordering every time.
3.  **No Prioritization Logic:** The Roadmap does not decide what is "important." It displays what is *authorized*.
4.  **No Speculative Content:** No "future considerations," no "Phase 2 ideas," no "nice-to-haves" that are not backed by a Ticket.
5.  **No Narrative Injection:** No introductory essays, no "strategic overview" paragraphs written by AI. The structure *is* the narrative.

---

## 3. Allowed Roadmap Sections (Fixed Order)

The Roadmap must be rendered with **only** the following sections, in this strict order.

### 3.1. Section: `Diagnostic & Audit Plane`
*   **Description:** The foundation layer. Work required to see, measure, or validate the current reality.
*   **Allowed Ticket Types:** `Diagnostic`, `ConstraintCheck`
*   **Forbidden Content:** Solutions, "Quick Wins."

### 3.2. Section: `Operational Frictions`
*   **Description:** The problem layer. Work required to remove verifiable pain points or inefficiencies.
*   **Allowed Ticket Types:** `Optimization`
*   **Forbidden Content:** "Growth Hacking," speculative features.

### 3.3. Section: `Capability Construction`
*   **Description:** The new value layer. Work required to build net-new capabilities or assets.
*   **Allowed Ticket Types:** `CapabilityBuild`
*   **Forbidden Content:** Optimization of existing broken processes (belongs in Frictions).

### 3.4. Section: `Unassigned / Backlog`
*   **Description:** A holding pen for valid but currently unplaceable or ambiguous tickets.
*   **Allowed Ticket Types:** *Any*
*   **Forbidden Content:** "Discarded" or "Rejected" items (those are filtered out upstream).

---

## 4. Ticket → Section Placement Rules

*   **Exclusive Placement:** A Ticket may appear in **one and only one** section.
*   **Type-Based Routing:** Placement is determined solely by the Ticket Class (`Diagnostic` → `section 3.1`). No "smart" classification based on text analysis.
*   **No Rewording:** The Ticket Title and Description must be rendered **verbatim** from the Ticket Object. No "contextual rewriting" for the Roadmap.
*   **Orphans:** Any ticket that does not fit firmly into sections 3.1, 3.2, or 3.3 falls into `3.4 Unassigned`.

---

## 5. Ordering Rules (Non-Prioritized)

Within each section, tickets must be ordered deterministically:

1.  **Primary Sort:** Ticket Class (Alphabetical).
2.  **Secondary Sort:** Ticket ID (Alphanumeric Ascending).

**Explicit Prohibitions:**
*   NO sorting by "Urgency" or "Impact."
*   NO grouping by "Phases" (e.g., "Month 1," "Sprint 3").
*   NO timeline visualization (Gantt charts, "Roadmap view").
*   NO visual "weighting" (bolding "important" tickets).

---

## 6. Provenance & Versioning

### 6.1. Roadmap ID Format
*   **Format:** `RMP-<CompilerVersion>-<TimestampHash>`
*   **Purpose:** Unique handle for this specific assembly of tickets.

### 6.2. Embedded Metadata
*   `sourceTicketIds`: Complete list of all Ticket IDs included in this compilation.
*   `compilerTimestamp`: ISO-8601 generation time.
*   `schemaVersion`: Version of this rule file.

### 6.3. Regeneration Rule
*   If the set of `ACCEPTED` tickets changes (addition, removal, modification), a **NEW** Roadmap must be generated with a new ID. Old Roadmaps are **archived**, never mutated.

---

## 7. Immutability & Invalidation

*   **Locked State:** A generated Roadmap is a static artifact. It cannot be "edited." To change it, you must change the upstream Tickets and re-compile.
*   **Dependency Chain:**
    *   Discovery Change → Invalidates Findings → Invalidates Tickets → Invalidates Roadmap.
*   **Downstream Usage:** Execution Agents consume the Roadmap *read-only*. They cannot write back status to the Roadmap artifact itself (status lives on the Ticket).

---

## 8. Canonical Status Declaration

This document is the **Canonical Source of Truth** for Roadmap Compilation logic.
Any Roadmap generated with timelines, prioritization, or non-ticket content is **Invalid Output** and is considered a hallucination.

**END OF DOCUMENT**
