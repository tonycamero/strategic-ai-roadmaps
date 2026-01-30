WARP EXECUTION TICKET
ID: EXE-REVERT-PACKAGEJSON-RETRY-FROZEN-003
OWNER: Tony
AGENT: Antigravity
DATE: 2026-01-23
GOAL:
Remove accidental dependency drift by reverting backend/package.json and frontend/package.json to HEAD, then validate env using frozen lockfile.

HARD RULES:
- Do NOT run pnpm install without --frozen-lockfile.
- Only revert the two package.json files. Do NOT touch pnpm-lock.yaml.
- Preserve branding edits and any other intended source changes.

STEPS (WSL ONLY)
cd /home/tonycamero/code/Strategic_AI_Roadmaps

0) Evidence snapshot (paste output)
git status
git diff --stat
git diff backend/package.json frontend/package.json

1) Revert ONLY the drifted package.json files to HEAD
git checkout -- backend/package.json frontend/package.json

2) Confirm only those files changed back (paste output)
git status
git diff --stat
git diff backend/package.json frontend/package.json   # should be empty

3) Clean install artifacts (safe)
rm -rf node_modules
find . -name "node_modules" -type d -prune -exec rm -rf {} + 2>/dev/null || true
pnpm store prune

4) Frozen install (must succeed)
pnpm install --frozen-lockfile

STOP CONDITIONS:
- If frozen install still fails with OUTDATED_LOCKFILE after reverting both package.json:
  STOP and paste:
   - exact pnpm error output
   - `git status`
   - `git diff --stat`
   - `ls -la pnpm-lock.yaml`
   - `git log -1 --oneline`

5) Build validation
pnpm -r build

DELIVER:
- Confirmation frozen install succeeded
- Any remaining failures categorized (env vs real code)
- `pnpm -r build` excerpt
