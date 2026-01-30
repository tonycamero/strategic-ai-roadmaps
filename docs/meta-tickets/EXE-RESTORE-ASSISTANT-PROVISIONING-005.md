# EXECUTION TICKET
ID: EXE-RESTORE-ASSISTANT-PROVISIONING-005
OWNER: Tony
AGENT: Antigravity
DATE: 2026-01-23

GOAL:
Restore assistantProvisioning.service.ts so that roadmapAgentSync.service.ts can successfully reprovision the Roadmap Coach assistant without runtime failures or behavioral drift.

HARD RULES:
- Implement ONLY the contract proven by roadmapAgentSync.service.ts
- No new assistant behavior
- No new schemas, env vars, or tools
- Fail closed if OpenAI client or vector-store utilities are missing

PHASE 0 — PROOF OF STUB
ls -la backend/src/services/assistantProvisioning.service.ts
# confirm stub / empty

PHASE 1 — INTERFACE LOCK
Implement exactly:
export async function provisionAssistantForConfig(
  agentConfigId: string,
  triggeredByUserId: string
): Promise<void>

PHASE 2 — IMPLEMENTATION (MINIMAL)
- Load agentConfigs by id
- Assemble deterministic instructions string
- Compute hash
- Skip reprovision if unchanged
- Create/update OpenAI assistant using existing client
- Persist assistant ids + metadata

PHASE 3 — INTEGRATION CHECK
pnpm -C backend build
pnpm -r build

STOP CONDITIONS:
- Missing OpenAI client wrapper
- Missing vector store utility with no prior reference
- Ambiguous instruction composition

DELIVER:
- assistantProvisioning.service.ts diff
- proof of successful import + execution from roadmapAgentSync
- build output excerpt

END STATE:
Roadmap Coach provisioning restored. No stubs. No invention. Build proceeds.
