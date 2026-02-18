# EXEC-TICKET — TC-TENANT-COPILOT-STATE+CTX — READ-ONLY EXTRACTION
SCOPE: TENANT “TrustAgent — Executive Roadmap Copilot” ONLY
GOAL: Prove (with file paths) what context is currently available and what is actually injected.

MODE: FORENSIC / READ-ONLY
Rules:
- Do NOT propose changes.
- Do NOT refactor.
- Do NOT touch SuperAdmin surfaces.
- Extract only tenant-facing copilot prompt + context binding + available artifact sources.
- Every claim must cite file path + line range.
- If a data source exists but is not injected, mark it clearly: AVAILABLE_NOT_BOUND.

TARGET
/home/tonycamero/code/Strategic_AI_Roadmaps

REQUIRED DATA SOURCES (MUST CHECK EACH)
S1 Intake Data
- owner intake
- team intakes (ops/sales/delivery)

S2 Artifacts (read-only truth)
- executive brief
- diagnostic outputs
- discovery notes / discovery Q&A
- assisted synthesis outputs (if any exist as artifacts)
- ticket moderation state (accepted/rejected/pending)
- roadmap draft/final (if exists)

S3 Authority / Truth
- authority stage status
- truth matrix / artifact validity status (if stored)

============================================================
STEP 1 — LOCATE TENANT COPILOT UI + API ROUTE
============================================================
Command:
rg -n --hidden -S "Your Executive Roadmap Copilot|Ask about your roadmap|TrustAgent" frontend/src || true

Output:
- UI file paths
- identify API endpoint used (fetch/axios) with line range

============================================================
STEP 2 — LOCATE TENANT COPILOT BACKEND HANDLER
============================================================
Use the route from Step 1 and locate:
- route file
- controller handler

Output:
- file paths + line ranges

============================================================
STEP 3 — EXTRACT TENANT COPILOT PROMPT (VERBATIM)
============================================================
From controller/service chain, locate system prompt + message construction.
Output:
- prompt block(s) verbatim
- file path + line range

============================================================
STEP 4 — CONTEXT BINDING MAP (TENANT ONLY)
============================================================
Map:
UI → API Route → Controller → Context Builder/Service → Prompt → LLM Call

Output:
- chain with file paths + line ranges

============================================================
STEP 5 — INVENTORY ALL AVAILABLE CONTEXT SOURCES IN BACKEND
============================================================
Goal: Find where S1–S3 live in code (services/db queries), regardless of whether tenant copilot uses them.

Commands (backend only):
rg -n --hidden -S "intake|owner intake|team intake|stakeholder|responses" backend/src || true
rg -n --hidden -S "executive brief|exec brief|diagnostic|discovery|raw notes|q&a|artifact" backend/src || true
rg -n --hidden -S "ticket moderation|accepted|rejected|pending|SOP" backend/src || true
rg -n --hidden -S "roadmap draft|final roadmap|roadmap" backend/src || true
rg -n --hidden -S "authority|truth matrix|artifact truth|resolveCanonicalAuthority" backend/src || true

Output:
For each source S1–S3:
- List the best file path(s) that load/store/return it
- 1-line description
- Mark each as:
  - BOUND_TO_TENANT_COPILOT
  - AVAILABLE_NOT_BOUND
  - NOT_FOUND

============================================================
STEP 6 — LLM INVOCATION CONFIRMATION (TENANT ONLY)
============================================================
Locate model call used for tenant copilot.
Confirm:
- model name
- config vs hardcoded
- any parameters

Output:
- file path + line range

============================================================
OUTPUT FORMAT (STRICT)

D-TENANT+CTX — Tenant Copilot State + Context Inventory

SECTION A: Tenant Copilot UI Surface
SECTION B: Tenant Copilot API Route + Controller
SECTION C: Tenant Copilot Prompt (verbatim)
SECTION D: Tenant Copilot Context Binding Map
SECTION E: Data Source Inventory (S1–S3) with binding status
SECTION F: Tenant Copilot LLM Invocation (model/config)

END CHECK:
- SuperAdmin excluded? YES
- Suggestions included? NO
STOP.
