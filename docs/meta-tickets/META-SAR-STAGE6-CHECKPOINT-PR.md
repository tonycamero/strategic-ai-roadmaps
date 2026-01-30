# META-TICKET v2
ID: META-SAR-STAGE6-CHECKPOINT-PR
TITLE: Stage 6 Lock Checkpoint via Feature Branch + PR Merge (Tag on main after merge)
MODE: EXECUTE
PRIORITY: CRITICAL
SCOPE: Git checkpoint only (NO feature work)

## CONTEXT
Stage 6 Authority Infrastructure locking is complete locally (determinism + refusal gates + version markers + canonical dataset). Repo enforces PR-only merges to main. We must checkpoint Stage 6 as an immutable baseline using a feature branch and a PR, then tag main after merge.

## HARD RULES (NON-NEGOTIABLE)
- Do NOT modify Stage 6 prompt/model/generation logic.
- Do NOT implement Stage 6.1 in this ticket.
- No refactors outside Stage 6 lock artifacts already completed.
- If any test fails, STOP and REPORT. Do not “fix” beyond restoring baseline determinism.

## TARGET REPO
- strategic-ai-roadmaps (monorepo)
- Work from repo root.

## BRANCHING STRATEGY
- Create a checkpoint branch for Stage 6 lock baseline:
  branch: checkpoint/stage6-authority-v1.0.0
- Stage 6.1 branch will be created AFTER merge + tag:
  feature/stage6-1-computed-horizons

## PRE-FLIGHT CHECKS
1) git status
   - Confirm changes are ONLY Stage 6 lock artifacts (tests, guards, canonical docs, schema alignment already done).
2) Run required backend tests:
   - src/tests/stage6.replay.ts
   - src/tests/stage6.refusal.ts
3) Confirm canonical dataset exists:
   - docs/canonical-runs/northshore-logistics/{intake.json,artifacts.json,tickets.json}

## EXECUTION STEPS
A) CREATE CHECKPOINT BRANCH (FROM CURRENT BASE)
1) git checkout main
2) git pull --rebase
3) git checkout -b checkpoint/stage6-authority-v1.0.0

B) VERIFY BASELINE LOCALLY
1) git status
2) Run backend tests (minimum):
   - stage6.replay
   - stage6.refusal

C) COMMIT (ATOMIC BASELINE)
1) git add -A
2) git commit -m "lock(stage6): freeze deterministic authority spine (v1.0.0)" -m "- Enforced deterministic ticket slugs via inventoryId SHA-1 anchoring" -m "- Added replay determinism test (stage6.replay)" -m "- Added objective refusal gates (stage6.refusal)" -m "- Guarded generation paths with versioned execution markers" -m "- Preserved Northshore Logistics Canonical 15 baseline"

D) PUSH CHECKPOINT BRANCH
1) git push -u origin checkpoint/stage6-authority-v1.0.0

E) OPEN PR (GITHUB UI)
1) Create PR:
   - base: main
   - compare: checkpoint/stage6-authority-v1.0.0
   - title: "Lock Stage 6 Authority Spine (v1.0.0)"
2) PR description MUST include:
   - Determinism: stage6.replay passes
   - Refusal gates: stage6.refusal passes
   - Canonical dataset added
3) Wait for required checks; do not bypass.

F) MERGE PR (UI)
- Merge using the required method (merge commit / squash) per repo policy.
- Ensure main is updated.

G) TAG MAIN (AFTER MERGE)
1) git checkout main
2) git pull --rebase
3) Create annotated tag on main HEAD:
   - git tag -a authority-stage6-v1.0.0 -m "Stage 6 Authority Lock baseline (deterministic + fail-closed)"
4) Push tag:
   - git push origin authority-stage6-v1.0.0

H) CREATE STAGE 6.1 FEATURE BRANCH (NO CODE YET)
1) git checkout -b feature/stage6-1-computed-horizons
2) git push -u origin feature/stage6-1-computed-horizons

## ACCEPTANCE CRITERIA
- stage6.replay passes and confirms structural invariants (determinism).
- stage6.refusal passes and confirms fail-closed behavior.
- PR merged into main via required checks.
- Annotated tag authority-stage6-v1.0.0 exists on origin pointing to main HEAD commit.
- feature/stage6-1-computed-horizons exists on origin with no additional commits.
