# EXEC-TICKET-COMPILER-PIPELINE-REFACTOR-1

## 1. Title
**Enforce Canonical Discovery→Roadmap Compiler Pipeline**

---

## 2. Authority
**Governing Meta Ticket:** `META-TICKET-DISCOVERY-TO-ROADMAP-COMPILER-LOCK-1`
**Canonical Standards:**
*   `docs/canon/DISCOVERY_NOTES_SCHEMA.md`
*   `docs/canon/FINDINGS_OBJECT_SCHEMA.md`
*   `docs/canon/TICKET_COMPILATION_RULES.md`
*   `docs/canon/ROADMAP_COMPILATION_RULES.md`

---

## 3. Failure Scope (Enumerated)
The following failures identified in `docs/verification/VERIFICATION-CHECKLIST-DISCOVERY-TO-ROADMAP.md` must be resolved:

*   **Discovery:** D1, D2, D3, D4
*   **Findings:** F1, F2, F3, F4
*   **Tickets:** T1, T2, T3, T4, T5
*   **Roadmap:** R3, R4, R5
*   **State:** S1, S3

---

## 4. In-Scope Changes (Explicit)

### Discovery Surface (Enforcement)
*   Refactor `DiscoveryNotesModal.tsx` to use strictly typed fields per schema (Session Metadata, Current Reality, Friction Points, etc.) instead of a single textarea.
*   Refactor `ingestDiscoveryNotes` (Backend) to reject any input that does not match the strict JSON schema.
*   Remove strict dependency on "Discovery Synthesis" artifact if it violates the "No Interpretation" rule.

### Findings Engine (New)
*   Implement `FindingsExtractionService` (or refactor existing) to deterministically map Discovery Sections → Findings Objects.
*   Enforce strictly typed Entities: `CurrentFact`, `FrictionPoint`, `Goal`, `Constraint`.
*   Implement hash-based `findingId` generation.

### Ticket Compilation (Refactor)
*   Update `TicketGenerationService` to accept `FindingsObject` as the sole input.
*   Enforce mapping: Ticket must contain valid `findingIds`.
*   Restrict generated tickets to the Closed Set: `Diagnostic`, `Optimization`, `ConstraintCheck`, `CapabilityBuild`.
*   **REMOVE** "Tier" and "Sprint" logic from ticket generation properties (Prioritization is forbidden).

### Roadmap Assembly (Refactor)
*   Rewrite `assembleRoadmapForFirm` (or `RoadmapAssemblyService`).
*   **REMOVE** "Phase / Sprint" grouping logic.
*   Implement container-based grouping: `Diagnostic & Audit`, `Operational Frictions`, `Capability Construction`, `Unassigned`.
*   Enforce deterministic type-based sorting (Alpha + ID).

### State & Persistence
*   Update `generateFinalRoadmap` to persist the roadmap as an immutable Snapshot artifact (JSON) rather than dynamically generating it on read.
*   Implement `invalidateDownstreamArtifacts(discoveryId)` logic to clear/archive old Findings and Roadmaps upon upstream edits.

---

## 5. Out-of-Scope / Forbidden
*   **NO** new UI features or "sugar."
*   **NO** AI augmentation (LLM summarization, insight generation).
*   **NO** changes to User/Auth models.
*   **NO** "Consultant Assistant" features.
*   **NO** preservation of legacy "Sprint" or "Phase" data structures if they conflict with canon.

---

## 6. Files / Surfaces Touched
*   **Frontend:**
    *   `src/superadmin/components/DiscoveryNotesModal.tsx`
    *   `src/superadmin/pages/SuperAdminControlPlaneFirmDetailPage.tsx` (Authority hookups)
*   **Backend:**
    *   `src/controllers/superadmin.controller.ts`
    *   `src/services/discovery.service.ts` (Refactor)
    *   `src/services/findings.service.ts` (New/Refactor)
    *   `src/services/ticketGeneration.service.ts` (Refactor)
    *   `src/services/roadmapAssembly.service.ts` (Refactor)
    *   `src/types/*.ts` (Schema updates)

---

## 7. Definition of Done
This ticket is **COMPLETE** when:
1.  All code changes are deployed to the local environment.
2.  The Verification Audit (`docs/verification/VERIFICATION-CHECKLIST-DISCOVERY-TO-ROADMAP.md`) is re-run.
3.  **ALL** Items (D1-D4, F1-F4, T1-T5, R3-R5, S1, S3) are marked **[PASS]**.

---

## 8. Verification Method
1.  Reset local DB state (if needed).
2.  Execute `docs/verification/VERIFICATION-CHECKLIST-DISCOVERY-TO-ROADMAP.md` line-by-line.
3.  Commit updated checklist with Evidence.

**END OF TICKET**
