# VERIFICATION GUIDE — Stage 5 Proposals Hotfix

**Backend:** Restarted ✅  
**Frontend:** Running  
**Tenant ID:** `883a5307-6354-49ad-b8e3-765ff64dc1af`

---

## ✅ SUCCESS PATH TEST

### Steps:
1. Open browser to SuperAdmin Control Plane
2. Navigate to firm detail page for tenant `883a5307-6354-49ad-b8e3-765ff64dc1af`
3. Click "Stage 5: Assisted Synthesis" button to open modal
4. Click **"Generate Agent Proposals"** button

### Expected Result (SUCCESS):
- ✅ Center pane populates with atomic proposal cards
- ✅ Each card shows:
  - Type badge (CurrentFact, FrictionPoint, Goal, Constraint)
  - Agent-synthesized text
  - Evidence anchor chips
  - Accept/Reject buttons
- ✅ **NO error banner shown**
- ✅ "Declare Canonical Findings" button locks (pending proposals)

### Backend Logs (SUCCESS):
Look for lines like:
```
[generateAssistedProposals:<uuid>] Request for tenant 883a5307-6354-49ad-b8e3-765ff64dc1af
[AssistedSynthesis:<uuid>] Starting proposal generation for tenant 883a5307-...
[AssistedSynthesis:<uuid>] Loaded artifacts - Discovery: true, Diagnostic: true, Brief: true
[AssistedSynthesis:<uuid>] Calling OpenAI with model gpt-4o-2024-08-06
[AssistedSynthesis:<uuid>] OpenAI response received, parsing...
[AssistedSynthesis:<uuid>] Parsed 12 proposals
[generateAssistedProposals:<uuid>] Successfully persisted 12 proposals
```

**Copy the `<uuid>` (requestId) to verify trace correlation.**

---

## ❌ FAILURE PATH TESTS

### Test 1: Missing API Key (LLM_CONFIG_MISSING)

**Setup:**
1. Stop backend
2. Edit `backend/.env`: Comment out `OPENAI_API_KEY=...`
3. Restart backend
4. Attempt to generate proposals

**Expected Frontend:**
- ❌ Error banner appears below governance microcopy:
  - **Title:** "Proposal Generation Failed"
  - **Message:** "OpenAI API key not configured. Contact system administrator."
  - **Code:** `LLM_CONFIG_MISSING`
  - **Request ID:** `<uuid>` (visible, copyable)
  - **Status:** Red styling

**Expected Backend Logs:**
```
[generateAssistedProposals:<uuid>] Request for tenant 883a5307-...
[AssistedSynthesis:<uuid>] Starting proposal generation...
[generateAssistedProposals:<uuid>] Error: ProposalGenerationError
```

**HTTP Response:**
- Status: `500`
- Body:
  ```json
  {
    "code": "LLM_CONFIG_MISSING",
    "message": "OpenAI API key not configured. Contact system administrator.",
    "requestId": "<uuid>",
    "details": { "env": "OPENAI_API_KEY" }
  }
  ```

**Cleanup:** Uncomment `OPENAI_API_KEY`, restart backend

---

### Test 2: Missing Source Artifacts (SOURCE_ARTIFACTS_MISSING)

**Setup:**
1. Find or create a tenant WITHOUT discovery notes/diagnostic/exec brief
2. OR: Temporarily use a non-existent `tenantId` like `00000000-0000-0000-0000-000000000000`
3. Attempt to generate proposals

**Expected Frontend:**
- ❌ Error banner:
  - **Message:** "Missing required source artifacts. Ensure Discovery Notes, Diagnostic, and Executive Brief exist."
  - **Code:** `SOURCE_ARTIFACTS_MISSING`
  - **Request ID:** `<uuid>`

**Expected Backend Logs:**
```
[generateAssistedProposals:<uuid>] Request for tenant 00000000-...
[AssistedSynthesis:<uuid>] Starting proposal generation...
[AssistedSynthesis:<uuid>] Loaded artifacts - Discovery: false, Diagnostic: false, Brief: false
[generateAssistedProposals:<uuid>] Error: ProposalGenerationError
```

**HTTP Response:**
- Status: `400`
- Body:
  ```json
  {
    "code": "SOURCE_ARTIFACTS_MISSING",
    "message": "Missing required source artifacts...",
    "requestId": "<uuid>",
    "details": { "missing": ["discoveryNotes", "diagnostic", "executiveBrief"] }
  }
  ```

