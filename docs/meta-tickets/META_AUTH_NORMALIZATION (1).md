META-TICKET v2
ID: META_AUTH_NORMALIZATION
TITLE: Normalize Email Case Across Auth + Invites (Prod Fix)
OWNER: Tony
PRIORITY: P0
SURFACE: backend (Netlify Functions / API)
STATUS: READY
RISK: HIGH (blocks user login + onboarding)

GOAL
Eliminate production auth failures caused by mixed-case emails stored in Postgres by enforcing canonical normalization (lowercase + trim) at all entry points and sanitizing existing production data.

SCOPE (IN)
1) Code: Normalize email input at:
   - POST /api/auth/login
   - POST /api/auth/register
   - Invite creation endpoint
2) Data: Migration/sanitization script to lowercase + trim existing email fields in:
   - public.users.email
   - public.invites.email (or whatever column name is used)
   - public.intake_vectors.recipientEmail (or equivalent)
3) Verification: Confirm login succeeds regardless of email casing; confirm new invites persist normalized.

SCOPE (OUT)
- Any broader auth refactors, password changes, JWT changes, or schema redesign.

ROOT CAUSE
Postgres string comparisons are case-sensitive by default. The system stored mixed-case emails from invite acceptance/creation (e.g., Jules.l@gfbev.com) but login queried with exact matching using raw user input, causing “invalid credentials” when casing differed.

IMPLEMENTATION (ALREADY DONE PER YOUR NOTE)
- Added normalization (toLowerCase().trim()) at:
  - backend/src/controllers/auth.controller.ts (login, register)
  - backend/src/controllers/invite.controller.ts (createInvite)
- Added migration script:
  - backend/src/scripts/normalize-emails.ts
- Added tracking ticket:
  - docs/meta-tickets/META_AUTH_NORMALIZATION.md

ACTION PLAN (DO NOW)
A) Run migration against production DB
1. From backend/ directory (ensure prod DATABASE_URL is in env):
   npx -y tsx src/scripts/normalize-emails.ts

2. DB spot-check after script:
   - Confirm Jules’ user email is lowercased
   - Confirm no duplicates created
   - Confirm invites/intake_vectors recipient emails are lowercased

B) Deploy
1. Commit changes (controllers + script + meta-ticket)
2. Push to main (or your deploy branch) and confirm Netlify deploy completes
3. Hit health endpoint / minimal smoke check

VERIFICATION (MUST PASS)
1) Login should succeed for the same account using:
   - jules.l@gfbev.com
   - Jules.l@gfbev.com
   - JULES.L@GFBEV.COM
2) Create invite using mixed case: TeSt.UsEr@ExAmPlE.cOm
   - Verify DB stores: test.user@example.com
3) (Optional) Ensure register cannot create mixed-case record:
   - Register with MiXeD@Email.com -> DB stores lowercased

ROLLBACK
- If anything unexpected occurs, revert deploy and restore from DB backup / point-in-time recovery.
- NOTE: Migration is idempotent but not trivially reversible (case info lost). That is acceptable and desired.

POST-FIX CUSTOMER COMMS (SEND AFTER VERIFIED)
Email Jules:
- Confirm we fixed case-sensitivity issue
- Ask her to login via /login using the password she created
- If still blocked, use “Forgot Password” as fallback

NOTES / WATCHLIST
- If unique constraints exist on users.email, ensure migration handles collisions safely (log + abort on conflicts).
- If any queries use ILIKE elsewhere, keep normalization anyway (canonical storage beats query hacks).
