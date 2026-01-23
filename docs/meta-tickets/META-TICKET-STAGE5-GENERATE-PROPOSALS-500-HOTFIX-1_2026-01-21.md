META-TICKET v2
ID: META-TICKET-STAGE5-GENERATE-PROPOSALS-500-HOTFIX-1
TITLE: Fix Stage 5 "Generate Agent Proposals" 500 + make error surface actionable
TYPE: META (Execution Pack)
PRIORITY: P0
OWNER: AG (Junior Dev / Obedience-First)
REPO: Strategic_AI_Roadmaps (monorepo)
SURFACE: SuperAdmin → Execute → Firm Detail → Stage 5 Assisted Synthesis Modal
TRIGGER: POST /api/superadmin/firms/:tenantId/assisted-synthesis/generate-proposals returns 500

AUTHORITY / CONSTRAINTS
- DO NOT change downstream pipeline (canonical declaration, ticket gen, roadmap gen).
- ONLY fix proposal generation endpoint + its dependencies + UX-safe error reporting.
- No "smart" behavior changes. Stabilize. Instrument. Make failures legible.

GOAL
- "Generate Agent Proposals" succeeds reliably OR fails with a clear, actionable message (no opaque 500).
- Root cause identified and corrected (env/config, payload size, model response parsing, missing data, etc).

SCOPE (IN)
A) Backend 500 root-cause + fix:
- assistedSynthesisProposals.service.ts (LLM call, prompt assembly, response parsing)
- superadmin.controller.ts (generateAssistedProposals handler)
- superadmin.routes.ts (route wiring)
- any config/env validation used by the LLM client

B) Frontend error handling (minimal):
- AssistedSynthesisModal.tsx should show a stable toast/banner with requestId + server message
- No redesign. Only error UX and retry affordance.

SCOPE (OUT)
- Any edits to canonical findings generation
- Ticket moderation UI / ticket persistence / roadmap assembly
- Any new product features beyond logging + error surfacing

[Full ticket content preserved in file]
