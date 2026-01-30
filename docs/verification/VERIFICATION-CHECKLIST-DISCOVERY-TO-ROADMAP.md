# Verification Checklist: Discovery → Roadmap Compiler Pipeline

**Status:** Completed (FAILED)  
**Authority:** META-TICKET-DISCOVERY-TO-ROADMAP-COMPILER-LOCK-1  
**Target System:** Strategic AI Roadmaps (SAR) Control Plane  
**Purpose:** Audit the codebase for compliance with the immutable Compiler Pipeline described in `docs/canon/`.

---

## 🔐 1. Discovery Input Validation
**Canon:** `docs/canon/DISCOVERY_NOTES_SCHEMA.md`

| Req ID | Requirement | Evidence / Location | Status |
| :--- | :--- | :--- | :--- |
| **D1** | Discovery Intake API rejects inputs with unauthorized sections. | `backend/src/controllers/superadmin.controller.ts` (ingestDiscoveryNotes accepts raw string) | [FAIL] |
| **D2** | Discovery Intake API rejects prohibited fields (e.g., `solutions`, `roadmap_phase`). | No validation logic in controller. | [FAIL] |
| **D3** | No "catch-all" or "notes" field exists that bypasses schema structure. | Input is a single `notes` blob. | [FAIL] |
| **D4** | Frontend forms strictly enforce the canonical section order. | `frontend/src/superadmin/components/DiscoveryNotesModal.tsx` uses a single plaintext textarea. | [FAIL] |

---

## 🔐 2. Findings Object Integrity
**Canon:** `docs/canon/FINDINGS_OBJECT_SCHEMA.md`

| Req ID | Requirement | Evidence / Location | Status |
| :--- | :--- | :--- | :--- |
| **F1** | Findings conversion logic is deterministic (Output A == Output A). | System uses `DiscoverySynthesis` (`backend/src/types/discoverySynthesis.ts`) which includes non-deterministic fields. | [FAIL] |
| **F2** | No logic exists to "summary", "rewrite", or "improve" finding text (Enrichment). | Synthesis includes `synthesizedSystems` and `operatorNotes`. | [FAIL] |
| **F3** | Every Finding Object has a verifiable `findingId` traceable to a specific Discovery section. | `DiscoverySynthesis` uses `inventoryId` and does not trace back to text sections. | [FAIL] |
| **F4** | No "Composite Findings" logic exists (merging multiple points). | Synthesis explicitly merges points into `selectedInventory`. | [FAIL] |

---

## 🔐 3. Ticket Compilation Boundary
**Canon:** `docs/canon/TICKET_COMPILATION_RULES.md`

| Req ID | Requirement | Evidence / Location | Status |
| :--- | :--- | :--- | :--- |
| **T1** | Ticket Schema requires non-empty `findingIds` array. | Tickets link to `inventoryId` or `diagnosticId`, not `findingIds`. | [FAIL] |
| **T2** | Ticket Service rejects creation requests without valid provenance. | `backend/src/controllers/ticketGeneration.controller.ts` allows generation from Synthesis without Finding IDs. | [FAIL] |
| **T3** | No "Consultant Intuition" or "Pattern Matching" generation logic exists. | Ticket generation relies on `DiscoverySynthesis` "selectedInventory" (human intuition). | [FAIL] |
| **T4** | Ticket Types are restricted to the Closed Set (`Diagnostic`, `Optimization`, `ConstraintCheck`, `CapabilityBuild`). | Current types are loose (SOP tickets). | [FAIL] |
| **T5** | No prioritization fields (`high`, `medium`, `low`) exist on the Ticket Schema. | `DiscoverySynthesis` includes `tier` ('core', 'recommended') and `sprint` (30/60/90). | [FAIL] |

---

## 🔐 4. Roadmap Isolation & Determinism
**Canon:** `docs/canon/ROADMAP_COMPILATION_RULES.md`

| Req ID | Requirement | Evidence / Location | Status |
| :--- | :--- | :--- | :--- |
| **R1** | Roadmap Generation Service queries *only* `ACCEPTED` Tickets. | `backend/src/controllers/temp_controller.ts` (`assembleRoadmapForFirm`) filters by `approved: true`. | [PASS] |
| **R2** | Roadmap Generation Service has *zero* imports/dependencies on Discovery or Findings services. | Assembly logic is isolated in controller, depends only on `sopTickets` table. | [PASS] |
| **R3** | Roadmap Output contains no "Phase 1", "Timeline", or "Gantt" structures. | `assembleRoadmapForFirm` groups tickets by `Phase ${t.sprint}`. | [FAIL] |
| **R4** | Section placement is purely type-based, not heuristic. | Placement is based on `sprint` property (Phase 1, Phase 2...), not Ticket Type. | [FAIL] |
| **R5** | Roadmap ordering is strictly alphanumeric/type-based (no "smart sort"). | Ordering implies temporal phases. | [FAIL] |

---

## 🔐 5. State & Mutation
**Global Invariants**

| Req ID | Requirement | Evidence / Location | Status |
| :--- | :--- | :--- | :--- |
| **S1** | Roadmaps are never edited in place; they are strictly re-generated. | `assembleRoadmapForFirm` returns JSON without persisting an immutable Roadmap record. | [FAIL] |
| **S2** | Ticket Status (`PROPOSED`, `ACCEPTED`) lives on the Ticket, not the Roadmap. | Status is on `sopTickets` table. | [PASS] |
| **S3** | Invalidating a Finding cascades invalidation to Tickets and Roadmaps. | No invalidation logic exists. | [FAIL] |

---

## 6. Execution Instructions

1.  **Inspector:** Walk the codebase (frontend and backend).
2.  **Fill Evidence:** For each item, note the file/function that enforces (or violates) the rule.
3.  **Mark Status:**
    *   **PASS:** Enforced by code.
    *   **FAIL:** Code allows violation or logic is missing.
4.  **Report:** Generate an **Execution Ticket** to fix all FAIL items.

**END OF CHECKLIST**
