EXECUTION TICKET: NETLIFY-DEPLOY-FRONTEND-001

OBJECTIVE
Deploy the Strategic AI Roadmaps frontend to Netlify using the existing Git repository and branch, ensuring a successful production build and live URL for client onboarding.

SCOPE (STRICT)
- Frontend only
- Static deployment only
- No backend deployment
- No feature changes
- No refactors
- No environment variable invention unless build-blocking

SOURCE OF TRUTH
Repository: tonycamero/strategic-ai-roadmaps
Branch: integrate/develop-onto-origin-main
Frontend location: /frontend
Build output: /frontend/dist

DEPLOY TARGET
Platform: Netlify
Deployment method: Import from Git (GitHub)
Team: tonycamero’s team

REQUIRED CONFIGURATION
- Base directory: frontend
- Build command: pnpm install && pnpm build
- Publish directory: frontend/dist
- Node version: Use Netlify default unless build fails

ALLOWED ACTIONS
- Adjust Netlify build settings ONLY if required to fix a failed build
- Add minimal Netlify configuration (e.g. NODE_VERSION, corepack enable) ONLY if explicitly required by build logs
- Add netlify.toml ONLY if strictly necessary for build success

FORBIDDEN ACTIONS
- Do NOT modify backend code
- Do NOT change business logic
- Do NOT add new features
- Do NOT touch auth, gating, or diagnostics
- Do NOT merge branches
- Do NOT change domain settings

SUCCESS CRITERIA
- Netlify build completes successfully
- Frontend is accessible at Netlify-provided URL
- No runtime errors on initial load
- Intake and onboarding flows load correctly

DELIVERABLES
- Confirmation of successful Netlify deployment
- Final Netlify site URL
- Summary of any minimal config changes made (if any)

FAILURE HANDLING
If build fails:
- Stop immediately
- Report the FIRST blocking error from Netlify logs
- Do NOT attempt speculative fixes

EXECUTION MODE
Deterministic. Surgical. No interpretation.
