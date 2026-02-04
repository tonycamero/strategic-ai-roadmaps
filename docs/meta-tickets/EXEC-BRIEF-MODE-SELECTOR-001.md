# EXECUTION-TICKET: EXEC-BRIEF-MODE-SELECTOR-001

## 1. Metadata
- **ID**: EXEC-BRIEF-MODE-SELECTOR-001
- **Title**: Introduce Explicit Executive Brief Mode Selector (Diagnostic vs Executive)
- **Status**: IN_PROGRESS
- **Priority**: HIGH

## 2. Objective
Eliminate ambiguous or accidental narrative behavior by introducing an explicit, persisted Brief Mode that governs narrative assembly and PDF rendering.

## 3. Scope
- **Allowed**:
  - Add a new enum or constrained string field to the Executive Brief domain model: `DIAGNOSTIC_RAW`, `EXECUTIVE_SYNTHESIS`.
  - Persist `briefMode` with each Executive Brief record.
  - Thread `briefMode` through: Narrative Assembly Layer, PDF Generation Service.
  - Default `briefMode` to `EXECUTIVE_SYNTHESIS` for all delivery paths (email + download).
- **Forbidden**:
  - No changes to intake logic.
  - No changes to auth, tenant, or audit invariants.
  - No UI redesign beyond wiring the correct mode.

## 4. Acceptance Criteria
- Every Executive Brief has an explicit `briefMode`.
- Narrative assembly behavior is deterministically gated by `briefMode`.
- No PDF is generated without a declared mode.
- Logs clearly indicate which mode was used during generation.
