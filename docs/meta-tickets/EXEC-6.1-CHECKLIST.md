# EXEC-TICKET-6.1: Authority Centralization Pre-Execute Gate

This checklist must be satisfied before any code modifications for EXEC-TICKET-06.

## 1. Target Tenant Surfaces (TCA Domain)
The following routes are canonical tenant-facing generative surfaces that must use the `AgentOrchestrator`:
- `POST /api/roadmap/qna` (capability: `QNA`)
- *Target for refactor*: `POST /api/agent/query` (currently SAS-only, needs transition to orchestrated TCA for tenants).

## 2. SAS Surfaces (SAS Domain)
The following routes are explicitly excluded from the `AgentOrchestrator` spine:
- `POST /api/superadmin/firms/:tenantId/generate-sop01`
- `POST /api/superadmin/firms/:tenantId/assemble-roadmap`
- `POST /api/superadmin/firms/:tenantId/generate-tickets`
- `POST /api/superadmin/firms/:tenantId/assisted-synthesis/*`
- `POST /api/superadmin/executive-brief/generate`
- `POST /api/superadmin/assistant/query`

## 3. Canonical Authority Resolver
- **File**: `backend/src/agents/orchestrator/AuthorityResolver.service.ts`
- **Exported Class**: `AuthorityResolver`
- **Core Method**: `static async resolve(params: { tenantId: string; userId: string; capability: string; })`

## 4. Invariants for Authority Centralization
1. **Structural Isolation**: Files in `backend/src/agents` or `backend/src/trustagent` must never import SuperAdmin-tier middleware (`requireSuperAdmin`, `requireExecutive`).
2. **Orchestrator Exclusivity**: All tenant-facing generative capabilities (`QNA`, `ROADMAP`, `TICKET`) must route through `AgentOrchestrator.run()`.
3. **SAS Direct Invocation**: SAS surfaces must continue to invoke legacy services directly to prevent operational leak into the multi-tenant TCA spine.
4. **Authority-First Execution**: The `AgentOrchestrator` must enforce a "fail-closed" policy where no capability execution occurs if `AuthorityResolver.resolve()` returns `ok: false`.
5. **Explicit Context Injection**: Controllers must always provide `tenantId` and `userId` to the orchestrator to ensure data-layer authority enforcement is possible within the resolver.

## 5. Audit Proof Pack (Pre-Execute)
### assistantQuery Isolation
`rg -n "assistantQuery" backend/src/controllers backend/src/routes`
> Result: Only found in `superadminAssistant.controller.ts` (Valid SAS).

### Direct Threads/Runs Check
`rg -n "openai\.beta\.threads" backend/src/controllers backend/src/trustagent`
> Result: 0 matches (TCA is clean of legacy thread management).

### Middleware Contamination Check
`rg -n "requireSuperAdmin|requireExecutive" backend/src/trustagent backend/src/agents`
> Result: 0 matches (TCA does not leak SuperAdmin authority concepts).
