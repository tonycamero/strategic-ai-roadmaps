# META-TICKET v2
ID: NETLIFY-BE-EVIDENCE-STORAGE-TMP-OR-S3-003
OWNER: Tony
ASSIGNEE: AG
PRIORITY: P0
REPO: Strategic_AI_Roadmaps
BRANCH: feat/netlify-evidence-storage-fix
SCOPE: backend only (Netlify Functions runtime boot fix). No frontend changes. No schema changes.

CONTEXT / WHY
Netlify Function is hard-crashing at cold start with:
ENOENT: no such file or directory, mkdir '/var/task/uploads/evidence'
Stack: backend/src/services/storage/evidenceStorage.ts during module init.
This prevents Express from booting, so ALL /api routes return 502. This is the current blocker.

GOAL
Make evidence storage compatible with Netlify serverless runtime:
- Never write to /var/task (read-only in serverless packaging)
- Use /tmp for ephemeral filesystem writes OR move evidence to durable storage (S3/Blob)
- Ensure the app can boot even if evidence storage is unavailable
- Fix must be fail-soft on storage init, not crash on import

NON-GOALS
- Do not redesign evidence features or routes beyond what’s required to stop crashes
- Do not change auth behavior
- Do not remove evidence functionality; just make it serverless-safe
- Do not introduce new runtime services unless required (S3 is optional fallback)

ACCEPTANCE TESTS (MUST PASS)
A) Cold-start boot:
curl -i https://api.strategicai.app/.netlify/functions/api/health
=> HTTP 200 JSON (no 502)

B) Redirected API route boots (if redirect is already in place):
curl -i https://api.strategicai.app/api/health
=> HTTP 200 JSON (or at least not 502)

C) Evidence routes do not crash server:
Hit any route that imports evidence storage; server must respond (can return 4xx/5xx for business reasons, but NOT crash at import).

D) Local dev unchanged:
pnpm -C backend dev (or existing local run command) still works with a local uploads directory.

IMPLEMENTATION PLAN
1) Locate offending code:
- Open: backend/src/services/storage/evidenceStorage.ts
- Identify any top-level mkdirSync / path resolution executed at import time.
- Identify base directory constant (currently resolves to /var/task/uploads/evidence in Netlify bundle).

2) Refactor to LAZY INIT (no side effects on import):
- Export a function getEvidenceBaseDir() that computes base dir at runtime.
- Export ensureEvidenceDir() that creates the dir ONLY when a write occurs.
- No mkdirSync should run at module top level.

3) Choose serverless-safe directory strategy:
- If process.env.EVIDENCE_DIR is set: use it.
- Else if Netlify runtime detected (process.env.NETLIFY === "true"): use "/tmp/uploads/evidence"
- Else (local/dev): use "<repo>/backend/uploads/evidence" (or existing intended local path)

4) Update all evidence write paths to call ensureEvidenceDir() before writing:
- Any upload handler / file write should call ensureEvidenceDir() and then write under returned dir.
- Reading should not assume directory exists; handle missing gracefully.

5) OPTIONAL durable storage (only if evidence must persist across invocations):
- Add env toggle: EVIDENCE_STORAGE_DRIVER="fs" | "s3"
- If s3: require AWS creds + bucket env vars and implement minimal put/get.
- Default remains fs (/tmp) to minimize lift.
(Do NOT implement S3 unless Tony explicitly needs persistence right now; get the platform booting first.)

### Env Var Docs
- **`EVIDENCE_DIR`** (optional): Override the directory where evidence artifacts are stored locally.
- **`BLOB_READ_WRITE_TOKEN`**: If set, the system uses Vercel Blob for storage instead of the local filesystem. This is required in production environments where the filesystem is read-only (like Netlify Functions).
- **`NETLIFY`**: When set to `"true"`, the system automatically uses `/tmp/uploads/evidence` for local storage fallback to avoid crashes on read-only filesystems.

### Implementation Notes
- **Lazy Initialization**: Filesystem directories for evidence are no longer created at module load time. This prevents cold-start crashes in serverless environments.
- **Directory Selection**:
  - Netlify: `/tmp/uploads/evidence`
  - Explicit: `process.env.EVIDENCE_DIR`
  - Default: `process.cwd()/uploads/evidence`

7) Commit + push:
- Commit message must include ticket id:
  "fix(netlify): make evidence storage serverless-safe [NETLIFY-BE-EVIDENCE-STORAGE-TMP-OR-S3-003]"

FILES TO CHANGE (EXPECTED)
- backend/src/services/storage/evidenceStorage.ts  (primary)
- Any evidence upload route/controller that writes files (search for "evidence" and "uploads")
- (Optional) backend/src/app.ts if evidence module is imported at startup; keep import but remove side effects in module

SEARCH COMMANDS (LOCAL)
rg -n "evidenceStorage|uploads/evidence|mkdirSync|uploads" backend/src

NETLIFY SMOKE TEST COMMANDS (POST-DEPLOY)
curl -i https://api.strategicai.app/.netlify/functions/api/health
curl -i https://api.strategicai.app/api/health
curl -i https://api.strategicai.app/api/auth/login

GUARDRAILS
- DO NOT create directories under process.cwd() on Netlify
- DO NOT crash on missing dirs; always create lazily or return controlled error
- Ensure TypeScript build passes
- Ensure no new circular dependencies are introduced

DELIVERABLES
- PR to main with changes above
- Short note in PR description:
  - Root cause
  - New dir selection logic
  - Confirmed curl outputs

EXIT CRITERIA
- Netlify function /health returns 200 (no 502) on direct invocation
- Portal login request no longer fails due to backend 502 at cold start
