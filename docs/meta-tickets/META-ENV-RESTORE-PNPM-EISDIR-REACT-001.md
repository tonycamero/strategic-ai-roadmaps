META-TICKET v2
ID: META-ENV-RESTORE-PNPM-EISDIR-REACT-001
OWNER: Tony
AGENT: Antigravity
DATE: 2026-01-23
REPO: Strategic_AI_Roadmaps (pnpm monorepo)
REPO EXPECTED STRUCTURE:
- Repo root contains: pnpm-workspace.yaml
- Frontend package path: /frontend
- Backend package path: /backend
PRIORITY: P0 (env broken blocks validation)

CANONICAL STORAGE (NON-OPTIONAL):
- BEFORE ANY EXECUTION: store this ticket verbatim at:
  docs/meta-tickets/META-ENV-RESTORE-PNPM-EISDIR-REACT-001.md

GOAL (1 sentence):
Restore a clean, reproducible dev/build environment WITHOUT changing dependencies or refactoring, so the branding update can be validated and shipped.

OPERATING MODE:
- ENVIRONMENT RECOVERY MODE ONLY.
- Obedience-first execution. No interpretive fixes. No speculative improvements.
- If the only path forward requires modifying package.json, pnpm-lock.yaml, tsconfig, vite config, eslint config, or application code: STOP + REPORT.

SCOPE (HARD BOUNDARIES):
- Allowed: environment hygiene ONLY
  - delete/recreate node_modules
  - pnpm store maintenance
  - lockfile integrity checks (read-only)
  - workspace install/build verification
  - diagnostics logs
  - read-only inspection of repo structure/config
- Forbidden:
  - dependency version changes
  - package.json edits
  - pnpm-lock.yaml edits/regeneration
  - adding/removing packages
  - tsconfig/vite/eslint config edits
  - refactors
  - code changes unrelated to environment restore
- Branding edits already done: DO NOT touch those files unless required to revert accidental changes (none expected).

ACCEPTANCE CRITERIA:
A) `pnpm install --frozen-lockfile` succeeds at repo root (no EISDIR).
B) `pnpm -r build` reaches a meaningful compile stage with normal project errors only
   (NOT blanket “cannot find module 'react'/'wouter'” across the codebase).
C) Frontend typecheck/lint no longer shows systemic “cannot find module react/wouter” and
   “JSX implicitly has type any” caused by missing deps/resolution failure.
D) Provide a short forensic note: root cause hypothesis + exact fix steps + commands used + before/after evidence.
E) Confirm whether repo location (/mnt/c vs native Linux filesystem) contributed, with evidence.

DELIVERABLES (PASTE EXACT OUTPUTS):
1) System + tooling:
   - `pwd`
   - `uname -a` (or Windows equivalent if not in WSL)
   - `node -v`
   - `pnpm -v`
   - `pnpm config get store-dir`
   - `pnpm config list` (only keys relevant to install/linking; if too long, include full output anyway)
2) Repo integrity:
   - `ls -la` at repo root showing `pnpm-workspace.yaml`
   - `git status`
   - `git diff --stat`
3) Error evidence (BEFORE):
   - Full output for failing `pnpm install` (root), including the exact EISDIR path.
4) Success evidence (AFTER):
   - Full output (or final 50 lines) of successful `pnpm install --frozen-lockfile`
   - Output excerpt showing `pnpm -r build` progressed beyond dependency resolution
5) Dependency resolution sanity checks (AFTER):
   - `pnpm -C frontend why react`
   - `pnpm -C frontend why wouter`
   - `pnpm -C frontend exec node -e "require('react'); require('wouter'); console.log('ok')"`

STOP CONDITIONS (FAIL-CLOSED):
- If `pnpm install --frozen-lockfile` fails due to lock mismatch: STOP + REPORT (do NOT regenerate lockfile).
- If any remediation suggests editing package.json / pnpm-lock.yaml / tsconfig / vite / eslint: STOP + REPORT.
- If you cannot reproduce the EISDIR error path exactly (logs truncated): rerun with verbose logging and capture full output:
  - `pnpm install --frozen-lockfile --reporter=ndjson` (capture file) OR `pnpm install --frozen-lockfile --loglevel=debug`
- If the only fix is “move the repo” or “change OS/filesystem”: STOP after producing evidence and recommendation.

EXECUTION PLAN (DO EXACTLY IN ORDER)

PHASE 0 — SAFETY SNAPSHOT (NO CHANGES)
0.1 Verify you are at repo root (must contain pnpm-workspace.yaml):
    - `pwd`
    - `ls -la`
