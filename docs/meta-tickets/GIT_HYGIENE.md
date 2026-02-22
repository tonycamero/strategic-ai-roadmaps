META-TICKET v2
ID: SAR-GIT-INTEGRATE-20260221
TITLE: Dependency-first cherry-pick integration (orchestrator + authority) into staging
REPO: Strategic_AI_Roadmaps
PRIMARY LANE: origin/staging -> origin/main
BRANCH: integrate/recover-orchestrator-authority-20260221
SCOPE: SAR only. No merges. No refactors outside invariant enforcement. No dependency changes.

OBJECTIVE
Safely integrate orchestrator + authority work from scattered branches into staging using cherry-pick discipline and invariant enforcement.

NON-NEGOTIABLE INVARIANTS (must hold after every pick)
I1) No direct OpenAI calls in tenant controllers.
I2) Only ONE canonical authority decision path.
I3) No lifecycle gating logic scattered across controllers.
I4) No ticket/roadmap generation bypassing orchestrator.
I5) build passes.
I6) typecheck passes.

PRE-FLIGHT (Freeze + clean base)
1) Ensure working tree clean and on staging
   git status
   git fetch --all --prune
   git checkout staging
   git pull --ff-only origin staging
   git status

2) Create integration branch from origin/staging
   git checkout -b integrate/recover-orchestrator-authority-20260221 origin/staging
   git status

CANDIDATE BRANCH DISCOVERY
3) List local + remote branches (capture to notes)
   git branch -vv
   git branch -r | sed 's#^ *##' | sort

4) Identify candidate branches likely containing work
   # (Adjust grep terms if your naming differs)
   git branch -r | grep -Ei 'orchestr|authority|gate|lifecycle|resolver|rewire|decommission|schema|validator|audit|observ' || true

5) For each candidate branch, compute unique commits vs origin/staging
   # Replace <BRANCH> with each remote branch name, e.g. origin/feature/orchestrator-spine
   git log --oneline --decorate --no-merges origin/staging..<BRANCH>

CLASSIFICATION (per-commit, per-branch)
6) For each unique commit, classify into ONE bucket (no mixed commits allowed):
   A) ORCHESTRATOR CORE (services/types only; no route wiring)
   B) AUTHORITY CENTRALIZATION (single authority resolver; controllers thin)
   C) ROUTE/CONTROLLER REWIRE (generation endpoints -> orchestrator; decommission legacy)
   D) SCHEMA ENFORCEMENT (validators; fail-closed; no-write-on-invalid)
   E) OBSERVABILITY/AUDIT (audit rows; capability + authorityDecision logging)
   F) UNRELATED/NOISE (skip)

RULES
- No branch merges. Cherry-pick only.
- If a commit is mixed-domain: DO NOT cherry-pick it. Manually restore only needed files into a clean commit.
- Never apply stashes directly into integration branch. Stashes are forensic; extract via patch only.

DEPENDENCY-FIRST CHERRY-PICK ORDER (strict)
7) Apply in this order ONLY:
   1) A ORCHESTRATOR CORE
   2) B AUTHORITY CENTRALIZATION
   3) C ROUTE/CONTROLLER REWIRE
   4) D SCHEMA ENFORCEMENT
   5) E OBSERVABILITY/AUDIT

CHERRY-PICK MECHANICS
8) Cherry-pick single commit (repeat one-by-one)
   git cherry-pick <SHA>

9) If conflicts:
   - resolve surgically (no refactor)
   - git add -A
   - git cherry-pick --continue
   If you decide the commit is too mixed:
   - git cherry-pick --abort
   - manually restore specific files (see “Surgical Restore” below)
   - create a clean commit with a clear message

POST-PICK VERIFICATION (run after EVERY pick)
10) Backend checks (adjust paths/filters to your repo conventions)
   pnpm -w --filter @roadmap/backend typecheck
   pnpm -w --filter @roadmap/backend build

11) Invariant greps (fail if any hits are unexpected)
   # I1: No direct OpenAI calls in tenant controllers
   rg -n "OpenAI|openai\.chat\.completions|chat\.completions|responses\.create|createChatCompletion" backend/src -S || true
   rg -n "OpenAI|openai\.chat\.completions|chat\.completions|responses\.create|createChatCompletion" backend/src/controllers backend/src/routes -S || true

   # I3: No lifecycle gating logic scattered in controllers (tune patterns to your code)
   rg -n "lifecycle|gate\.service|GateService|approved_at|ExecutiveBrief|DIAGNOSTIC_SUFFICIENCY|OPERATOR_CONFIRMED" backend/src/controllers -S || true

   # I4: No generation bypassing orchestrator (tune patterns)
   rg -n "generate|roadmap|brief|diagnostic" backend/src/controllers backend/src/routes -S || true
   rg -n "orchestrator" backend/src -S || true

12) If any invariant violation is found:
   - immediately revert the last cherry-pick:
     git reset --hard HEAD~1
   - or if already committed and you want history preserved:
     git revert <SHA>
   - then re-apply via surgical restore / clean commit

STASH POLICY (forensic extraction only)
13) List stashes (do not apply)
   git stash list

14) Export a stash to a patch file (inspect before use)
   git stash show -p stash@{0} > /tmp/stash0.patch
   less /tmp/stash0.patch

15) Extract only needed hunks/files manually
   # Preferred: open patch, copy specific file diffs, apply via git apply with pathspec if possible
   git apply --reject --whitespace=fix /tmp/stash0.patch || true
   # Then ONLY add intended files:
   git add <file1> <file2>
   git commit -m "surgical: recover <X> from stash (no mixed domains)"

SURGICAL RESTORE (when commit is mixed)
16) Restore specific files from a branch without merging:
   git checkout <BRANCH> -- backend/src/services/<...> backend/src/types/<...>
   git status
   git commit -m "orchestrator(core): restore <files> from <BRANCH>@<SHA>"

EXIT CRITERIA (integration branch ready)
- Orchestrator is the single tenant LLM entry.
- AuthorityResolver is the sole lifecycle gate path.
- Controllers are thin adapters (no direct gating logic).
- No legacy generation bypass.
- Schema validation fails closed; no-write-on-invalid.
- Observability/audit logging present (capability + authorityDecision).
- Grep invariants clean.
- Backend build + typecheck clean.

DELIVERY
17) Push integration branch and open PR -> staging
   git push -u origin integrate/recover-orchestrator-authority-20260221

18) After staging validation, open PR staging -> main (separate PR)

NOTES / NO-GOS
- No dependency changes.
- No “drive-by fixes.”
- No merges.
- No applying stashes directly.
- If you discover out-of-scope issues: STOP, LOG, DO NOT FIX.