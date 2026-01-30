WARP META-TICKET v2 (EXECUTE NOW)
ID: EXE-MERGE-ABORT-ENV-RESTORE-002
OWNER: Tony
AGENT: Antigravity
DATE: 2026-01-23
GOAL:
Return repo to a clean, merged state (no unmerged files), then validate env install/build WITHOUT lockfile drift.

HARD RULES:
- Do NOT run pnpm install (non-frozen) while repo is unmerged.
- Do NOT resolve conflicts by “picking random sides”.
- Preserve any local changes before aborting.

STEPS (WSL ONLY)

0) Snapshot current state (evidence)
cd /home/tonycamero/code/Strategic_AI_Roadmaps
git status
git diff --stat
git diff > /tmp/pre_abort.patch || true

1) Confirm we are actually mid-merge
git rev-parse -q --verify MERGE_HEAD && echo "MERGE IN PROGRESS" || echo "NO MERGE_HEAD"

2) Abort the merge (preferred)
git merge --abort

   If merge --abort fails:
   git reset --merge
   (if still fails)
   git reset --hard HEAD

3) Verify repo is clean (no unmerged)
git status
# must show: no "Unmerged paths" and no "both modified"

4) Re-apply ONLY the intended branding edits if they were lost by abort
# If abort removed your branding changes, re-apply via patch:
git apply /tmp/pre_abort.patch || true
git status
git diff --stat

5) Install should now work frozen (no lockfile edits)
rm -rf node_modules
pnpm store prune
pnpm install --frozen-lockfile

STOP CONDITIONS:
- If pnpm still says ERR_PNPM_OUTDATED_LOCKFILE AFTER merge abort and clean status:
  STOP. Report:
   - git status
   - git diff --stat
   - which package.json changed vs lockfile (name the files)
  Do NOT run pnpm install without frozen unless Tony explicitly authorizes "lockfile refresh".

6) Validation
pnpm -r build

DELIVER:
- before/after git status
- whether merge abort restored clean state
- whether frozen install succeeds
- if frozen still fails, list exact package.json files that differ