0.2 `git status`
0.3 `git diff --stat`
0.4 Record platform + versions:
    - `uname -a` (or Windows equivalent)
    - `node -v && pnpm -v`
0.5 Capture pnpm store + key config:
    - `pnpm config get store-dir`
    - `pnpm config list`

PHASE 1 — REPRODUCE + IDENTIFY THE EISDIR OFFENDER (READ-ONLY)
1.1 Re-run the failing command to capture the exact EISDIR path:
    - `pnpm install --frozen-lockfile`
    - Capture FULL output including the path containing `node_modules/typescript` (or other offender).
1.2 Inspect what the offender path actually is (directory vs symlink vs file):
    - In WSL: `ls -la node_modules/typescript || true`
    - Also inspect parent: `ls -la node_modules || true`
    - If on Windows FS: run PowerShell equivalent and capture output:
      `Get-Item .\node_modules\typescript -Force | Format-List *`
1.3 Determine repo filesystem location:
    - If `pwd` begins with `/mnt/c/` or `/mnt/d/`, note it explicitly as a high-confidence contributing factor.

PHASE 2 — CLEAN WITHOUT CHANGING DEPENDENCIES (SAFE HYGIENE ONLY)
2.1 Ensure no pnpm/node process is holding locks:
    - If needed, list relevant processes and terminate them (capture what you did).
2.2 Remove install artifacts:
    - `rm -rf node_modules`
2.3 If workspace contains nested node_modules and they exist (VERIFY before deleting):
    - `find . -name "node_modules" -type d -prune -print`
    - If multiple appear, delete ONLY after listing them, then:
      `find . -name "node_modules" -type d -prune -exec rm -rf {} +`
2.4 Remove pnpm virtual store artifacts that can carry corruption:
    - `rm -rf node_modules/.pnpm` (if present; harmless if missing)
2.5 Prune pnpm global store (safe, no dependency changes):
    - `pnpm store prune`
2.6 If `node_modules/typescript` (or the offender) somehow persists:
    - remove it explicitly and report why it survived earlier deletion.

PHASE 3 — REINSTALL (FROZEN ONLY)
3.1 Install:
    - `pnpm install --frozen-lockfile`
3.2 If still EISDIR, capture full logs and DO NOT pivot to edits:
    - `pnpm install --frozen-lockfile --loglevel=debug` (capture output)
    - Proceed to Phase 5 (controlled branch)

PHASE 4 — VALIDATE WORKSPACE RESOLUTION (POST-INSTALL)
4.1 Sanity check react + wouter resolution from frontend:
    - `pnpm -C frontend why react`
    - `pnpm -C frontend why wouter`
    - `pnpm -C frontend exec node -e "require('react'); require('wouter'); console.log('ok')"`
4.2 Run build:
    - `pnpm -r build`
4.3 Classify failures if any:
    - ENV/RESOLUTION failures (missing modules, pnpm workspace resolution)
    - REAL CODE failures (actual TS/ESLint or app-level errors)
    - Provide minimal excerpts and classification.

PHASE 5 — IF EISDIR PERSISTS (CONTROLLED BRANCH; NO CONFIG/DEP EDITS)
5.1 Confirm whether the offending path is being treated as a directory where pnpm expects a file/symlink:
    - Inspect offender with `ls -la` (WSL) / `Get-Item` (Windows)
5.2 Try an install strategy change WITHOUT persisting global config:
    - `pnpm install --frozen-lockfile --node-linker=hoisted`
    - Note: this is a runtime flag, not a committed config.
    - If it resolves EISDIR, report it as a local workaround and include the evidence.
5.3 Diagnostic-only isolation test (ONLY if repo is on /mnt/c and errors persist):
    - Copy repo to a native Linux path (e.g., `~/code/Strategic_AI_Roadmaps`) WITHOUT modifying files
    - Repeat Phase 2–4 there
    - Report whether this alone resolves the issue

FINAL REPORT FORMAT (MANDATORY):
- Root cause hypothesis (1–3 bullets; evidence-backed)
- What fixed it (exact commands, in order)
- Before/After evidence (key excerpts)
- Filesystem location impact (/mnt/c vs native Linux)
- Remaining failures: “env” vs “real code”
- Confirmation: no package.json / pnpm-lock.yaml / config files / app code were edited

END STATE:
Environment restored enough to validate branding edits (StrategicAI.app header + updated footer copyright) with a clean frozen install + build progression.
