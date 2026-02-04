# META-TICKET v2

ID: EXEC-TRUTHPROBE-AUTHORITY-SPINE-017
TITLE: Make TruthProbe the Single Source of Truth for Control Plane Gating + Status (Expose Divergence)
OWNER: Tony Camero
AGENT: Antigravity (AG)
STATUS: APPROVED FOR EXECUTION

## OBJECTIVE
TruthProbe already computes lifecycle truth, but the Control Plane UI is still showing contradictory states (e.g., INTAKE OPEN vs Intake CLOSED).
Make TruthProbe output the single authority spine for:
- status pills (Intake Open/Closed)
- gate states (READY/LOCKED/COMPLETE)
- “Delivered/Approved” badges
- blocking reasons

No new systems. Wire what exists.

## HARD RULES
- Do NOT create a new truth model.
- Do NOT add UI heuristics to "correct" backend lag.
- If truth is unknown, display UNKNOWN (do not guess).
- Must preserve existing TruthProbe panel behavior.

## PHASE 0 — PROOF (CURRENT STATE)
AG must locate and cite (file paths + line refs):
1) Where TruthProbe state is computed (function/module name)
2) Where the Control Plane currently computes:
   - Intake OPEN/CLOSED pill
   - Exec Brief READY/DELIVERED/APPROVED labels
   - Diagnostic LOCKED/COMPLETE visibility
3) Identify each duplicated state computation site (list paths only)

STOP if TruthProbe output cannot be located in code.

## PHASE 1 — SINGLE SOURCE OF TRUTH WIRING
In SuperAdminControlPlaneFirmDetailPage.tsx (or the canonical page):
- Replace all lifecycle/gating derivations with TruthProbe-derived values.
Specifically:
A) Intake pill must reflect TruthProbe intakeStatus only.
B) Exec Brief state must reflect TruthProbe briefStatus only.
C) Diagnostic gate/card must reflect TruthProbe diagnosticStatus only.
D) Blocking Reasons must come from TruthProbe only.

Remove/disable any local-state computations (counts, stakeholder completion heuristics, stale fields) that contradict TruthProbe.

## PHASE 2 — DIVERGENCE VISIBILITY (DEV + PROD SAFE)
Add a small “DIVERGENCE” indicator when:
- raw backend fields disagree with TruthProbe computed truth

Implementation:
- In dev: console.warn with structured diff
- In prod UI: a tiny badge “STATE DIVERGENCE” with tooltip (no big UI changes)

This prevents silent drift.

## PHASE 3 — EXEC BRIEF STATUS MODEL ALIGNMENT (NO NEW SEMANTICS)
TruthProbe must distinguish at minimum:
- DRAFT (exists, not approved)
- APPROVED (explicit approval)
- DELIVERED (delivery event occurred)

If TruthProbe currently cannot distinguish APPROVED vs DELIVERED:
- STOP + REPORT what fields are missing
- Propose minimal persisted fields needed (no implementation in this ticket unless trivial)

## ACCEPTANCE CRITERIA
- Intake Open/Closed indicators match TruthProbe panel exactly.
- Exec Brief and Diagnostic gating match TruthProbe panel exactly.
- No contradictory state indicators remain on the page.
- If backend raw fields disagree, DIVERGENCE indicator appears.

## STOP CONDITIONS
- If TruthProbe is currently based on mocked or client-only state: STOP + REPORT.
- If aligning statuses requires DB schema changes: STOP + REPORT with minimal field proposal.