---

### Test 3: Invalid API Key (LLM_API_FAILED)

**Setup:**
1. Edit `backend/.env`: Set `OPENAI_API_KEY=sk-invalid12345`
2. Restart backend
3. Attempt to generate proposals

**Expected Frontend:**
- ❌ Error banner:
  - **Message:** Includes "OpenAI API" and error details
  - **Code:** `LLM_API_FAILED`
  - **Request ID:** `<uuid>`

**HTTP Response:**
- Status: `502`
- Body includes OpenAI error message

**Cleanup:** Restore valid `OPENAI_API_KEY`, restart backend

---

## 🔍 REQUEST TRACE CORRELATION TEST

### Purpose:
Verify that `requestId` enables full request tracing from frontend to backend.

### Steps:
1. Trigger ANY error scenario (e.g., missing API key)
2. **In frontend:** Copy the `Request ID: <uuid>` from error banner
3. **In backend logs:** Search for `<uuid>`
4. Verify you see the full request lifecycle:
   - Controller entry: `[generateAssistedProposals:<uuid>]`
   - Service entry: `[AssistedSynthesis:<uuid>]`
   - Error or success logs with same `<uuid>`

### Example Successful Trace:
```
// Frontend shows: Request ID: f47ac10b-58cc-4372-a567-0e02b2c3d479

// Backend logs:
[generateAssistedProposals:f47ac10b-58cc-4372-a567-0e02b2c3d479] Request for tenant 883a5307-...
[AssistedSynthesis:f47ac10b-58cc-4372-a567-0e02b2c3d479] Starting proposal generation...
[AssistedSynthesis:f47ac10b-58cc-4372-a567-0e02b2c3d479] Loaded artifacts - Discovery: true, Diagnostic: true, Brief: true
[generateAssistedProposals:f47ac10b-58cc-4372-a567-0e02b2c3d479] Successfully persisted 12 proposals
```

**Result:** ✅ Full trace visible with single `requestId`

---

## 📸 PROOF ARTIFACTS NEEDED

Please capture the following for documentation:

### 1. Success Path Screenshot
- Stage 5 modal showing populated proposals
- No error banner visible
- Timestamp visible

### 2. Error Path Screenshot
- Error banner showing:
  - Code (e.g., `LLM_CONFIG_MISSING`)
  - Message (human-readable)
  - Request ID (visible)
- Timestamp visible

### 3. Backend Log Excerpt
- Copy 10-20 lines showing a complete request trace with `requestId`
- Include both success and failure examples

### 4. Network Tab (Optional)
- Browser DevTools Network tab showing:
  - POST request to `/api/superadmin/firms/.../assisted-synthesis/generate-proposals`
  - Status code (200, 400, 500, 502)
  - Response JSON with `requestId`

---

## ✅ ACCEPTANCE CHECKLIST

- [ ] SUCCESS: Proposals generate and populate (no error banner)
- [ ] FAILURE: Missing API key → Shows `LLM_CONFIG_MISSING` with requestId
- [ ] FAILURE: Missing artifacts → Shows `SOURCE_ARTIFACTS_MISSING` with requestId (400 status)
- [ ] FAILURE: Invalid API key → Shows `LLM_API_FAILED` with requestId (502 status)
- [ ] TRACE: Frontend requestId matches backend logs
- [ ] UI: Error banner is dismissible (×  button works)
- [ ] UI: Error clears on modal close/reopen
- [ ] UI: Error clears on retry (clicking "Generate" again)

---

## 🚨 IF THINGS GO WRONG

### Still getting 500 with no requestId?
- Check if backend restarted successfully
- Verify `superadmin.controller.ts` changes are loaded (check file modification time)
- Check for TypeScript compilation errors in terminal

### Error banner not showing?
- Check browser console for frontend errors
- Verify `AssistedSynthesisModal.tsx` changes are compiled
- Hard refresh frontend (Ctrl+Shift+R)

### Request ID not in logs?
- Verify backend is using the updated controller
- Check if logs are being written to console vs. file
- Ensure `console.log` statements are not suppressed

---

## 📝 REPORTING RESULTS

Please provide:
1. **Success path result** (worked / failed)
2. **One error path result** (preferably missing API key test)
3. **Sample requestId** from either scenario
4. **Backend log snippet** (5-10 lines with that requestId)
5. **Any unexpected behavior** or discrepancies

**Ready to test!** 🚀
