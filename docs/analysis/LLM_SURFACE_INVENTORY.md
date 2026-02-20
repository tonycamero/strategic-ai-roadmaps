# LLM Surface Classification Table (PHASE 0 Output)

| Surface (Route / Endpoint) | Controller | Downstream Service | Direct OpenAI Call? (Y/N) | Mechanism | Current Gate Check | Surface Type | ReachableFromRuntime | OrchestratorRequired | Final Classification | Required Action |
| -------------------------- | ---------- | ------------------ | ------------------------- | --------- | ------------------ | ------------ | -------------------- | -------------------- | -------------------- | --------------- |
| `/api/roadmap/qna` | `roadmapQnA.controller.ts` | `AgentOrchestrator.service.ts` | Y (via ModelClient) | Chat Completion | `requireTenantAccess` | TENANT_RUNTIME | YES | YES | TCA | Refactor complete |
| `/api/public/pulseagent/homepage/chat` | `webinar.controller.ts` | `diagnosticChat` | Y | Deterministic | none | PUBLIC | YES | NO | REMOVE | Delete Surface (410) |
| `/api/public/trustagent/homepage/chat` | `webinar.controller.ts` | `diagnosticChat` | Y | Deterministic | none | PUBLIC | YES | NO | REMOVE | Delete Surface (410) |
| `/api/assistant/query` | `assistantAgent.controller.ts` | `assistantQuery.service.ts` | Y | Threads/Runs | `authenticate` | TENANT_RUNTIME | YES | YES | REMOVE | Delete Surface (410) |
| `/api/agent/query` | `agent.controller.ts` | `agent.service.ts` | Y | Chat Completion | `authenticate` | TENANT_RUNTIME | YES | YES | TCA | Refactor → Orchestrator |
| `/api/superadmin/assistant/query` | `superadminAssistant.controller.ts` | `assistantQuery.service.ts` | Y | Threads/Runs | `requireSuperAdmin` | SUPERADMIN_RUNTIME | YES | NO | SAS | Leave as SAS |
| `ORPHANED_SERVICE` | N/A | `publicAgentSession.service.ts` | Y | Threads/Runs | none | PUBLIC | NO (ORPHANED) | NO | REMOVE | Delete file |
| `/api/superadmin/firms/:tenantId/generate-sop01` | `superadmin.controller.ts` | `sop01Engine.ts` | Y | Chat Completion | `requireSuperAdmin` | SUPERADMIN_RUNTIME | YES | NO | SAS | Leave as SAS |
| `/api/superadmin/firms/:tenantId/assemble-roadmap` | `superadmin.controller.ts` | `roadmapAssembly.service.ts` | Y | Chat Completion | `requireSuperAdmin` | SUPERADMIN_RUNTIME | YES | NO | SAS | Leave as SAS |
| `/api/superadmin/firms/:tenantId/generate-tickets` | `superadmin.controller.ts` | `sopTicketGenerator.service.ts` | Y | Chat Completion | `requireSuperAdmin` | SUPERADMIN_RUNTIME | YES | NO | SAS | Leave as SAS |
| `/api/superadmin/firms/:tenantId/assisted-synthesis/generate-proposals` | `superadmin.controller.ts` | `assistedSynthesisProposals.service.ts` | Y | Chat Completion | `requireSuperAdmin` | SUPERADMIN_RUNTIME | YES | NO | SAS | Leave as SAS |
| `/api/superadmin/firms/:tenantId/assisted-synthesis/agent/messages` | `superadmin.controller.ts` | `assistedSynthesisAgent.service.ts` | Y | Chat Completion | `requireSuperAdmin` | SUPERADMIN_RUNTIME | YES | NO | SAS | Leave as SAS |
| `/api/superadmin/firms/:tenantId/executive-brief/generate` | `executiveBrief.controller.ts` | `executiveBriefMirrorNarrative.service.ts` | Y | Chat Completion | `requireExecutive` | SUPERADMIN_RUNTIME | YES | NO | SAS | Leave as SAS |
| `Internal Ingestion Script` | N/A | `sop01Engine.ts` | Y | Chat Completion | N/A | INTERNAL_SCRIPT | NO | NO | INTERNAL_ONLY | Leave Internal |
| `Diagnostic Rerun` | `diagnosticRerun.controller.ts` | `sop01Engine.ts` | Y | Chat Completion | `requireSuperAdmin` | SUPERADMIN_RUNTIME | YES | NO | SAS | Leave as SAS |
| `Narrative Rendering` | N/A (Internal) | `narrativeRenderer.service.ts` | Y | Chat Completion | N/A | INTERNAL_SCRIPT | NO | NO | INTERNAL_ONLY | Triggered by SAS |

---

## Mapping Proof (Call Sites to Routes)

1. **ModelClient.service.ts**: Central interface for `AgentOrchestrator`. Routes: `/api/roadmap/qna`, `/api/public/pulseagent/homepage/chat`.
2. **assistantQuery.service.ts**: Uses `openai.beta.threads.runs.createAndPoll` (Threads/Runs) on line 284. Used by `assistantAgent.controller.ts` and `superadminAssistant.controller.ts`.
3. **publicAgentSession.service.ts**: Uses `openai.beta.threads.runs.createAndPoll` (Threads/Runs) on line 157. Currently ORPHANED (no runtime caller found).
4. **agent.service.ts**: Used by `agent.controller.ts` (`/api/agent/query`).
4. **sop01Engine.ts**: Used by `superadmin.controller.ts` (`/generate-sop01`) and `diagnosticRerun.controller.ts`.
5. **roadmapAssembly.service.ts**: Used by `superadmin.controller.ts` (`/assemble-roadmap`).
6. **executiveBriefMirrorNarrative.service.ts**: Used by `executiveBrief.controller.ts` during brief generation.
7. **narrativeRenderer.service.ts**: Used internally by `finalRoadmap.service.ts` (triggered by assembly).

---

## Column Definitions (do not change)

**Surface (Route / Endpoint)**
The actual HTTP entrypoint (e.g. `/api/trustagent/query`, `/api/superadmin/firms/:tenantId/generate-tickets`)

**Controller**
The controller file + method that handles it.

**Downstream Service**
The service that eventually reaches OpenAI (if any).

**Direct OpenAI Call? (Y/N)**
Does this path directly call `chat.completions.create`, `queryAssistant`, or a provisioning API?

**Mechanism**
The technical implementation: Chat Completion, Assistant API, or Orchestrator routing.

**Current Gate Check**
What gate protects it *today*?

* none
* requireExecutive
* requireDelegateOrHigher
* gate.service
* authority.service
* mixed
* unclear

**Surface Type**
Choose one:
* TENANT_RUNTIME
* SUPERADMIN_RUNTIME
* PUBLIC
* INTERNAL_SCRIPT
* TEST_ONLY

**ReachableFromRuntime**
Can the surface be triggered via a public or authenticated API request? (YES/NO).

**OrchestratorRequired**
Must this surface route through the neutral TCA spine to satisfy AGENT_DOMAIN separation? (YES/NO).

**Final Classification**
Choose one:
* TCA (must route through orchestrator)
* SAS (separate SuperAdmin agent)
* INTERNAL_ONLY
* REMOVE

**Required Action**
One of:
* Refactor → Orchestrator
* Leave as SAS
* Leave Internal
* Add Gate
* Delete Surface
