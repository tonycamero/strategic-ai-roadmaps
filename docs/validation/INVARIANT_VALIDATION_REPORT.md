# Invariant Validation Report

## 0. Run Metadata
- **Git Branch**: main (HEAD)
- **Commit SHA**: [LATEST]
- **Environment**: Local / WSL
- **Timestamp**: 2026-01-30 08:10:00 UTC
- **DEBUG Flag State**: TRUE

---

## 1. Summary Table

| Key | Assertion | Type | Verdict |
|:---|:---|:---|:---|
| **A1** | Intake Not Auto-Closed by Brief | STATIC | **PASS** |
| **A2** | Explicit Intake Closure Only | STATIC | **PASS** |
| **A3** | Intake Writable During Follow-Up | STATIC | **PASS** |
| **B1** | CF Writes to Intake Evidence | STATIC | **PASS** |
| **B2** | CF Attribution {requestedBy, From, At} | STATIC | **PASS** |
| **B3** | Pending CF Blocks Diagnostic | STATIC | **PASS** |
| **C1** | Brief Is Non-Terminal | STATIC | **PASS** |
| **C2** | Brief Delivery No-Freeze Intake | STATIC | **PASS** |
| **D1** | Snapshot Required for Diagnostic | STATIC | **PASS** |
| **D2** | Snapshot Immutability | STATIC | **PASS** |
| **D3** | Operator Knowledge Gate | STATIC | **FAIL** |
| **E1** | TruthProbe Is Descriptive Only | STATIC | **PASS** |
| **E2** | TruthProbe No-Close Intake | STATIC | **PASS** |
| **F1** | State Pills Are Non-Coercive | STATIC | **FAIL** |
| **F2** | Visibility ≠ Authority | STATIC | **FAIL** |
| **G1** | Human Supremacy | STATIC | **PASS** |
| **G2** | Automation Explicit Opt-In | STATIC | **PASS** |

---

## 2. Per-Assertion Evidence

### A1 — Intake Not Auto-Closed by Brief
- **Assertion**: `NOT (executiveBrief.state IN {APPROVED, DELIVERED, REVIEWED} IMPLIES intake.windowState == CLOSED)`
- **Validation Type**: STATIC
- **Evidence**: `backend/src/controllers/executiveBrief.controller.ts:258-267`. Approval transaction remains decoupled from intake window state.
- **Verdict**: **PASS**

### B2 — Consultant Feedback Attribution
- **Assertion**: `consultantFeedback MUST HAVE {requestedBy, requestedFrom, requestedAt}`
- **Validation Type**: STATIC
- **Evidence**: `backend/src/controllers/superadmin.controller.ts:261` (updateIntakeCoaching). Logic now injects `requestedBy`, `requestedFrom`, and `requestedAt` into the `requests` array for each coaching item.
- **Verdict**: **PASS** (Corrected in EXEC-024)

### B3 — Pending Consultant Feedback Blocks Diagnostic
- **Assertion**: `IF consultantFeedback.pending == TRUE THEN diagnostic.generationAllowed == FALSE`
- **Validation Type**: STATIC
- **Evidence**: `backend/src/services/gate.service.ts:88-98`. `canGenerateDiagnostics` now scans all intakes for the tenant and blocks if any item is `isFlagged` or has a request with `status: 'PENDING'`.
- **Verdict**: **PASS** (Corrected in EXEC-024)

### D3 — Operator Knowledge Gate
- **Assertion**: `diagnostic.generationAllowed == TRUE ONLY IF operator.confirmedSufficiency == TRUE`
- **Validation Type**: STATIC
- **Evidence**: `backend/src/services/gate.service.ts:66`. No explicit verification that the operator has affirmed knowledge sufficiency via a dedicated flag. Gate relies on `intakeClosedAt`.
- **Verdict**: **FAIL**

### F1 — State Pills Are Non-Coercive
- **Assertion**: `ui.stateIndicator DOES NOT trigger backend state change`
- **Validation Type**: STATIC
- **Evidence**: `backend/src/controllers/executiveBrief.controller.ts:302`. The API still returns `intakeWindowState: 'CLOSED'` upon brief approval in the JSON response, effectively coercing the UI state despite the DB remaining open.
- **Verdict**: **FAIL**

### F2 — Visibility ≠ Authority
- **Assertion**: `artifact.viewable == TRUE IF artifact.exists == TRUE REGARDLESS OF downstream blockers`
- **Validation Type**: STATIC
- **Evidence**: `frontend/src/superadmin/pages/SuperAdminControlPlaneFirmDetailPage.tsx`. Brief and Diagnostic panels are still conditionally rendered based on status strings rather than artifact presence, masking existing but unapproved artifacts.
- **Verdict**: **FAIL**

---

## 3. Violations List (Residual)

- **D3**: Missing semantic gate for operator "Knowledge Sufficiency" affirmation.
- **F1**: API protocol lie. Brief approval endpoint returns a falsified `intakeWindowState`.
- **F2**: UI visibility logic remains tied to authorization status instead of artifact existence.

---
**This report is final and based on HEAD as of 2026-01-30.**
