# EXECUTION TICKET
**ID:** EXEC-TICKET-STAGE5-ASSISTED-SYNTHESIS-AGENT-CONSOLE-1  
**PARENT:** META-TICKET-ASSISTED-SYNTHESIS-AGENT-CONSOLE-PERSISTENCE-UNTIL-CF-RESOLVED-1  
**DATE:** 2026-01-21  
**STATUS:** IN PROGRESS

---

## GOAL
Ship the Stage 5 "Reason With Agent" console with bounded persistence until Current Facts are resolved, including backend session storage + endpoints + frontend component integration.

---

## TASKS (ORDERED)

### 1) Codebase Recon ✅
- [x] Locate `AssistedSynthesisModal.tsx` and current Stage 5 wiring.
- [x] Locate evidenceMap / artifact loaders used by Stage 5.
- [x] Locate existing OpenAI client implementation path (`backend/src/ai/openaiClient.ts`).

### 2) Backend: Agent Session Storage
- [ ] Add Drizzle schema + migrations for agent sessions/messages.
- [ ] Implement session creation/retrieval by `tenantId + contextVersion + phase`.

**Tables to create:**
```typescript
// assisted_synthesis_agent_sessions
{
  id: uuid (PK)
  tenantId: string
  stage: 'assisted_synthesis'
  phase: 'current_facts'
  contextVersion: string  // hash or timestamp of proposals
  createdAt: timestamp
  updatedAt: timestamp
}

// assisted_synthesis_agent_messages
{
  id: uuid (PK)
  sessionId: uuid (FK to sessions)
  role: 'user' | 'assistant'
  content: text
  createdAt: timestamp
}
```

### 3) Backend: Agent Chat Endpoints
- [ ] Implement `GET /api/superadmin/firms/:tenantId/assisted-synthesis/agent/session`
- [ ] Implement `POST /api/superadmin/firms/:tenantId/assisted-synthesis/agent/messages`
- [ ] Implement `POST /api/superadmin/firms/:tenantId/assisted-synthesis/agent/reset`
- [ ] Add `requestId` correlation + structured errors:
  - `LLM_CONFIG_MISSING`
  - `LLM_CLIENT_MISSING`
  - `LLM_API_FAILED`
  - `SESSION_PERSIST_FAILED`

### 4) Backend: Agent Prompt + Context Assembly
- [ ] Build context pack from:
  - Discovery raw notes
  - Discovery Q&A
  - Diagnostic (all 4 sections)
  - Executive Brief (all 5+ sections)
  - Proposed findings list (with status + evidence refs)
  - Current Facts pending count
- [ ] Enforce system prompt constraints for Stage 5 only (interpretive Q&A, no mutations).

**System Prompt Template:**
```
You are an interpretive assistant for Stage 5 Assisted Synthesis in a strategic AI roadmapping tool.

STRICT SCOPE:
- You may ONLY answer questions about the provided source artifacts and proposed findings.
- You may cite specific evidence anchors or quote from source artifacts.
- You may explain ambiguities or recommend which proposals need operator clarification.
- You MUST NOT accept, reject, or edit any proposals. Only the human operator can do that.
- You MUST NOT discuss Stage 6 (Ticket Moderation) or Stage 7 (Roadmap Generation).
- You MUST NOT reference or modify canonical findings.

CONTEXT PROVIDED:
- Discovery Call Notes (raw operator notes from client interview)
- Discovery Q&A (questions + answers if available)
- Diagnostic (4 sections: Strategic Overview, AI Opportunities, Roadmap Skeleton, Discovery Questions)
- Executive Brief (5+ sections: Executive Summary, Operating Reality, Constraint Landscape, Blind Spot Risks, Alignment Signals)
- Proposed Findings (Current Facts, Friction Points, Goals, Constraints) with status and evidence references
- Current Facts Pending Count: {pendingCount}

Your role is to help the operator understand and resolve Current Facts proposals ONLY.
```

### 5) Frontend: Agent Console Component
- [ ] Create `AssistedSynthesisAgentConsole.tsx`
  - Drawer UI (collapsible, bottom-right)
  - Message list (scrollable)
  - Input + Send button
  - Loading spinner for agent response
  - Inline error banner
  - "Scope notice" (persistent reminder)
  - Reset button (optional, for manual clear)
- [ ] Wire to new endpoints via `superadmin/api.ts`.

**Component Structure:**
```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

interface AgentConsoleProps {
  tenantId: string;
  currentFactsPending: number;
  onReset: () => void;
}
```

### 6) Frontend: Persistence + Reset Gate
- [ ] On modal open: load agent session if CF pending > 0
- [ ] On message send: append to local state + call POST message endpoint
- [ ] On CF pending becomes 0:
  - Call reset endpoint
  - Clear UI messages
  - Auto-collapse console
  - Show notice: "Current Facts resolved. Agent context cleared."
- [ ] Error handling: show inline error banner with code + requestId

**Reset Detection Logic:**
```typescript
useEffect(() => {
  if (previousPending > 0 && currentFactsPending === 0) {
    handleAgentReset();
  }
}, [currentFactsPending]);
```

### 7) QA Checklist
- [ ] Validate persistence across modal close/reopen while CF pending > 0.
- [ ] Validate reset when CF pending becomes 0.
- [ ] Validate OpenAI missing config error is surfaced with requestId and no crash.
- [ ] Validate agent cannot accept/reject proposals.
- [ ] Validate agent responses stay within scope (no ticket/roadmap discussion).

---

## FILES TO CREATE/MODIFY

### Backend (NEW)
- `backend/src/db/schema/assistedSynthesisAgent.ts` - New schema
- `backend/src/services/assistedSynthesisAgent.service.ts` - Agent logic + LLM calls
- `backend/src/controllers/assistedSynthesisAgent.controller.ts` - Endpoint handlers

### Backend (MODIFY)
- `backend/src/routes/superadmin.routes.ts` - Add 3 new routes
- `backend/src/db/schema.ts` or `index.ts` - Export new tables

### Frontend (NEW)
- `frontend/src/superadmin/components/AssistedSynthesisAgentConsole.tsx` - Console UI

### Frontend (MODIFY)
- `frontend/src/superadmin/components/AssistedSynthesisModal.tsx` - Integrate console
- `frontend/src/superadmin/api.ts` - Add 3 new API methods

---

## STOP CONDITION
Stop immediately after DoD is met. Do not touch Stage 6/7. Await next authority instruction.
