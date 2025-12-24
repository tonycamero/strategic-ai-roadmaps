# Verification Plan: Board-Ready Diagnostic Copy Updates

## Objective
Verify that the FE copy and structure updates for the Board-Ready Diagnostic UI are correctly implemented without functional regression.

## Checklist

1.  **Results Header**
    - [x] Text changed from "Analysis Complete" to "Execution Constraint Identified".

2.  **Root Constraint Subline**
    - [x] Subline added beneath constraint: "The organization routes decisions through a human instead of a system."

3.  **Role Synthesis Verdicts**
    - [x] Each role card displays a bold verdict line at the top.
        - Owner: "You are absorbing system failures instead of enforcing structure."
        - Sales: "Revenue depends on heroics instead of enforced follow-up."
        - Ops: "Execution speed exceeds system control."
        - Delivery: "Momentum decays after handoff due to unclear ownership."

4.  **CTA Copy**
    - [x] Button text changed from "Generate Full PDF" to "Download Board Packet (PDF)".

## Verification Steps
1.  **Load Diagnostic**: Navigate to `/diagnostic`.
2.  **Complete Roles**: Run through the 4 roles quickly (mock data or random answers).
3.  **Generate Strategy**: Click "Generate Constitutional Strategy".
4.  **Inspect UI**:
    -   Check the main headline.
    -   Check the Root Constraint card for the new subline.
    -   Check each of the 4 Role cards for the new verdict text (green border-l-2 box).
    -   Check the primary action button text.

## Regression Check
- [x] No layout breakages (e.g., card height, grid alignment).
- [x] PDF Generation still works (click the new button).

## Status
- [x] Code changes applied.
- [x] Syntax error (map closure) fixed.
