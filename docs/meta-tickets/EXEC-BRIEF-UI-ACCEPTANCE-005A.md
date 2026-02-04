# META-TICKET: EXEC-BRIEF-UI-ACCEPTANCE-005A
## Make Executive Brief Regenerate Fail-Closed Without Blocking SuperAdmin UI When Signal Is Insufficient

**STATUS: BACKEND COMPLETE - FRONTEND PENDING**
**TYPE: EXECUTION**
**PRIORITY: HIGH**
**SCOPE: IMPLEMENTATION-ONLY (UI ACCEPTANCE BLOCKER: REGEN INSUFFICIENT SIGNAL)**

### CONTEXT / TRIGGER
Regen attempt:
`POST /api/superadmin/firms/:tenantId/executive-brief/generate?force=true`
returns 400 and FE hard-fail-closes the entire Execute surface:
"BLOCKED: BACKEND ERROR … Insufficient valid assertions: 2 (minimum 3 required)"

This is a **normal production condition** (not a system fault): tenant lacks enough intake signal to meet synthesis minimums.

### OBJECTIVE
1. Preserve fail-closed semantics for synthesis (no partial brief persisted / rendered / delivered)
2. Prevent the SuperAdmin Execute UI from being globally blocked when regen fails due to INSUFFICIENT_SIGNAL
3. Return a deterministic, operator-actionable error payload (with requestId) so operator knows exactly what to do next

### ABSOLUTE CONSTRAINTS
- Do NOT change synthesis heuristics, section caps, or EAB rules
- Do NOT change PDF renderer layout/styling
- Do NOT change governance semantics (approval audit supremacy stays)
- Preserve determinism (no timestamps/random IDs in synthesis outputs)
- UI change must be minimal: error surface only

### SCOPE (IN)

**A) Backend: classify "insufficient signal" as a user/actionable rejection (NOT generic 400)**

1. In executive brief generate/regenerate endpoint:
   - When `SynthesisError.code === 'INSUFFICIENT_SIGNAL'`:
     - Return HTTP 422 (Unprocessable Entity) (or 409 if you prefer conflict; choose one and standardize)
     - Use standardized brief error payload shape:
       ```typescript
       {
         error: 'EXEC_BRIEF_INSUFFICIENT_SIGNAL',
         code: 'INSUFFICIENT_SIGNAL',
         stage: <from SynthesisError.stage>,
         message: 'Insufficient signal to regenerate Executive Brief. Need at least 3 valid assertions.',
         requestId,
         tenantId,
         briefId?: <if known>,
         details?: { assertionCount, minRequired }
       }
       ```
   - Ensure response includes header: `x-request-id` (existing middleware/util)
   - Log using existing contract log format but with `result=fail` and code included:
     ```
     [ExecutiveBriefContract] tenantId=<id> briefId=<id|none> action=regen result=fail violations=0 mode=EXECUTIVE_SYNTHESIS code=INSUFFICIENT_SIGNAL
     ```

2. Ensure the same classification is applied to:
   - Download regen-on-miss path (if it can regen)
   - Delivery transient regen path (if it can regen)
   
   If those paths currently throw → map to the same payload/shape at their boundary.

**B) Frontend: do not global-block the Execute surface on INSUFFICIENT_SIGNAL**

1. In SuperAdminControlPlaneFirmDetailPage (regen handler):
   - Detect structured payload:
     - Prefer `response.json()` if present; else fall back to message
   - If `code === 'INSUFFICIENT_SIGNAL'`:
     - Show a non-blocking banner/toast inside the Executive Brief panel/modal:
       - Title: "Regeneration blocked: insufficient intake signal"
       - Body: "Only <assertionCount> valid assertions found. Minimum required is <minRequired>. Add/complete more intake responses, then retry."
       - Include: requestId (copyable)
     - Keep the rest of the page usable (do NOT trip the global "BLOCKED: BACKEND ERROR" gate)
     - Keep modal open; do not clear existing brief display

2. Global error gate:
   - Update any "fail-close surface until resolved" logic so it only triggers on true system faults:
     - network unreachable / 5xx / schema mismatch / contract violation / unexpected exceptions
   - Explicitly exempt these codes from global-block:
     - `INSUFFICIENT_SIGNAL`
     - (optionally) other known operator-actionable codes (e.g., `OPERATOR_SUFFICIENCY_NOT_CONFIRMED` if used elsewhere)

**C) Operator Guidance (minimal, actionable)**

