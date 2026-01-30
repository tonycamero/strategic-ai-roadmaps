# META-TICKET v2: META-TC-SITE-FORK-DEPLOY-001
## Goal
Extract TonyCamero.com into a website-only fork (NO platform/app), deploy it to a NEW Vercel project, and reassign TonyCamero.com + www to that new project.

## Critical Constraints
- MUST preserve TonyCamero.com UI + content exactly (no redesign, no copy edits, no IA changes).
- MUST remove / hard-disable ALL platform/app surfaces (auth, app routes, API routes, backend dependencies) from the Tony fork.
- MUST NOT refactor unrelated code. Only changes necessary to make the fork website-only + buildable.
- MUST keep scope surgical: no dependency upgrades, no package manager changes, no lint/format passes unless required to build.
- MUST store THIS META-TICKET in: docs/meta-tickets/META-TC-SITE-FORK-DEPLOY-001.md
- MUST open a PR for review (no direct merges to main).

## Inputs / Assumptions
- There is an existing repo currently serving TonyCamero.com (same repo also contains the platform).
- TonyCamero.com will move to a new repo + new Vercel project.
- StrategicAI.app will later be assigned to the existing Vercel project (handled by separate ticket).

## Deliverables
1) New Git repo: tonycamero-site (or equivalent) containing ONLY the TonyCamero.com website surface.
2) Successful build + preview locally for the forked site.
3) New Vercel project connected to the new repo, serving TonyCamero.com + www.
4) TonyCamero.com + www removed from the existing Vercel project and assigned to the new Vercel project.

## Execution Plan
### Phase A — Audit current repo (read-only)
- Identify which routes/pages constitute “TonyCamero.com website surface”.
- Identify all “platform/app” surfaces to exclude: app router pages, auth-protected areas, API routes, backend services, admin panels, etc.
- Produce a short inventory list in PR description: KEEP vs REMOVE for the fork.

### Phase B — Create forked repo
- Create a new repo from the current codebase named tonycamero-site (or the agreed naming).
- Ensure git history is preserved where possible.
- Confirm default branch, CI expectations, and build command remain consistent.

### Phase C — Strip platform/app from the fork
- Remove or disable:
  - App routes / dashboards / auth-protected pages
  - API routes that are not required for static/website rendering
  - Backend services or server dependencies not required for Tony site build
  - Env var assumptions that would break build when absent
- Preserve:
  - The TonyCamero.com homepage and all existing website pages
  - Shared UI components needed for site pages
- Confirm any internal links that pointed to app routes now either:
  - remain as-is if they already belong to Tony site, or
  - are removed ONLY if they break site navigation (do not invent new pages).

### Phase D — Build verification
- Run local build and confirm it completes without needing platform env vars.
- Run local preview and confirm parity:
  - Same pages render
  - Same navigation
  - No 404 loops for known website pages

### Phase E — Vercel deployment (new project)
- Create NEW Vercel project connected to tonycamero-site repo.
- Configure build settings to match repo framework.
- Add domains:
  - tonycamero.com
  - www.tonycamero.com
- Verify SSL and production deployment is healthy.

### Phase F — Domain reassignment (remove from old project)
- In the EXISTING Vercel project, remove:
  - tonycamero.com
  - www.tonycamero.com
- Confirm domain is ONLY attached to the new Tony site project.

## Acceptance Criteria (must all pass)
- The fork repo builds without platform env vars (or with minimal website-only env vars).
- TonyCamero.com production site renders identically to the current TonyCamero.com (no visible changes).
- No platform routes or platform navigation are accessible on TonyCamero.com.
- Domains tonycamero.com and www.tonycamero.com are attached ONLY to the new Vercel project.
- PR is opened with a concise change summary + inventory list.

## Rollback Plan
- If domain reassignment causes issues, reattach domains to the original Vercel project immediately.
- Do not delete the original domains; only reassign.
- Keep the new Vercel project intact for reattempt.

## Notes / Guardrails
- If you discover unknown coupling that requires refactor or dependency changes: STOP, REPORT, and await authorization.
