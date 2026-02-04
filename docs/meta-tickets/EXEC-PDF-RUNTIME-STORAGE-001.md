EXECUTION-TICKET: EXEC-PDF-RUNTIME-STORAGE-001

Title:
Fix PDF/Document Runtime Storage for Netlify Serverless (Eliminate /var/task/uploads writes)

Status:
APPROVED

Objective:
Stop production 500s and unblock PDF generation + delivery by:
1) Removing module-load filesystem writes
2) Redirecting all PDF/doc filesystem I/O to a serverless-writable directory (/tmp)
3) Ensuring directory creation happens lazily inside request handlers

Confirmed Root Cause (from Discovery Report):
- backend/src/controllers/documents.controller.ts performs fs.mkdir at module load-time
- UPLOADS_DIR resolves into /var/task/backend/uploads (non-writable)
- backend/src/services/executiveBriefDelivery.ts writes to process.cwd()/uploads/executive-briefs (non-writable)

Scope (Fail-Closed):
- ONLY filesystem path selection and mkdir timing related to uploads + executive brief PDFs
- NO PDF formatting changes
- NO refactors beyond relocating mkdir and switching path constants
- NO dependency changes

Files In Scope (Explicit):
1) backend/src/controllers/documents.controller.ts
2) backend/src/services/executiveBriefDelivery.ts

Files Out of Scope:
- Any other controllers/services unless directly required to complete objective
- Evidence storage redesign, object storage integration, schema changes, UI changes

Implementation Requirements (Surgical):
A) documents.controller.ts
- Change UPLOADS_DIR to:
  - If NETLIFY === 'true' (or equivalent env), use '/tmp/uploads'
  - Else retain current local/dev behavior
- Remove top-level fs.mkdir execution
- Introduce ensureUploadsDir() called only within handlers that need it

B) executiveBriefDelivery.ts
- Change PDF_STORAGE_DIR to:
  - If NETLIFY === 'true', use path.join('/tmp','uploads','executive-briefs')
  - Else keep existing local/dev path
- Ensure mkdir is performed lazily within the delivery/generation function(s), not at import time

Rollback Plan:
- Revert path constants and restore previous behavior

Acceptance Criteria:
- No more ENOENT mkdir '/var/task/backend/uploads' in production logs
- “Email Brief” POST /executive-brief/deliver no longer fails due to mkdir/path
- PDF render completes and proceeds to the next stage (even if /tmp is ephemeral)

Verification Checklist (Operator):
1) Redeploy api.strategicAI
2) Confirm api logs:
   - No ENOENT mkdir '/var/task/backend/uploads'
3) In portal superadmin execute surface:
   - Click “Email Brief” → must not 500 due to mkdir/path
