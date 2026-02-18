# TC-AGENT-EVO-02 — CURRENT AGENT STATE EXTRACTION (READ-ONLY)

PROMPTS / MODES / GUARDRAILS / CONTEXT BINDING

MODE: FORENSIC / READ-ONLY (GEMINI FAIL-CLOSED)
Rules:
- Do NOT propose changes.
- Do NOT refactor.
- Do NOT redesign prompts.
- Only extract and report what exists.
- If unclear: INSUFFICIENT DATA.
- If missing: NOT FOUND.
- Every claim must cite file path + line range (or paste verbatim blocks).

TARGET REPO
/home/tonycamero/code/Strategic_AI_Roadmaps

SCOPE TARGET FILES (FROM D1)
FRONTEND (UI + chat shell)
- frontend/src/trustagent/TrustAgentShell.tsx
- frontend/src/trustagent/HomepageChatBody.tsx
- frontend/src/superadmin/pages/SuperAdminAgentPage.tsx

BACKEND (agent + routes)
- backend/src/controllers/agent.controller.ts
- backend/src/controllers/command_center.controller.ts
- backend/src/routes/trustagent.routes.ts

BACKEND (prompt + context)
- backend/src/trustagent/homepagePromptCore.ts
- backend/src/trustagent/services/roadmapQnAContext.service.ts
- backend/src/trustagent/prompts/ticketsToRoadmap.ts

BACKEND (narrative / assembly / roadmap)
- backend/src/services/narrativeAssembly.service.ts
- backend/src/services/roadmapAssembly.service.ts
- backend/src/narrative/engine.ts

BACKEND (authority / guardrails)
- backend/src/services/authority.service.ts
- backend/src/middleware/authority.ts
- backend/src/config/authorityVersions.ts

IMPORTANT: If any of these paths are wrong, do NOT guess replacements. Report NOT FOUND and list the closest matches (file paths only).

============================================================
STEP 0 — PROVE FILE EXISTS + GET LINE COUNTS (NO CONTENT YET)
============================================================
Run for each file:
- test -f "<path>" && echo "OK <path>" || echo "MISSING <path>"
- wc -l "<path>"  (if OK)

Output the OK/MISSING list first.

============================================================
STEP 1 — IDENTIFY AGENT IDENTITY + ENTRYPOINTS
============================================================
Goal: Where is the “agent” defined as a callable unit?

For these backend files:
- backend/src/controllers/agent.controller.ts
- backend/src/routes/trustagent.routes.ts
- backend/src/trustagent/homepagePromptCore.ts

Extract:
A) exported handler/function names that represent “agent” interaction
B) any constants describing identity (name, role, system message, etc.)
C) any “mode” names (roadmap mode, trust mode, etc.) if present

Output:
- file path + line ranges + a short bullet of what each export does.

============================================================
STEP 2 — EXTRACT PROMPT BLOCKS (VERBATIM)
============================================================
Goal: Pull the actual prompt text and system instructions currently used.

Search within:
- backend/src/trustagent/homepagePromptCore.ts
- backend/src/narrative/engine.ts
- backend/src/services/narrativeAssembly.service.ts
- backend/src/services/roadmapAssembly.service.ts
- backend/src/trustagent/services/roadmapQnAContext.service.ts
- backend/src/trustagent/prompts/ticketsToRoadmap.ts

Look for:
- template strings containing long instructions
- arrays named like messages/system/user
- variables like systemPrompt, promptCore, instructions, persona, policies
- “You are …” blocks
- any imported prompt modules

Requirement:
- Paste prompt text verbatim blocks (exact strings).
- Include file path + line range for each prompt block.

============================================================
STEP 3 — EXTRACT MODE DEFINITIONS (VERBATIM)
============================================================
Goal: Identify whether modes exist, and how switching occurs.

Look for:
- mode enums/constants
- conditionals selecting different prompts
- endpoint parameter selecting behavior

Output:
- mode names
- trigger conditions (inputs)
- file path + line range

============================================================
STEP 4 — EXTRACT GUARDRAILS (VERBATIM)
============================================================
Goal: Identify advisory-only / no-execution constraints and fail-closed enforcement.

Extract from:
- backend/src/services/authority.service.ts
- backend/src/middleware/authority.ts
- backend/src/controllers/agent.controller.ts
- backend/src/controllers/command_center.controller.ts (if it touches execution)

Find and extract:
- prohibitions / “must not” / “cannot”
- validation checks around stage gating
- any “truth matrix” reconciliation logic that gates agent outputs or stage transitions
- any explicit “advisory-only” language (or absence)

Output:
- guardrail blocks verbatim (or code snippet if it’s purely logic)
- file path + line range
- 1-line description of what it prevents

STOP CONDITION:
If ANY code path allows writing to external systems (webhooks, GHL mutation, etc.) via the agent endpoint:
- STOP and report that path + call chain.

============================================================
STEP 5 — CONTEXT BINDING MAP (NO OPINIONS)
============================================================
Goal: Determine exactly what context is injected into prompts.

For each agent invocation path:
- list inputs consumed (tenant/org, intake, artifacts, narrative, roadmap, tickets, etc.)
- identify where they are loaded (db calls, files, services)
- identify how they are serialized into prompt/messages

Output:
- a simple chain map:
  Controller → Service → Context Builder → Prompt → LLM Call

Include file paths for each link.

============================================================
STEP 6 — LLM INVOCATION SURFACES (WHERE ACTUAL MODEL CALLS HAPPEN)
============================================================
Search repo for:
- openai / anthropic / gemini / generateContent / chat.completions / messages.create / invokeModel
- HTTP calls to LLM gateways
- internal wrapper client

Commands:
- rg -n --hidden -S "openai|anthropic|gemini|generateContent|chat\\.completions|messages\\.create|invokeModel" backend shared api frontend || true

Output:
- list files containing calls
- for each: function name + file path + line range
- note how model is chosen (env var? config? hardcoded?) if visible

============================================================
OUTPUT FORMAT (STRICT)
D2 — Agent State Snapshot

SECTION A: Files Present / Missing (with line counts)
SECTION B: Agent Identity + Entrypoints (paths + line ranges)
SECTION C: Prompt Blocks (verbatim + paths + line ranges)
SECTION D: Mode Blocks (verbatim + paths + line ranges)
SECTION E: Guardrails (verbatim/snippets + paths + line ranges)
SECTION F: Context Binding Map (controller→service→prompt chain)
SECTION G: LLM Invocation Points (paths + line ranges)

END CHECK (must include)
- “Did I propose changes?” YES/NO (must be NO)
- “Did I assume missing pieces?” YES/NO (must be NO)
- “Any execution hooks found?” YES/NO + evidence
STOP after D2.
