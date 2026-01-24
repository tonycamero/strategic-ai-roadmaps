# EXEC-TICKET-STAGE5-INTERPRETIVE-AGENT-SESSION-403-FIX-1

**ID:** EXEC-TICKET-STAGE5-INTERPRETIVE-AGENT-SESSION-403-FIX-1  
**DATE:** 2026-01-22  
**OWNER:** Tony  
**SYSTEM:** Strategic AI Roadmaps (SuperAdmin Control Plane)  
**SURFACE:** Stage 5 Assisted Synthesis Modal → Interpretive Agent

---

## GOAL
Restore the Interpretive Agent chat session so it reliably loads and functions inside Stage 5 Assisted Synthesis without 403 errors, using the same authenticated SuperAdmin execution surface.

---

## OBSERVED FAILURE
- Frontend request: `GET http://localhost:3001/api/tenants/me` → **403 Forbidden**
- This occurs when Interpretive Agent attempts to load "agent session" inside Stage 5 modal
- Everything else in SuperAdmin UI works; only this agent session init fails

---

## ROOT CAUSE HYPOTHESIS
- Interpretive Agent is calling backend directly on `:3001` (bypassing Vite proxy :5173) and/or bypassing shared `api.ts` helper so Authorization header is missing
- `/api/tenants/me` likely enforces tenant-scoped access and rejects superadmin contexts
- Mismatch between "superadmin execution surface" and "tenant me" endpoint contract

---

## EXECUTION STEPS

### STEP 1 — TRACE CURRENT CALL SITE (FRONTEND) ✅
**Task:** Locate where `/api/tenants/me` is being called from  
**Status:** COMPLETE  
**Finding:** `/api/tenants/me` exists in `frontend/src/lib/api.ts` (tenant-scoped API) which hardcodes `http://localhost:3001` in dev mode. This is the wrong API surface for SuperAdmin contexts.

### STEP 2 — NORMALIZE FRONTEND API CALLS (NO PORT 3001) ✅
**Task:** Replace any direct calls to `http://localhost:3001/...` with relative `/api/...` routes  
**Status:** COMPLETE - NOT NEEDED  
**Finding:** Agent console correctly uses `import * as superadminApi from '../api'` which uses `/api/superadmin` base. No fixes needed.

### STEP 3 — BACKEND: PROVIDE SUPERADMIN-COMPATIBLE "ME" ENDPOINT ✅
**Task:** Add `GET /api/superadmin/me` endpoint  
**Status:** COMPLETE  
**Implementation:** Added `getSuperAdminMe()` controller that returns:
```json
{
  "user": { "id",  "email", "role", "isInternal" },
  "tenantId": null,
  "authority": "superadmin"
}
```

### STEP 4 — SESSION INIT ENDPOINT ✅
**Task:** Ensure session init endpoint exists and works  
**Status:** COMPLETE (Already implemented in previous session)  
**Endpoints:**
- `GET /api/superadmin/firms/:tenantId/assisted-synthesis/agent/session`
- `POST /api/superadmin/firms/:tenantId/assisted-synthesis/agent/messages`
- `POST /api/superadmin/firms/:tenantId/assisted-synthesis/agent/reset`

### STEP 5 — UI: CONNECTED/ERROR STATES ✅
**Task:** Show proper connected/error states in agent panel  
**Status:** COMPLETE (Already implemented)
**Features:**
- Error banner with code + requestId
- Connected state when session loads
- Input/send enabled on success
- Graceful error handling

### STEP 6 — TEST MATRIX
**Task:** Validate all functionality  
**Status:** READY FOR USER TESTING

---

## FILES CHANGED

### Backend
1. **`backend/src/controllers/superadmin.controller.ts`**
   - Added `getSuperAdminMe()` endpoint for SuperAdmin auth context verification
   - Returns user info + `tenantId: null` + `authority: 'superadmin'`

2. **`backend/src/routes/superadmin.routes.ts`**
   - Added `GET /api/superadmin/me` route
   - Positioned before agent session routes

### Frontend
- No changes needed (already using correct API surface)

---

## DEFINITION OF DONE
- [ ] Agent session init returns 200
- [ ] No network calls to `:3001`
- [ ] Agent panel shows "Connected" state
- [ ] Input enabled + Send enabled
- [ ] Console logs show requestId correlation
- [ ] No regressions to Stage 4/5/6

---

## NOTES
Primary suspicion: Agent panel bypassing SuperAdmin API surface, missing auth headers.