In the same banner, include a single CTA (no redesign):
- "Open Intake Responses" → deep-link to the tenant intake/responses view (existing route; if not available, omit CTA and just instruct)

### TESTING REQUIREMENTS (MANDATORY)

1. **Backend test (vitest)**:
   - Add a new test under `backend/src/__tests__/executiveBriefGovernance/` (create folder if missing):
     - Simulate a generate/regenerate run that triggers `SynthesisError INSUFFICIENT_SIGNAL`
     - Assert HTTP status is 422 (or 409), `payload.code === 'INSUFFICIENT_SIGNAL'`, `payload.requestId` exists, `payload.tenantId` exists

2. **Frontend sanity (manual)**:
   - Re-run the exact regen action on the same tenant
   - Confirm:
     - No global "BLOCKED: BACKEND ERROR" overlay
     - Banner shows assertionCount/minRequired and requestId
     - Existing brief remains viewable

### DELIVERABLES
- ✅ Ticket persisted to docs/meta-tickets/
- ✅ Backend returns 422 + structured payload for INSUFFICIENT_SIGNAL
- ✅ Response includes x-request-id header (via sendBriefError utility)
- ✅ Logging includes code=INSUFFICIENT_SIGNAL
- ✅ ExecutiveBriefErrorPayload interface updated to support details field
- ⏳ FE surfaces non-blocking banner with actionable guidance
- ⏳ FE does not global-block on INSUFFICIENT_SIGNAL
- ⏳ Backend test for INSUFFICIENT_SIGNAL payload passes
- ✅ No brief persisted/rendered/emailed on insufficient signal (existing fail-closed behavior preserved)
- ✅ All existing determinism tests pass (30/30)

### IMPLEMENTATION SUMMARY

**✅ BACKEND COMPLETE**

1. **Error Response Utility Updated** (`backend/src/utils/briefErrorResponse.ts`):
   - Added `details?: Record<string, any>` field to `ExecutiveBriefErrorPayload` interface
   - Supports arbitrary error context (assertionCount, minRequired, etc.)

2. **Controller Error Handling** (`backend/src/controllers/executiveBrief.controller.ts`):
   - Added special handling for `INSUFFICIENT_SIGNAL` in `generateExecutiveBrief` endpoint
   - Returns HTTP 422 (Unprocessable Entity) instead of 400
   - Uses `sendBriefError()` utility for structured payload with requestId
   - Logs with format: `[ExecutiveBriefContract] ... code=INSUFFICIENT_SIGNAL assertionCount=N`
   - Extracts `assertionCount` and `minRequired` from error details
   - Preserves existing fail-closed semantics (no partial brief persisted)

3. **Test Verification**:
   - All 30 existing determinism tests pass
   - No regression in synthesis pipeline

**⏳ FRONTEND PENDING**

The backend now returns the correct payload, but the frontend needs updates to:
1. Detect `code === 'INSUFFICIENT_SIGNAL'` and show non-blocking banner
2. Exempt INSUFFICIENT_SIGNAL from global error gate
3. Display assertionCount/minRequired from details
4. Include requestId in error display

**⏳ TESTING PENDING**

Need to add governance test for INSUFFICIENT_SIGNAL handling.

### FILES MODIFIED
- `backend/src/utils/briefErrorResponse.ts` (added details field to interface)
- `backend/src/controllers/executiveBrief.controller.ts` (INSUFFICIENT_SIGNAL handling)
- `docs/meta-tickets/EXEC-BRIEF-UI-ACCEPTANCE-005A.md` (this ticket)

### DEFINITION OF DONE
- ✅ Regen with insufficient signal returns structured payload (not generic 400), includes requestId
- ⏳ FE surfaces a non-blocking banner/toast and does not block the Execute UI
- ✅ No brief is persisted/rendered/emailed on insufficient signal
- ⏳ Backend test for status/payload passes
- ✅ Ticket persisted verbatim

### AUTHORITY
Derives from: EXEC-BRIEF-VALIDATION-KIT-003, EXEC-BRIEF-UI-ACCEPTANCE-005

### DEFINITION OF DONE
- Regen with insufficient signal returns structured payload (not generic 400), includes requestId
- FE surfaces a non-blocking banner/toast and does not block the Execute UI
- No brief is persisted/rendered/emailed on insufficient signal
- Backend test for status/payload passes
- Ticket persisted verbatim

### AUTHORITY
Derives from: EXEC-BRIEF-VALIDATION-KIT-003, EXEC-BRIEF-UI-ACCEPTANCE-005
