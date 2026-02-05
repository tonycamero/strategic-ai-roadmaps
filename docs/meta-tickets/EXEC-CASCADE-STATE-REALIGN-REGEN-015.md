# META-TICKET v2

ID: EXEC-CASCADE-STATE-REALIGN-REGEN-015
TITLE: Reconcile Cascade Truth-State → Regenerate & Approve Exec Brief → Regen Diagnostic
OWNER: Tony Camero
AGENT: Antigravity (AG)
STATUS: APPROVED FOR EXECUTION

## OBJECTIVE
Restore Cascade Climate Solutions to a coherent, truthful pipeline state, then
regenerate the Executive Brief under the new semantic contract, approve it, and
only then regenerate the Diagnostic to confirm no degradation.

## PHASE 1 — SURFACE TRUTH-STATE RECONCILIATION (NO GENERATION)

### REQUIRED FIXES
AG must reconcile and enforce the following invariants on Cascade:

1) Intake State
- Intake must be either OPEN or CLOSED — not both.
- If all stakeholder intakes are submitted, Intake = CLOSED everywhere.
- Update top metadata pill and authority control plane to match.

2) Exec Brief State
- If Exec Brief shows "READY – Review Draft":
  - Diagnostic must NOT be marked COMPLETE.
  - Exec Brief must be the next required action.

3) Diagnostic State
- Diagnostic must be rolled back to PRE-GENERATED / INVALIDATED
  if Exec Brief has not yet been approved.

### ACCEPTANCE
- UI surface shows a single, consistent pipeline truth.
- No regeneration yet.

## PHASE 2 — REGENERATE EXECUTIVE BRIEF (CONTRACT-BOUND)

### ACTION
- Regenerate Executive Brief for Cascade using:
  docs/invariants/EXECUTIVE_BRIEF_CONTRACT.md

### REQUIREMENTS
- Output must be interpretive, reflective, non-diagnostic.
- Sections must match modal structure:
  - Executive Summary
  - Constraint Landscape
  - Blind Spot Risks
  - Leadership Perception vs Operational Reality
- No ranking, causality, or prescriptions allowed.

### DELIVERABLE
- Executive Brief content visible in modal.
- State = READY – Review Draft.

## PHASE 3 — APPROVAL STEP (EXPLICIT)

### ACTION
- Present regenerated Exec Brief for approval.
- Upon approval:
  - Lock Exec Brief.
  - Record approval timestamp + approver.

### ACCEPTANCE
- Exec Brief state = APPROVED / LOCKED.
- Audit log reflects approval event.

## PHASE 4 — REGENERATE DIAGNOSTIC (CONTROL TEST)

### ACTION
- Regenerate Diagnostic for Cascade using existing Diagnostic pipeline.
- Do NOT modify Diagnostic logic.

### VALIDATION
Confirm:
- Diagnostic asserts causality, priority, and leverage as before.
- No softening, hedging, or loss of authority.
- No dependency on Exec Brief language beyond allowed handoff.

## FINAL ACCEPTANCE CRITERIA

- UI surface shows coherent, linear pipeline:
  Intake → Exec Brief (Approved) → Diagnostic (Complete)
- Exec Brief content conforms to semantic contract.
- Diagnostic quality is unchanged.
- No contradictory state indicators remain.

## STOP CONDITIONS
- If any state transition cannot be reconciled deterministically: STOP + REPORT.
- If Exec Brief regeneration introduces diagnostic language: STOP + REPORT.
- If Diagnostic output materially degrades: STOP + REPORT with diff.
