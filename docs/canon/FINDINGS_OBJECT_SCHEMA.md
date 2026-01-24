# Canonical Findings Object Schema

**Status:** Canonical (Locked)  
**Authority:** META-TICKET-DISCOVERY-TO-ROADMAP-COMPILER-LOCK-1  
**Last Updated:** 2026-01-21  
**Enforcement:** Strict Validation (Reject on Failure)

---

## 1. Purpose of the Findings Object

The Findings Object serves as the **sole intermediate representation (IR)** for the Roadmap Generation pipeline. It acts as a strictly mechanical extraction of discrete data points from the raw Discovery Notes. Its purpose is to atomize the narrative of Discovery into a queryable, deterministic dataset without adding interpretation, synthesis, or solutioneering. It is the "Abstract Syntax Tree" of the client's current reality.

---

## 2. Findings Object Invariants

The Findings Object must strictly adhere to the following invariants:

1.  **Determinism:** The same Discovery Notes must always produce the exact same Findings Object.
2.  **Traceability:** Every finding must be explicitly linked to a specific section and line item in the Discovery Notes.
3.  **Non-Lossy:** All structural facts from Discovery must be represented; nothing "boring" is discarded.
4.  **No Semantic Enrichment:** No new adjectives, no rewritten summaries, no added "insights."
5.  **No Synthesis:** Findings are atomic. Do not combine two separate discovery points into one "compound" finding.
6.  **No Validity Judgment:** The Findings Object records what was *said*, not whether it is *true* or *smart*.

---

## 3. Findings Entity Types (Fixed Set)

The Findings Object may **only** contain entities of the following types.

### 3.1. Entity: `CurrentFact`
*   **Description:** An objective, verifiable statement about the client's existing business, operations, or tech stack.
*   **Source Sections:** `Current Business Reality`, `Technical & Operational Environment`
*   **Required Fields:** `description` (verbatim substring), `sourceSection`
*   **Optional Fields:** `metricValue`, `metricUnit` (only if explicitly stated)
*   **Forbidden Fields:** `opinion`, `efficiencyRating`, `riskLevel`

### 3.2. Entity: `FrictionPoint`
*   **Description:** A stated problem, pain point, bottleneck, or cost center.
*   **Source Sections:** `Primary Friction Points`
*   **Required Fields:** `painDescription` (verbatim substring), `sourceSection`
*   **Optional Fields:** `statedCost`, `frequency`
*   **Forbidden Fields:** `rootCause` (unless stated by client), `severityScore`, `proposedFix`

### 3.3. Entity: `Goal`
*   **Description:** A stated desired outcome or future state target.
*   **Source Sections:** `Desired Future State`
*   **Required Fields:** `goalDescription` (verbatim substring), `sourceSection`
*   **Optional Fields:** `targetMetric`, `targetDate`
*   **Forbidden Fields:** `feasibilityScore`, `roadmapPhase`, `strategy`

### 3.4. Entity: `Constraint`
*   **Description:** A hard boundary or limitation on execution.
*   **Source Sections:** `Explicit Client Constraints`, `Technical & Operational Environment`
*   **Required Fields:** `constraintDescription` (verbatim substring), `sourceSection`
*   **Optional Fields:** `category` (Budget, Timeline, Technical, Regulatory)
*   **Forbidden Fields:** `workaround`, `negotiability`

---

## 4. ID & Traceability Rules

Every finding item within the object must possess:

### 4.1. Unique Identifier (`findingId`)
*   **Format:** `FND-<SessionDate>-<SectionHash>-<Index>`
*   **Rule:** IDs must be deterministic. Re-running extraction on the same text produces the same IDs.

### 4.2. Source Reference (`sourceRef`)
*   **Required:**
    *   `sectionName`: The exact Discovery Note section header.
    *   `sourceTextHash`: A short hash of the snippet to detect drift.
*   **Prohibition:** No composite IDs. One finding = One source. Merging is forbidden.

---

## 5. Transformation Rules (Discovery → Findings)

*   **Extraction over Abstraction:** If the client says "We spend 10 hours on X," the finding is `painDescription: "We spend 10 hours on X"`. It is NOT `painDescription: "High labor cost on X"`.
*   **Atomic Splitting:** A sentence like "We hate invoicing because it takes too long and errors are high" must be split into:
    1.  `FrictionPoint`: "Invoicing takes too long"
    2.  `FrictionPoint`: "Errors are high"
*   **No Inference:** If a constraint is implied but not stated, it is **not a finding**.
*   **Verbatim Preference:** When in doubt, copy-paste the substring.

---

## 6. Immutability & Invalidation

*   **Finality:** Once generated and persisted, a Findings Object is **IMMUTABLE**.
*   **Upstream Dependency:** Any edit to the source `Discovery Notes` invalidates the entire Findings Object.
*   **Downstream Reference:** All Tickets and Roadmaps must reference `findingId`. They may **never** reference raw text from Discovery Notes.

---

## 7. Canonical Status Declaration

This document is the **Canonical Source of Truth** for the Findings Object structure.
Any object that contains fields, entities, or inferences not strictly defined here is **Invalid Input** and must be rejected by the Ticket Compiler.

**END OF DOCUMENT**
