WARP EXECUTION TICKET
ID: EXE-CONFLICT-MARKER-AUDIT-AND-SURGICAL-RESOLVE-004
OWNER: Tony
AGENT: Antigravity
DATE: 2026-01-23
GOAL:
Eliminate ALL raw git merge conflict markers from the repo with surgical, evidence-backed edits, then restore a passing TypeScript build stage.

HARD RULES:
- Do NOT refactor, “improve,” or redesign logic.
- Only remove conflict markers by selecting the correct side or merging minimally.
- Preserve existing public/tenant boundary constraints (no TrustAgent bleed into public UI).
- After each file fix: compile again to confirm forward progress.
- Every edit must be justified with a short “why this side” note referencing local context (imports, referenced methods, route contracts, type signatures).

PHASE 0 — FULL AUDIT (MUST DO FIRST)
0.1 Capture baseline:
    git status
    git diff --stat
0.2 Locate ALL conflict markers (repo-wide):
    rg -n "^(<<<<<<<|=======|>>>>>>>)" .
0.3 Output a list grouped by package:
    - backend/...
    - frontend/...
    - packages/... (if any)
STOP CONDITION:
- If audit list is >25 files, stop and report the list only (we will batch).

DELIVERABLE A (AUDIT REPORT):
- Paste the exact rg output
- Provide the file list grouped by backend/frontend/shared

PHASE 1 — SURGICAL RESOLUTION (START WITH BACKEND LIST PROVIDED)
Files already confirmed with markers (fix these first, in this order):
1) backend/src/controllers/tenants.controller.ts
2) backend/src/controllers/ticketModeration.controller.ts
3) backend/src/services/assistedSynthesisProposals.service.ts
4) backend/src/trustagent/prompts/diagnosticToTickets.ts

For each file:
1. Open and remove markers by choosing the correct branch content:
   - Prefer the version that matches current route contracts, controller exports, and service method names used elsewhere.
   - If both sides contain needed changes, merge minimally (keep both blocks, remove duplication).
2. After editing each file:
   - run: pnpm -C backend build (or the repo build if backend build script not present)
   - If build progresses, continue to next file.
   - If new TS errors appear, classify as “follow-on code errors” (not env) and continue removing markers first.

DELIVERABLE B (PER-FILE PROOF):
For each file fixed:
- show a minimal diff excerpt:
  git diff -U3 <file>
- confirm no markers remain:
  rg -n "^(<<<<<<<|=======|>>>>>>>)" <file> || echo "no markers"

PHASE 2 — FINAL SANITY
2.1 Confirm repo-wide no markers:
    rg -n "^(<<<<<<<|=======|>>>>>>>)" . || echo "NO CONFLICT MARKERS FOUND"
2.2 Run full build:
    pnpm -r build

STOP CONDITIONS:
- If any file’s “correct side” cannot be determined from local contracts/usages:
  STOP on that file only. Provide:
   - the full conflict block
   - the surrounding function signature(s)
   - all call sites (use rg to locate)
  Then await Tony decision.

END STATE:
- Zero conflict markers in repo.
- pnpm -r build proceeds past parsing into real compile/type errors only (if any).
