# META-TICKET v2
TITLE: Trust Console Agent (TCA) Orchestrator Refactor + SAS Separation Lock

OBJECTIVE
Collapse all tenant-facing generative flows into a single Trust Console Agent (TCA) orchestration spine with gravity-based mode control, while preserving SuperAdmin Synthesis (SAS) as a structurally separate agent. Eliminate parallel LLM invocation surfaces and enforce canonical authority gating before any roadmap or ticket generation.

SCOPE
Backend only (controllers + services).
No frontend refactors in this ticket.
No production branch merges until all checkpoints pass on staging.

NON-GOALS
- No prompt rewriting.
- No model changes.
- No economic logic changes.
- No ROI baseline mutations.
- No SAS absorption into TCA.

-------------------------------------------------------------------------------

PHASE 0 — STRUCTURAL INVENTORY (NO CODE MODIFICATION)

TASK 0.1
Inventory all OpenAI call sites and classify as:
- TENANT (must become TCA)
- SUPERADMIN (SAS)
- INTERNAL (scripts/tests only)

OUTPUT REQUIRED
docs/analysis/LLM_SURFACE_INVENTORY.md

HARD STOP A
No ambiguity remains about which routes are tenant vs SAS.

-------------------------------------------------------------------------------

PHASE 1 — INTRODUCE ORCHESTRATOR SPINE (NON-DISRUPTIVE)

CREATE
backend/src/trustagent/services/orchestrator.service.ts

IMPLEMENT
class AgentOrchestrator {
  run({ tenantId, userId, capability, input })
}

SUBCOMPONENTS
- AuthorityResolver
- GravitySelector
- CapabilityRouter

REQUIREMENTS
- No controller rewiring yet.
- No behavior change.
- No LLM calls removed yet.

HARD STOP B
Backend compiles.
No route behavior changes.

-------------------------------------------------------------------------------

PHASE 2 — CONVERT roadmapQnA TO TCA ORCHESTRATOR

REFactor
backend/src/controllers/roadmapQnA.controller.ts

REMOVE
Direct call to callRoadmapQnAAgent()

REPLACE WITH
AgentOrchestrator.run(capability="QNA")

VERIFY
rg -n "callRoadmapQnAAgent" backend/src/controllers
→ 0 results

HARD STOP C
Manual test:
- Pre-roadmap QnA works
- Post-roadmap QnA works
No identity split.

-------------------------------------------------------------------------------

PHASE 3 — COLLAPSE ALL TENANT LLM SURFACES

REWIRE
- trustagent.routes.ts
- pulseagent.routes.ts
- assistantAgent.routes.ts (if active)

ALL tenant LLM calls must route through AgentOrchestrator.

VERIFY
rg -n "chat\.completions\.create" backend/src/controllers
→ 0 tenant controller matches

HARD STOP D
No tenant controller directly invokes OpenAI.

-------------------------------------------------------------------------------

PHASE 4 — CENTRALIZE AUTHORITY ENFORCEMENT

MOVE lifecycle checks into:
AuthorityResolver

REMOVE from controllers:
- baseline status checks
- roadmap existence checks
- sufficiency logic
- lock enforcement

VERIFY
rg -n "status ===|LOCK|SUFFICIENCY|baselineLocked" backend/src/controllers
→ no lifecycle enforcement remaining

HARD STOP E
Controllers no longer enforce lifecycle.

-------------------------------------------------------------------------------

PHASE 5 — IMPLEMENT GRAVITY MODE

GravitySelector logic:
IF roadmap exists → mode = execution_bias
ELSE → mode = thinking_partner

MODE MUST:
- Influence capability routing
- Influence system instruction context
- Not create identity split

HARD STOP F
Manual prompt test:
Pre-roadmap: Identity = Trust Console Agent (Thinking Partner)
Post-roadmap: Identity = Trust Console Agent (Execution Bias)

-------------------------------------------------------------------------------

PHASE 6 — LOCK SAS AS STRUCTURALLY SEPARATE

DO NOT ROUTE THROUGH ORCHESTRATOR:
- assistedSynthesisAgent.service
- assistedSynthesisProposals.service
- executive brief generation
- diagnostic ingestion

VERIFY
rg -n "AgentOrchestrator" backend/src/controllers/superadmin
→ 0 results

HARD STOP G
SAS untouched and independent.

-------------------------------------------------------------------------------

PHASE 7 — SCHEMA ENFORCEMENT LAYER

ENFORCE
- FINDINGS_OBJECT_SCHEMA
- TICKET_COMPILATION_RULES
- ROADMAP_COMPILATION_RULES

All enforcement must occur before generation result persists.

Fail closed on:
- malformed findings
- tickets without findingId trace
- narrative injection into roadmap

HARD STOP H
Inject invalid payload → system rejects deterministically.

-------------------------------------------------------------------------------

PHASE 8 — REMOVE LEGACY BYPASS ROUTES

Refactor endpoints:
- /generate-tickets
- /assemble-roadmap
- /refreshRoadmap

All must call AgentOrchestrator.

VERIFY
rg -n "generateTickets|assemble-roadmap|refreshRoadmap" backend/src
→ must show orchestrator mediation

HARD STOP I
No direct roadmap/ticket generation services callable without TCA.

-------------------------------------------------------------------------------

PHASE 9 — OBSERVABILITY + AUDIT

Each orchestrator invocation must write:
- tenantId
- userId
- capability
- gravityMode
- authorityDecision

HARD STOP J
Trigger tenant QnA → audit row written.

-------------------------------------------------------------------------------

ARCHITECTURAL END STATE

Two Agents Only:

1) SAS (SuperAdmin)
   - Synthesis
   - Moderation
   - Executive Brief
   - Diagnostic shaping

2) TCA (Tenant)
   - Single orchestrated entrypoint
   - Authority-gated
   - Gravity-aware
   - Roadmap-biased post-assembly

No parallel generative surfaces.
No lifecycle enforcement drift.
No identity ambiguity.
No economic modeling outside authority spine.

-------------------------------------------------------------------------------

PROMOTION RULE

Staging only until:
- Hard Stops A–J complete
- Manual tenant tests pass
- SAS confirmed isolated
- No OpenAI bypass routes remain

Promotion path:
staging → PR → release/api
Never direct push.

END META-TICKET
