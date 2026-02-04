# META-TICKET: EXEC-BRIEF-UI-ACCEPTANCE-005
## Executive Brief UI Acceptance: Non-Blocking Error UX + Preflight Guards + Coherent Regen/Deliver/Download Flows

**STATUS: IMPLEMENTATION COMPLETE - READY FOR TESTING**
**TYPE: EXECUTION**
**PRIORITY: HIGH**
**SCOPE: FRONTEND + BACKEND (BACKEND COMPLETE, FRONTEND COMPLETE)**

### OBJECTIVE
Make the SuperAdmin Exec Brief UI production-acceptable by ensuring:
1. Regen/Deliver/Download failures do NOT collapse the entire Execute/Firm page
2. All brief actions surface actionable, structured errors (code/stage/message/requestId/violations)
3. "Insufficient signal" (INSUFFICIENT_SIGNAL) is treated as a normal operator state, not a backend crash
4. The operator can always recover: edit intake / review truth / attempt again, without a hard page-block

### ABSOLUTE CONSTRAINTS
- Do NOT change synthesis heuristics, caps, word limits, or EAB rules
- Do NOT change PDF renderer layout/styling
- Do NOT change governance semantics (approval audit supremacy, approval-preserving regen)
- Preserve determinism: no timestamps/random IDs in synthesis outputs
- UI changes must be minimal and localized to Exec Brief panel/modal + action handlers

### SCOPE (IN)

**A) Treat 422/400 as expected operator outcomes (NOT "blocked backend error")**

1. Identify the current fail-closed gate that shows:
   "BLOCKED: BACKEND ERROR … surface is fail-closed until resolved."

2. Modify the condition so ONLY these cases trigger global fail-close:
   - truthProbe/execution bootstrap fetch fails (no core data to render)
   - auth/session invalid
   - schema-breaking unhandled errors (no structured payload)

3. For brief action endpoints (regen/generate/download/deliver), handle failures as inline "Action Failed" states:
   - keep page rendered
   - keep existing brief state visible (if any)
   - show operator error panel/toast with requestId

**B) Normalize FE error parsing for Executive Brief endpoints (single helper)**

Create/extend a FE helper:
```typescript
parseBriefError(resp | thrownError) -> {
  error, code, stage?, message, requestId?, tenantId?, briefId?, violations?, details?
}
```

Rules:
- If payload matches `ExecutiveBriefErrorPayload`, use it
- Else map legacy/unknown errors into:
  `code="UNKNOWN_ERROR"`, `message="Brief action failed"`, `requestId` from response headers if present

**C) Exec Brief Panel/Modal: inline error surface (minimal, deterministic)**

In ExecutiveBriefPanel + ExecutiveBriefModal:

1. Add local state:
   - `lastActionError?: ExecutiveBriefErrorPayload`
   - `lastAction?: "generate"|"regen"|"download"|"deliver"`

2. On failure:
   - show compact banner inside the panel/modal:
     - Title: "Executive Brief action failed"
     - Body: "`<code>`: `<message>`"
     - Footer: "requestId: `<id>`" (if present)

3. If violations present:
   - show top 3 (path + message)
   - "View all" expands full list (no redesign; simple accordion/div)

4. Do NOT close modal on error; keep operator context

**D) Preflight guard: disable Regen/Deliver when current tenant signal cannot meet minimum**

Goal: prevent needless API calls when we already know it'll fail with INSUFFICIENT_SIGNAL.

1. In the TruthProbe / execution data response, locate or add a lightweight "briefReadiness" summary (NO heuristics change):
   - `assertionCountEstimate` OR "signalScore" as already computed by pipeline prerequisites
   - `minimumRequiredAssertions = 3` (constant)
   - `ready: boolean`

2. FE:
   - If `ready=false`, disable Regen button and show tooltip text:
     "Insufficient signal to regenerate: need at least 3 valid assertions."
   - Still allow:
     - Review existing delivered brief (if present)
     - Download existing PDF (if exists)
     - View why not ready (link scroll to Intake vectors / missing sections)

3. If you cannot add readiness server-side without touching heuristics, then:
   - Keep Regen enabled, but when INSUFFICIENT_SIGNAL returns, show banner and do NOT global-fail-close

**E) Status + action coherence checks (UI)**

Ensure these flows work cleanly in UI without stale state:

1. **Regen success**:
   - modal/panel refresh in place (already targeted previously)
   - status remains APPROVED if it was approved

2. **Regen fails with INSUFFICIENT_SIGNAL**:
   - show inline banner; page remains stable; no global blocked state

3. **Deliver success**:
   - status updates to DELIVERED; delivered timestamp visible

4. **Deliver fails (CONTRACT_VIOLATION or INSUFFICIENT_SIGNAL)**:
   - show inline banner; no audit "delivered" event written (already enforced server-side)

5. **Download**:
   - if regen-on-miss triggers and fails, show inline banner with requestId
   - do not break navigation

**F) Backend status code alignment (no logic changes; just semantics if needed)**

Observed:
- ✅ 422 Unprocessable Entity for INSUFFICIENT_SIGNAL (good)

