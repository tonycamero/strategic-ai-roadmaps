# Verification Plan: Fix "Invalid response from team strategy API"

## Objective
Fix the mismatch between Frontend expectations and Backend response shape for the "Generate Constitutional Strategy" flow, and harden the Frontend against future API errors.

## Root Cause Analysis
- **Frontend Expectation:** `WebinarDiagnostic.tsx` checks for `response.teamResults` and throws if missing.
- **Backend Reality:** `webinar.controller.ts` was returning `{ ok: true, team: {...}, board: {...} }` (merged at root), effectively missing the `teamResults` wrapper key.

## Fix Applied
1.  **Backend:** Updated `webinar.controller.ts` to wrap the strategy payload in a `teamResults` property:
    ```json
    {
      "ok": true,
      "teamResults": {
        "team": ...,
        "board": ...,
        "roleSummaries": ...
      }
    }
    ```
2.  **Frontend:** Hardened `WebinarDiagnostic.tsx`:
    -   Replaced `throw new Error(...)` with friendly `console.error` and `setStrategyError`.
    -   Displays "Team strategy unavailable. Please try again." banner instead of crashing or showing a generic "Error".

## Verification Steps
1.  **Load Diagnostic:** Navigate to `/diagnostic`.
2.  **Complete Roles:** Finish all 4 role assessments.
3.  **Generate Strategy:** Click "Generate Constitutional Strategy".
    -   *Success Condition:* No "Invalid response" error. The Board-Ready Packet view renders correctly.
4.  **Check Data:** Verify "Owner / Executive", "Sales", "Ops", "Delivery" sections appear with content.

## Regression Check
-   Ensure `/diagnostic` route still loads.
-   Ensure API calls go to `/api/public/diagnostic/...`.

## Status
-   [x] Backend fix applied.
-   [x] Frontend hardening applied.
-   [x] Route wire-up verified via code review.
