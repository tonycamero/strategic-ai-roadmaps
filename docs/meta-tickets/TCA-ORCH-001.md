# META-TICKET: TCA-ORCH-001
**ID**: TCA-ORCH-001
**TITLE**: Convert roadmapQnA.controller.ts to route through new TCA Orchestrator (no direct OpenAI calls)
**SCOPE**: backend only (tenant-facing); minimal blast radius; keep file names stable
**BRANCH**: staging
**AUTHORITY**: This ticket is authoritative for all edits listed below.

## GOAL
- roadmapQnA.controller.ts must NOT call OpenAI directly.
- roadmapQnA.controller.ts becomes a thin adapter that calls TcaOrchestrator.runTenantMessage().
- Introduce new orchestrator + model wrapper under trustagent/orchestrator/.
- Preserve existing /api/roadmap/qna behavior (request/response shape) unless explicitly incompatible.

## NON-GOALS
- No assistant provisioning changes.
- No removal of legacy routes.
- No new DB schema changes.
- No “agent merge” work beyond this surface.

## HARD INVARIANTS
- Tenant-facing OpenAI call sites: ONLY via trustagent/orchestrator/tcaModelClient.ts (new).
- No new OpenAI imports in roadmapQnA.controller.ts.
- Fail-closed on missing tenantId/userId/context (return 400/401 as appropriate).

## FILES TO ADD
1) backend/src/trustagent/orchestrator/types.ts
2) backend/src/trustagent/orchestrator/tcaContextBuilder.service.ts
3) backend/src/trustagent/orchestrator/tcaModelClient.ts
4) backend/src/trustagent/orchestrator/tcaOrchestrator.service.ts

## FILES TO EDIT
1) backend/src/controllers/roadmapQnA.controller.ts

## IMPLEMENTATION PLAN (A→Z)
A) Create orchestrator types
- ContextPack: { tenantId, userId, mode, roadmapQnAContext?, currentView?, gates?, artifactsMeta? }
- RunTenantMessageRequest: { tenantId, userId, message, currentView? }
- RunTenantMessageResult: { answer: string, mode: 'PRE_ROADMAP'|'POST_ROADMAP' }

B) Implement tcaContextBuilder.service.ts
- MUST be deterministic.
- For v0: use existing buildRoadmapQnAContext(tenantId) to populate contextPack.roadmapQnAContext.
- Mode resolution v0:
  - if roadmapQnAContext indicates roadmap present OR buildRoadmapQnAContext can infer it -> POST_ROADMAP else PRE_ROADMAP
  - If cannot infer reliably, default PRE_ROADMAP (fail-closed).
- No OpenAI calls here.

C) Implement tcaModelClient.ts
- Centralized OpenAI call wrapper.
- Uses existing OpenAI client factory (prefer: backend/src/ai/openaiClient.ts createOpenAIClient()).
- Exports: callTcaChat({ system, messages, requestId, tenantId }) -> string
- Logging: console.log minimal (requestId, tenantId, mode) but DO NOT log full tenant content.

D) Implement tcaOrchestrator.service.ts
- runTenantMessage(req):
  1) Build ContextPack via tcaContextBuilder
  2) Build prompt/messages:
     - System prompt: concise, grounded, no invention, reference context provided.
     - User message: raw message
     - Context injection: include roadmapQnAContext block if present
  3) Call tcaModelClient
  4) Return { answer, mode }

E) Convert roadmapQnA.controller.ts
- Remove import/use of callRoadmapQnAAgent (or keep unused removed).
- Replace body to:
  - extract tenantId/userId/message/currentView (as currently supported)
  - call TcaOrchestrator.runTenantMessage({ tenantId, userId, message, currentView })
  - return same JSON shape as before (ensure “answer” field matches existing contract)
- Ensure errors map cleanly (400 for missing inputs, 500 for internal).

## Acceptance Gates (must pass)
1) No direct OpenAI call from roadmapQnA.controller.ts:
   rg -n "OpenAI\\(|chat\\.completions\\.create\\(" backend/src/controllers/roadmapQnA.controller.ts && exit 1 || true
2) Only orchestrator model client calls OpenAI (new file allowed):
   rg -n "chat\\.completions\\.create\\(" backend/src/trustagent/orchestrator -S
3) Typecheck + build:
   pnpm -C backend -s run typecheck
   pnpm -C backend -s run build:functions
