# META-TICKET v2
ID: NETLIFY-API-ROUTING-ENV-002
Title: Fix api.strategicai.app /api/* routing + set DATABASE_URL for Netlify Functions

Context / Evidence
- /.netlify/functions/api/health returns 502 with: "DATABASE_URL environment variable is not set"
- https://api.strategicai.app/api/auth/login returns 404 (Netlify edge), meaning /api/* redirect is not being applied OR is routing to a non-existent function path.
- Goal: api.strategicai.app must serve Express API routes through ONE Netlify function router (api.ts) and allow portal.strategicai.app to call it.

Hard Requirements (Do Not Violate)
- Keep single router function: backend/netlify/functions/api.(ts|js) wrapping Express via serverless-http
- All browser calls hit: https://api.strategicai.app/api/...
- CORS must allow ONLY https://portal.strategicai.app (and optionally localhost for dev if already supported)
- No hacks like “disable CORS” or “use no-frozen-lockfile” unless explicitly authorized.

Step A — Fix missing runtime env
1) In Netlify site: api-strategicai-app (the backend deploy)
   Site settings → Build & deploy → Environment → Environment variables
2) Add:
   - DATABASE_URL = <your Neon/Postgres connection string>
   (And ensure: JWT_SECRET, RESEND_API_KEY, etc exist)
3) Trigger a new deploy.

Step B & C — Update Redirect Logic
Update `backend/netlify.toml` (assuming site Base dir = /backend):
1) Change redirect to preserve /api prefix:
   [[redirects]]
     from = "/api/*"
     to   = "/.netlify/functions/api/api/:splat"
     status = 200
     force = true

Acceptance
- curl -i https://api.strategicai.app/api/health returns 200
- curl -i -X POST https://api.strategicai.app/api/auth/login returns NOT 404.

### Final Execution Status
- **Authoritative netlify.toml**: `backend/netlify.toml` (Assumes Netlify Site Base Directory is set to `backend`)
- **Final Redirect Rule**:
  ```toml
  [[redirects]]
    from = "/api/*"
    to = "/.netlify/functions/api/api/:splat"
    status = 200
    force = true
  ```
- **Required Env Vars**:
  - `DATABASE_URL` (Critical: Missing this causes 502/500 errors)
  - `JWT_SECRET`
  - `RESEND_API_KEY`
  - `INTERNAL_EVIDENCE_TOKEN`

### Verification Status
- Routing matches Express mounts (`/api/...`) via `serverless-http` basePath stripping.
- Redirect preserves `/api` prefix so Express can resolve it correctly.
