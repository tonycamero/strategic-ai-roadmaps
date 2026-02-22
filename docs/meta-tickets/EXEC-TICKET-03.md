EXEC-TICKET-03
Title: Convert roadmapQnA.controller to Orchestrator Entry

Objective:
Refactor roadmapQnA.controller.ts to call AgentOrchestrator.run()
with capability='QNA'

Constraints:
- Remove direct callRoadmapQnAAgent invocation
- Controller becomes thin adapter
- No change to route URL

Add invariant:
- roadmapQnA.controller.ts MUST NOT import or call OpenAI client/services directly.
- It may only call AgentOrchestrator.run({ capability: 'QNA', ... }).

Validation:

rg -n "callRoadmapQnAAgent" backend/src
# should return 0 occurrences in controllers

pnpm -C backend typecheck

Exit Criteria:
- QnA works
- No direct OpenAI call in roadmapQnA.controller.ts
