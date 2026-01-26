# META-TICKET v2
ID: META-FIX-INVITE-EMAIL-DISPATCH-RESEND-001
Title: Fix & Dispatch Intake Invite Emails (deterministic assembly from intake vectors/intakes) via Resend
Owner: Tony
Authority: EXECUTIVE
Scope: BACKEND ONLY (email assembly + dispatch); NO UI changes unless absolutely required for unblock
Priority: P0 (blocks Team Intakes completion)

Context / Current State
- Tenant: Onboarding progressed; 4 team members completed intake successfully.
- Intake vectors exist; invites were triggered, but emails did NOT send.
- Need AG to inspect deterministic email assembly (built from intake vectors + tenant + intake window state) and ensure Resend sends outbound invites.
- Goal is to receive invites so Tony can accept each and complete remaining team intakes.

Non-Negotiables
- Do NOT invent new invite flows.
- Email content MUST be deterministic from persisted data (tenant + intake_vectors + intake tokens/links).
- Fail-closed: if Resend is not configured, log a single clear error and return a safe API response (no silent success).
- Add minimal, high-signal logs only (no PII in logs beyond email domain; redact tokens).

Primary Suspect Surface
- backend/src/controllers/intakeVector.controller.ts (sendIntakeVectorInvite)
- backend/src/services/* email service (Resend integration / templates / link builder)
- backend/src/routes/tenants.routes.ts and backend/src/routes/superadmin.routes.ts (send-invite routes)
- env: RESEND_API_KEY, RESEND_FROM, APP_PUBLIC_URL (or equivalent base URL for links)

Execution Plan
PHASE 0 — Reproduce and Capture Evidence (no code changes)
1) Identify the exact endpoint hit by Tenant Portal invite action:
   - POST /api/tenants/intake-vectors/:id/send-invite
2) Reproduce (already known: it's a TODO in the code).

PHASE 1 — Inspect Invite Dispatch Path (deterministic assembly)
1) Read backend/src/controllers/intakeVector.controller.ts.
2) Implement the actual invite logic:
   a) fetch vector + tenant.
   b) check if an invite already exists for this email+tenant, if not create one.
   c) generate invite link.
   d) call email service.
   e) persist "invitedAt"/status.

PHASE 2 — Validate/Create Resend Integration
1) Search for existing Resend client.
2) Create/Update `backend/src/services/email.service.ts` to handle Resend dispatch.
3) Ensure env vars are loaded.

PHASE 3 — Fix Dispatch + Add Minimal Audit Logging
1) Update `sendIntakeVectorInvite` to use the new service.
2) Add structured logging.

PHASE 4 — Backfill Send for Existing Vectors
1) Create `backend/src/scripts/send-missing-intake-invites.ts` or similar.
2) Target tenant: ec32ea41-d056-462d-8321-c2876c9af263

PHASE 5 — Verification
1) Test single send.
2) Run backfill.
