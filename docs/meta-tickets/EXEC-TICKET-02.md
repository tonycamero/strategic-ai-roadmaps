EXEC-TICKET-02
Title: Introduce AgentOrchestrator Spine (No Route Changes)

Objective:
Create a canonical orchestrator entrypoint for tenant-facing LLM execution.

Create:
backend/src/agents/orchestrator/AgentOrchestrator.service.ts
backend/src/agents/orchestrator/AuthorityResolver.service.ts
backend/src/agents/orchestrator/GravitySelector.service.ts

Interface:

run({
  tenantId: string,
  userId: string,
  capability: 'QNA' | 'ROADMAP' | 'TICKET',
  payload: unknown
}): Promise<AgentResult>

Rules:
- No OpenAI calls in controllers
- No route modifications yet
- Must compile cleanly

WSL:

pnpm -C backend typecheck

Exit Criteria:
- Backend compiles
- Orchestrator exported
