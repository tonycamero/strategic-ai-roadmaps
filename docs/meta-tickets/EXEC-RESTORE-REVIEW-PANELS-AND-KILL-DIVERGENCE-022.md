# META-TICKET v2

ID: EXEC-RESTORE-REVIEW-PANELS-AND-KILL-DIVERGENCE-022
TITLE: Restore Review Panels and Suppress Divergence Alert
OWNER: Tony Camero
AGENT: Antigravity (AG)
STATUS: APPROVED FOR EXECUTION

## OBJECTIVE
Restore the visibility and functionality of the "Review Executive Brief" and "Review Diagnostic" panels in the Super Admin Control Plane. These panels must be driven strictly by TruthProbe authority to resolve contradictions with legacy UI elements.

## REQUIREMENTS
1. **Restore Review Panels (TruthProbe-Driven)**:
   - "Review Exec Brief" panel must render when `truthProbe.executiveBrief.state` is APPROVED, DELIVERED, or REVIEWED.
   - "Review Diagnostic" panel must render when `truthProbe.diagnostic.exists` is true and the Executive Brief is in a ready state.
2. **Single-Brain UI (Kill Divergence)**:
   - Suppress the "Divergence Alert" when TruthProbe data is available.
   - Ensure the "Intake" pill reflects the `truthProbe.intake.windowState` (CLOSED/OPEN).
   - Resolve contradictory "INTAKE OPEN" legacy pills when TruthProbe indicates it is CLOSED.
3. **Modal Verification**:
   - Ensure clicking the panels opens the correct modals (Executive Brief and Diagnostic) with accurate data.

## ACCEPTANCE CRITERIA
- Review panels appear correctly based on TruthProbe state.
- Contradictory legacy pills (Intake Open/Closed) are replaced by TruthProbe state.
- "Divergence Alert" is removed/suppressed.
- Modals load and display the correct artifacts.
