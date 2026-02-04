AG-TICKET: AG-PDF-DISCOVERY-001

Title:
PDF Generation & Delivery Failure — Production Discovery (Netlify Functions)

Objective:
Determine, with certainty, why PDF generation and delivery (Email Brief + Download PDF)
fails in production, and define the minimal execution surface required to fix it.

Scope (DISCOVERY ONLY — FAIL-CLOSED):
- Observe, trace, and document behavior
- Identify exact code paths, filesystem interactions, and environment assumptions
- NO code changes
- NO refactors
- NO fixes
- NO dependency changes

Systems In Scope:
- api.strategicAI Netlify Functions deployment
- PDF generation service
- Artifact creation + delivery pipeline
- Runtime filesystem usage
- Environment configuration related to PDF gen/delivery

Systems Explicitly Out of Scope:
- PDF visual formatting / layout tweaks
- UI changes
- Email provider configuration (unless directly implicated)
- Non-PDF-related endpoints
- Local dev behavior unless used for contrast

Confirmed Signals (Pre-Discovery Facts):
- Production error: ENOENT mkdir '/var/task/backend/uploads'
- Runtime: Netlify Functions (serverless)
- /var/task is non-writable in production
- Error appears during unrelated GET requests, implying module-init or shared service init
- PDF artifacts reported as “file not found” during delivery

Discovery Questions to Answer (Must All Be Resolved):
1) Where exactly in the codebase is '/backend/uploads' or equivalent path defined?
2) Is directory creation occurring at module import time (cold start) vs request time?
3) What is the intended storage model for PDF artifacts in production?
   - Ephemeral (/tmp)?
   - Persistent (object storage)?
4) Does the artifact DB record get created even when file write fails?
5) Is PDF generation synchronous with delivery, or does delivery assume prior persistence?
6) Are there environment-based fallbacks (dev vs prod) that diverge silently?
7) What minimal change would make PDF gen + delivery succeed in serverless without redesign?

Required Discovery Artifacts (Operator must produce):
- Ripgrep output locating all references to:
  'backend/uploads', '/uploads', 'UPLOAD', 'ARTIFACT', 'mkdir'
- Identification of the exact file(s) and line(s) attempting mkdir/write
- Determination of whether this runs at:
  a) module load
  b) route handler
  c) shared service constructor
- Confirmation of intended storage_provider semantics in code (local vs remote)

Stop Condition:
Discovery is complete only when a single, unambiguous root cause is identified
and the fix surface can be described in ≤3 files.

Deliverable:
A short Discovery Report summarizing:
- Root cause
- Broken assumption
- Minimal viable fix strategy (no code yet)
- Recommendation for next EXEC ticket(s)
