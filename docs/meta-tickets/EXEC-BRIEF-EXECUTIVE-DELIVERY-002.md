# EXECUTION-TICKET: EXEC-BRIEF-EXECUTIVE-DELIVERY-002

## 1. Metadata
- **ID**: EXEC-BRIEF-EXECUTIVE-DELIVERY-002
- **Title**: Enforce Executive Synthesis Mode for Email + Download Delivery
- **Status**: IN_PROGRESS
- **Priority**: HIGH

## 2. Objective
Guarantee that any externally delivered Executive Brief (Email attachment + Download endpoint) is ALWAYS rendered as CEO-grade EXECUTIVE_SYNTHESIS, regardless of how/when the brief was originally generated.

## 3. Scope
- **Allowed**:
  - Delivery service + download controller logic changes only.
  - `briefMode` enforcement + regeneration in `EXECUTIVE_SYNTHESIS`.
  - Minimal audit logging additions related to delivery-mode enforcement.
- **Forbidden**:
  - No refactors outside the delivery + executive brief controller surface.
  - No schema changes beyond what already landed in 001.
  - No UI/FE changes unless strictly required to call existing endpoints.
  - No deletion/mutation of historical records except updating delivery metadata/audit.

## 4. Required Behavior
- **A) EMAIL DELIVERY**: Must always attach an `EXECUTIVE_SYNTHESIS` PDF. Regenerate on-demand if necessary.
- **B) DOWNLOAD DELIVERY**: Must always return an `EXECUTIVE_SYNTHESIS` PDF stream. Regenerate if file missing or if original mode was diagnostic.

## 5. Decision Rule (Record Mutation Policy)
- Do NOT overwrite or mutate an existing `DIAGNOSTIC_RAW` brief record in-place.
- Regenerate executive PDF transiently and log the enforcement event.

## 6. Acceptance Criteria
- Clicking “Email to Tenant Lead” ALWAYS results in an email with an `EXECUTIVE_SYNTHESIS` PDF.
- Clicking “Download PDF” ALWAYS results in an `EXECUTIVE_SYNTHESIS` PDF download.
- Works on localhost and Netlify production.
- No changes to intake, auth, or diagnostic invariants.
