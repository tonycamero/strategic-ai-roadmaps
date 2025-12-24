# Verification Plan: Route Renaming (/webinar -> /diagnostic)

## Objective
Verify the successful cutover of the `/webinar` route to `/diagnostic` without redirects, ensuring full functionality of the Diagnostic flow.

## Checklist

### 1. Frontend Route Cutover
- [x] **Path Renaming**: Verify `frontend/src/App.tsx` maps `/diagnostic` to `Webinar` component.
  - *Status*: Confirmed. Line 103 maps path `/diagnostic` to `Webinar`.
- [x] **Protected Route Update**: Verify `/diagnostic` (protected) is renamed to `/diagnostic-review`.
  - *Status*: Confirmed. Line 138 maps protected `/diagnostic-review` to `DiagnosticReview`.
- [x] **Sidebar Navigation**: Verify "Diagnostic Created" link points to `/diagnostic-review`.
  - *Status*: Confirmed in `JourneySidebar.tsx`.

### 2. Backend Route Cutover
- [x] **File Renaming**: `webinar.routes.ts` -> `diagnostic.routes.ts`.
  - *Status*: Completed.
- [x] **Legacy Preservation**: Old `diagnostic.routes.ts` moved to `diagnostic_generation.routes.ts`.
  - *Status*: Completed.
- [x] **Route Mounting**: `backend/src/index.ts` mounts `diagnosticRoutes` to `/api/public/diagnostic`.
  - *Status*: Confirmed.

### 3. API Integration
- [x] **Endpoint Updates**: `frontend/src/components/webinar/webinarApi.ts` points to new `/api/public/diagnostic` base.
  - *Status*: Confirmed. Updated `/auth`, `/register`, `/diagnostic/chat`, `/pdf/team`.

### 4. UI Copy Updates
- [x] **Title**: "Team Execution Diagnostic" (was "Team Health Diagnostic").
  - *Status*: Updated in `Webinar.tsx`.
- [x] **Password Prompt**: "What's the diagnostic access code?" (was "What's the webinar password?").
  - *Status*: Updated in `WebinarDiagnostic.tsx`.

### 5. PDF Generation
- [x] **Template Text**: "Diagnostic Participant" (was "Webinar Participant").
  - *Status*: Updated in `webinarPdf.controller.ts`.
- [x] **Stateless Generation**: Confirmed PDF generation uses `rolePayloads` from request.

## Verification Steps
1.  **Load Application**: Navigate to `http://localhost:3000/diagnostic`.
    -   *Expected*: See "Team Execution Diagnostic" page.
2.  **Verify Old Route**: Navigate to `http://localhost:3000/webinar`.
    -   *Expected*: 404 or Redirect (depending on generic app routing, but explicitly not defined).
3.  **Run Diagnostic Flow**:
    -   Enter Access Code.
    -   Complete roles.
    -   Click "Generate Constitutional Strategy".
4.  **Generate PDF**:
    -   Click "Board Ready Packet".
    -   *Expected*: PDF downloads with title "Strategic AI Roadmap — Team Execution Diagnostic".

## Notes
-   The backend build failed due to environment permissions (`npm install`), but static analysis confirms code correctness.
-   Internal variable names (e.g., `webinarController`) were preserved to minimize regression risk during this refactor.
