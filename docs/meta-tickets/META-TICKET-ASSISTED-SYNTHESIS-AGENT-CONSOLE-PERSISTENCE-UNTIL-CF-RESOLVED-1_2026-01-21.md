# META-TICKET v2
**ID:** META-TICKET-ASSISTED-SYNTHESIS-AGENT-CONSOLE-PERSISTENCE-UNTIL-CF-RESOLVED-1  
**AREA:** SuperAdmin → Stage 5 Assisted Synthesis (Pre-Canonical Workspace)  
**OWNER:** AG (Junior Dev). AUTHORITY: EXECUTIVE (Tony)  
**PRIORITY:** P0  
**STATUS:** IN PROGRESS  
**DATE:** 2026-01-21

---

## MISSION
Implement an in-modal, collapsible "Reason With Agent" console for Stage 5 Assisted Synthesis with bounded persistence:
- Agent conversation persists ONLY until CURRENT FACTS are fully resolved (Accepted or Rejected).
- After CURRENT FACTS resolution completes, the agent context is hard-reset (conversation cleared) and the console auto-collapses with a minimal notice.
- No downstream effects. No ticketing/roadmap changes. No canonical side effects.

---

## HARD CONSTRAINTS / GUARDRAILS
- DO NOT touch Stage 6 Ticket Moderation or Stage 7 Roadmap Generation logic.
- DO NOT write/modify findings_canonical except via existing declareCanonicalFindings (already implemented).
- DO NOT allow the agent to auto-accept/reject/edit proposals. Human-only.
- DO NOT persist any agent content into canonical artifacts.
- The agent console is a Stage 5-only "interpretive assistant" with bounded memory and strict scope.
- Must work even if OpenAI is unavailable (graceful fallback UI + error banner).

---

## SCOPE (WHAT TO BUILD)

### A) UI/UX — Collapsible Agent Console inside Stage 5 modal
- **Placement:** Right column (Source Artifacts panel), bottom-right area (like a docked, collapsible drawer).
- **Default state:** collapsed.
- **Toggle button:** "Reason With Agent" (existing affordance) should open/close the drawer.
- **Drawer states:**
  1. **Collapsed:** small pill/button with unread count badge optional (non-blocking).
  2. **Expanded:** chat UI with message list + input + send + reset + "scope notice".
- The drawer must NOT shrink/warp the existing 3-pane layout; it overlays within the right pane or sits as a fixed-height bottom drawer.

### B) Persistence Model — "Bounded session until Current Facts resolved"
- **Create a Stage-5 session context keyed by:**
  - `tenantId`
  - `stage = assisted_synthesis`
  - `phase = current_facts`
  - `proposalsVersion` (hash or updated_at timestamp)
- **Persist conversation messages while** Current Facts `pending > 0`.
- **Trigger hard reset when:**
  - `pendingCurrentFactsCount == 0`
- **On hard reset:**
  - Clear stored messages (client + server storage)
  - Set UI banner: "Current Facts resolved. Agent context cleared."
  - Auto-collapse drawer

### C) Agent Capability — Interpretive Q&A only
**Agent is allowed to:**
- Answer operator questions
- Cite/point to source artifacts by evidence IDs / anchors (if available)
- Explain ambiguities
- Recommend which proposal items need clarification (NOT acceptance decisions)

**Agent is NOT allowed to:**
- Change any proposal statuses
- Generate new proposals (that's separate button/flow already implemented)
- Declare canonical
- Discuss tickets/roadmap

### D) API Surface (Backend)
**Add Stage 5 agent chat endpoints (SuperAdmin-only):**

1. **POST** `/api/superadmin/firms/:tenantId/assisted-synthesis/agent/messages`
   - Body: `{ sessionId, message, contextVersion }`
   - Returns: `{ reply, citations?, requestId }`

2. **GET** `/api/superadmin/firms/:tenantId/assisted-synthesis/agent/session`
   - Returns: `{ sessionId, messages[], contextVersion, phaseState }`

3. **POST** `/api/superadmin/firms/:tenantId/assisted-synthesis/agent/reset`
   - Clears session messages and returns empty session

**Storage:**
- Create new DB tables:
  - `assisted_synthesis_agent_sessions`
  - `assisted_synthesis_agent_messages`
- Must be stage-scoped and non-canonical.
- Include `requestId` correlation in logs and error responses (match prior proposal hotfix style).

### E) Context fed to Agent
**Minimum context:**
- Discovery raw notes
- Discovery Q&A (questions list + any stored answers if available)
- Diagnostic (all 4 sections)
- Executive Brief (all 5+ sections)
- Proposed findings list (current facts + friction + goals + constraints) WITH status + evidence refs
- Current Facts pending count + list of pending CF items

**Ensure agent prompt includes:**
- Strict scope boundaries
- "Interpretive only" constraint

### F) Frontend Wiring
- **Add new component:** `AssistedSynthesisAgentConsole.tsx`
- **Integrate into:** `AssistedSynthesisModal.tsx` right pane.
- **Add state handling:**
  - Load agent session on modal open.
  - Maintain messages in state; optimistic send.
  - Show loading spinner for agent response.
  - Show error banner inline within console (not global).
- **Implement reset trigger on CF resolution:**
  - Detect transition when CF pending goes from >0 to 0
  - Call backend reset endpoint
  - Clear UI
  - Auto-collapse console
  - Show one-time notice toast/banner inside modal

---

## DEFINITION OF DONE (ACCEPTANCE CRITERIA)

1. ✅ Collapsible agent console exists in Stage 5 modal as described and does not break 3-pane layout.
2. ✅ Messages persist across open/close of the console AND across modal close/reopen WHILE Current Facts have pending items.
3. ✅ When Current Facts pending count reaches 0:
   - Agent session is hard reset (backend + frontend)
   - Console auto-collapses
   - User sees minimal notice "Current Facts resolved. Agent context cleared."
4. ✅ Agent responses are constrained to interpretive Q&A; no proposal status mutation; no canonical or ticket/roadmap actions.
5. ✅ SuperAdmin auth enforced for all new endpoints.
6. ✅ Failure mode:
   - If OpenAI client missing or API key absent, UI shows actionable error with code and requestId; system does not crash.
7. ✅ Tickets are preserved:
   - Copy this META ticket and the EXEC ticket into docs/meta-tickets/ exactly once each.

---

## FILES / LOCATIONS (GUIDANCE)
- `frontend/src/superadmin/components/AssistedSynthesisModal.tsx`
- `frontend/src/superadmin/components/AssistedSynthesisAgentConsole.tsx` (NEW)
- `frontend/src/superadmin/api.ts`
- `backend/src/controllers/superadmin.controller.ts` (or dedicated controller)
- `backend/src/routes/superadmin.routes.ts`
- `backend/src/services/assistedSynthesisAgent.service.ts` (NEW)
- `backend/src/db/schema/*` (Drizzle tables)
- `docs/meta-tickets/` (store copies of both tickets)

---

## STOP CONDITION
Stop immediately after DoD is met. Do not touch Stage 6/7. Await next authority instruction.
