# META-TICKET v2
ID: NETLIFY-BE-EXPRESS-FUNCTION-API-ROUTER-001
TITLE: Fix Netlify backend so /api/* routes hit real Express handlers (single router function) + CORS for portal.strategicai.app
MODE: Obedience-first. No invention. Minimal diffs. Fail-closed.
REPO: strategic-ai-roadmaps (monorepo: frontend + backend + shared)
TARGET SITES:
- FE site: portal.strategicai.app
- BE site: api.strategicai.app

OUTCOME (ACCEPTANCE)
1) POST https://api.strategicai.app/api/auth/login no longer 404s (must reach existing Express route; response may be 200/401/422 depending on creds).
2) Browser no longer blocks by CORS when portal calls api.
3) Backend deploy remains Netlify Functions (no “shortcuts” like disabling frozen lockfile).
4) FE + BE are deployed as separate Netlify projects safely from same repo.

CURRENT STATE (OBSERVED)
- FE and BE Netlify deploys are “green” but runtime calls to https://api.strategicai.app/api/auth/login return 404 and/or CORS errors.
- backend/netlify/functions currently only contains health.ts (one function).
- A redirect of /api/* to /.netlify/functions/:splat cannot map to Express routes; it only maps to function names. This is the root mismatch.

SCOPE LOCK
- Allowed: backend code + backend Netlify config + backend deps; FE env var value only.
- Not allowed: major architecture rewrites, moving repos, changing auth behavior, changing business logic, turning off frozen-lockfile, or “it works on my machine” hacks.

PLAN
A) Ensure backend Netlify site uses backend-scoped netlify.toml and correct functions path
B) Add ONE router function “api” that adapts Express to Netlify via serverless-http
C) Refactor backend entry so Express app can be imported without calling listen()
D) Add explicit CORS for portal.strategicai.app on /api/*
E) Verify with curl + browser

====================================================================
STEP 1 — BACKEND NETLIFY CONFIG (SITE-SCOPED)
Create file: backend/netlify.toml

Content EXACTLY:
[build]
  functions = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200
  force = true

[[headers]]
  for = "/api/*"
  [headers.values]
    Access-Control-Allow-Origin = "https://portal.strategicai.app"
    Access-Control-Allow-Headers = "Content-Type, Authorization"
    Access-Control-Allow-Methods = "GET, POST, PUT, PATCH, DELETE, OPTIONS"

NOTES:
- This file must live in /backend so it only affects BE Netlify site.
- Do NOT create root netlify.toml unless absolutely required.

====================================================================
STEP 2 — ADD SERVERLESS ADAPTER DEP
In backend workspace add:
- serverless-http

Commands:
cd backend
pnpm add serverless-http

Commit will update pnpm-lock.yaml at repo root; that is expected.

====================================================================
STEP 3 — ENSURE EXPRESS APP EXPORT WITHOUT LISTEN()
Goal: import a stable Express “app” object in the Netlify function without binding a port.

Preferred (minimal change):
- Create backend/src/app.ts exporting `app`
- Keep backend/src/index.ts for local dev only

Implement:

File: backend/src/app.ts
- Create express()
- Apply middleware (whatever already exists)
- Mount routers EXACTLY as currently used
- export { app }

File: backend/src/index.ts
- import { app } from "./app"
- if NOT running on Netlify, listen
Guard:
const isNetlify = !!process.env.NETLIFY
if (!isNetlify) app.listen(PORT, ...)

CRITICAL:
- Preserve existing route prefixes. FE calls /api/auth/login → backend must have router mounted at /api/auth.
- Do NOT change auth logic.

====================================================================
STEP 4 — CREATE SINGLE ROUTER FUNCTION: backend/netlify/functions/api.ts
Create file: backend/netlify/functions/api.ts

Content (use exactly; do not improvise):
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import serverless from "serverless-http";
import { app } from "../../src/app";

const handlerFn = serverless(app, {
  basePath: "/.netlify/functions/api",
});

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "https://portal.strategicai.app",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      },
      body: "",
    };
  }

  const resp = await handlerFn(event, context);

  resp.headers = {
    ...(resp.headers || {}),
    "Access-Control-Allow-Origin": "https://portal.strategicai.app",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  };

  return resp;
};

====================================================================
STEP 5 — VERIFY ROUTE MOUNTING MATCHES FE
Find current auth route implementation and confirm:
- app.use("/api/auth", authRouter)
- authRouter.post("/login", ...)

If current backend mounts auth at "/auth" (no /api prefix), fix by mounting in app.ts at "/api" (preferred) or adjust existing mount to include "/api".
Do NOT change FE paths beyond base URL.

====================================================================
STEP 6 — FRONTEND ENV VAR (FE NETLIFY PROJECT ONLY)
In the FRONTEND Netlify project env vars, set:
VITE_API_BASE_URL = https://api.strategicai.app/api

Confirm FE builds reference it and call:
${VITE_API_BASE_URL}/auth/login

====================================================================
STEP 7 — LOCKFILE + BUILD REPRODUCIBILITY (NO SHORTCUTS)
From repo root, regenerate lockfile with runner-compatible pnpm:
corepack enable
corepack prepare pnpm@10.28.1 --activate
pnpm install

Then commit. Do NOT bypass frozen lockfile in CI.

====================================================================
STEP 8 — COMMIT + PUSH
Files expected to change/add:
- backend/netlify.toml (new)
- backend/netlify/functions/api.ts (new)
- backend/src/app.ts (new or refactor)
- backend/src/index.ts (modify to not listen on Netlify)
- backend/package.json (serverless-http)
- pnpm-lock.yaml (updated)

Commit message:
fix(netlify-backend): route /api/* to express via api function + cors

====================================================================
STEP 9 — SMOKE TESTS (REQUIRED, COPY/PASTE)
After deploy, run:

1) list functions are deployed:
curl -i https://api.strategicai.app/.netlify/functions/health

2) router function direct:
curl -i https://api.strategicai.app/.netlify/functions/api/api/health
(If health route is /api/health in express)

3) real login route:
curl -i -X POST https://api.strategicai.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"x","password":"y"}'

4) CORS preflight:
curl -i -X OPTIONS https://api.strategicai.app/api/auth/login \
  -H "Origin: https://portal.strategicai.app" \
  -H "Access-Control-Request-Method: POST"

PASS CONDITIONS:
- (3) returns NOT 404 (can be 200/401/422)
- (4) returns 204 and includes Access-Control-Allow-Origin header
- Browser login request no longer blocked by CORS

FAIL-CLOSED DIAGNOSTICS
If still 404:
- Confirm redirect is "/.netlify/functions/api/:splat" (not ":splat" alone)
- Confirm api.ts deployed as function name "api"
- Confirm Express mounts include "/api" prefix
If still CORS:
- Confirm headers present on OPTIONS and non-OPTIONS responses

END
