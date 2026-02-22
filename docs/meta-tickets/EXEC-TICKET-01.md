EXEC-TICKET-01
Title: Canonical Agent Surface Inventory + Classification

Objective:
Produce a deterministic inventory of all LLM invocation surfaces and classify them as:
- TENANT (must route through TCA)
- SUPERADMIN (SAS)
- INTERNAL (scripts/tests)

Constraints:
- No code modification
- Inventory must be reproducible via WSL command
- Output committed under docs/meta-tickets/

Steps (WSL REQUIRED):

cd "$HOME/code/Strategic_AI_Roadmaps"
set -euo pipefail

echo "== LLM CALL SITES ==" > docs/meta-tickets/LLM_SURFACE_INVENTORY.md
rg -n "chat\.completions\.create|createOpenAIClient|new OpenAI" backend/src \
  >> docs/meta-tickets/LLM_SURFACE_INVENTORY.md

echo -e "\n== TENANT ROUTES ==" >> docs/meta-tickets/LLM_SURFACE_INVENTORY.md
rg -n "router\.(post|get)" backend/src/routes \
  >> docs/meta-tickets/LLM_SURFACE_INVENTORY.md

git add docs/meta-tickets/LLM_SURFACE_INVENTORY.md
git commit -m "EXEC-01: LLM surface inventory (pre-orchestrator)"

PATCH: Reachability Rule (Phase 0)
- Any OpenAI callsite that is NOT reachable from runtime routes (ReachableFromRuntime=NO)
  MUST be classified as INTERNAL_ONLY or REMOVE (DEAD_CODE).
- Orphaned/dead code is NOT a Phase 0 blocker.
- Phase 0 is COMPLETE when:
  (a) every runtime-reachable surface is classified TCA or SAS with required action, AND
  (b) every non-runtime surface is marked INTERNAL_ONLY/REMOVE with a cleanup note.

# Prove reachability (no callers) for a suspected orphan surface:
rg -n "publicAgentSession" backend/src --glob '!**/*.test.*'

Exit Criteria:
- Inventory file committed
- No code changes