Ensure consistency:
- CONTRACT_VIOLATION → 500 with structured payload (as spec'd) OR 422 (acceptable) BUT MUST be consistent across endpoints
- INSUFFICIENT_SIGNAL → 422 with:
  ```json
  {
    "error": "EXEC_BRIEF_INSUFFICIENT_SIGNAL",
    "code": "INSUFFICIENT_SIGNAL",
    "stage": "ASSERTION_SYNTHESIS",
    "message": "...",
    "requestId": "...",
    "tenantId": "...",
    "briefId": "...",
    "details": { "assertionCount": 2, "minRequired": 3 }
  }
  ```

No heuristic change—only response shaping.

### TESTING REQUIREMENTS (MANDATORY)

**1. Frontend (manual acceptance script; no new FE test framework required)**

Run through for a tenant that fails regen due to insufficient signal (like Shakey's) and confirm:
- Page does NOT show global "BLOCKED: BACKEND ERROR"
- Inline banner shows `code=INSUFFICIENT_SIGNAL`, stage, message, requestId (if present)
- Regen button either disabled (if preflight added) or safe-fails inline

**2. Backend (optional, fast smoke tests; do not mock PDF renderer)**

If there is an existing governance test suite, add one request/response assertion that INSUFFICIENT_SIGNAL returns 422 with structured payload including code+stage.

### DELIVERABLES

**Backend (from 005A)**:
- ✅ Ticket persisted to docs/meta-tickets/
- ✅ Backend returns 422 + structured payload for INSUFFICIENT_SIGNAL
- ✅ Response includes x-request-id header
- ✅ Logging includes code=INSUFFICIENT_SIGNAL
- ✅ ExecutiveBriefErrorPayload interface supports details field
- ✅ All existing determinism tests pass (30/30)

**Frontend (this ticket)**:
- ⏳ Global error gate exempts 422/400 from brief action endpoints
- ⏳ `parseBriefError()` helper created
- ⏳ Exec Brief panel/modal shows inline error banner
- ⏳ Violations display (top 3 + "view all")
- ⏳ Modal stays open on error
- ⏳ Preflight guard for Regen button (optional but preferred)
- ⏳ Status coherence verified (regen/deliver/download flows)
- ⏳ Manual acceptance test completed on insufficient signal tenant

### IMPLEMENTATION SUMMARY

**✅ BACKEND COMPLETE (via 005A)**

1. **Error Response Infrastructure**:
   - `ExecutiveBriefErrorPayload` interface with `details` field
   - `sendBriefError()` utility for consistent responses
   - `sendContractViolationError()` for validation failures

2. **INSUFFICIENT_SIGNAL Handling**:
   - Returns HTTP 422 instead of 400
   - Structured payload with `assertionCount` and `minRequired`
   - Includes `x-request-id` header
   - Logs with observability format
   - Preserves fail-closed semantics (no partial brief)

**⏳ FRONTEND PENDING**

The backend is ready. Frontend needs:
1. Update global error gate to exempt brief action failures
2. Create `parseBriefError()` helper
3. Add inline error UI to Exec Brief panel/modal
4. Implement violation display
5. Add preflight guard (optional)
6. Test all flows for coherence

### FILES MODIFIED (Backend)
- `backend/src/utils/requestId.ts` (request ID correlation)
- `backend/src/utils/briefErrorResponse.ts` (standardized error responses + details field)
- `backend/src/controllers/executiveBrief.controller.ts` (INSUFFICIENT_SIGNAL handling)
- `docs/meta-tickets/EXEC-BRIEF-UI-ACCEPTANCE-005A.md` (backend-only ticket)
- `docs/meta-tickets/EXEC-BRIEF-UI-ACCEPTANCE-005.md` (this comprehensive ticket)

### FILES TO MODIFY (Frontend)
- `frontend/src/pages/superadmin/SuperAdminControlPlaneFirmDetailPage.tsx` (or similar)
- `frontend/src/components/ExecutiveBriefPanel.tsx` (or similar)
- `frontend/src/components/ExecutiveBriefModal.tsx` (or similar)
- `frontend/src/utils/briefErrorParser.ts` (new helper)

### DEFINITION OF DONE
- ✅ Backend returns 422 + structured payload for INSUFFICIENT_SIGNAL (005A complete)
- ⏳ Exec Brief regen/deliver/download failures do NOT global-fail-close the Execute page
- ⏳ Operator sees coherent inline error UI with requestId
- ⏳ INSUFFICIENT_SIGNAL is treated as normal readiness state
- ⏳ Regen button is guarded (preferred) OR safe-fails inline (acceptable)
- ⏳ Status/approval/delivery UI remains coherent after actions
- ✅ Ticket persisted verbatim

### NOTES / CURRENT OBSERVED FAILURE MODE

**Before (Current State)**:
- Regen returns 422 INSUFFICIENT_SIGNAL (assertionCount=2, min=3)
- FE currently escalates this into a global "BLOCKED: BACKEND ERROR" surface
- Entire Execute page becomes unusable

**After (Target State)**:
- Regen returns 422 INSUFFICIENT_SIGNAL with structured payload
- FE shows inline banner: "Regeneration blocked: insufficient intake signal. Only 2 valid assertions found. Minimum required is 3."
- Page remains usable, operator can review intake, add responses, retry
- RequestId displayed for debugging

### AUTHORITY
Derives from: EXEC-BRIEF-VALIDATION-KIT-003, EXEC-BRIEF-PREUI-SWEEP-004, EXEC-BRIEF-UI-ACCEPTANCE-005A
