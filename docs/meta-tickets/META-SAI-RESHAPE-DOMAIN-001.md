# META-TICKET v2: META-SAI-RESHAPE-DOMAIN-001
## Goal
Transform the EXISTING platform repo’s marketing surface into StrategicAI.app using provided copy + layout wireframes, then assign strategicai.app (+ www optional) to the EXISTING Vercel project (NO new Vercel project).

## Critical Constraints
- MUST NOT create a new Vercel project for StrategicAI.app.
- MUST preserve all platform logic: auth, intake, backend services, DB connectivity, protected routes.
- MUST restrict edits primarily to marketing pages, navigation, and brand assets (logos, metadata).
- MUST NOT touch backend unless required to update brand strings/URLs or prevent broken builds.
- MUST NOT delete large blocks; choose canonical implementations surgically.
- MUST store THIS META-TICKET in: docs/meta-tickets/META-SAI-RESHAPE-DOMAIN-001.md
- MUST open a PR for review (no direct merges to main).

## Inputs Required (from Tony / provided separately)
- StrategicAI.app copy (final)
- StrategicAI.app layout wireframes / IA
- Branding assets (logo, favicon) if any
- Preferred CTA targets (e.g., “Start Diagnostic” → existing intake route)

## Deliverables
1) Updated marketing surface implementing StrategicAI.app copy + layout.
2) All TonyCamero branding removed from the platform’s public marketing surface.
3) Existing platform routes continue to function (login/intake/app).
4) strategicai.app (and optionally www) assigned to the EXISTING Vercel project.
5) Any old “home” domain is either removed or left unassigned per instruction (do not redirect unless explicitly requested).

## Execution Plan
### Phase A — Confirm current routing map (read-only)
- Identify current public marketing routes/pages.
- Identify existing intake + login routes used for CTA wiring.
- Document in PR description:
  - New IA (StrategicAI.app pages)
  - CTA target routes (exact)

### Phase B — Implement StrategicAI.app marketing pages
- Replace homepage with StrategicAI.app layout + copy.
- Implement / update these pages as specified in the wireframes (typical minimum):
  - / (Home)
  - /how-it-works (or /product)
  - /pricing
  - /diagnostic (or /start) — CTA entry page wired to intake
  - /login (existing)
- Update navigation, footer, and metadata:
  - Site name, title templates, OG tags, favicon
- Ensure no TonyCamero first-person narrative remains on StrategicAI.app marketing surface.

### Phase C — Preserve platform invariants
- Confirm auth flow still works.
- Confirm intake flow still works end-to-end.
- Confirm no protected routes were exposed unintentionally.
- Confirm build passes and no env changes are required.

### Phase D — Vercel domain assignment (existing project)
- In the EXISTING Vercel project settings:
  - Add domain: strategicai.app
  - Add domain: www.strategicai.app (optional if required)
- Ensure strategicai.app is set as primary domain if desired.
- Verify SSL and production deployment.

### Phase E — Smoke tests (production)
- Home renders correctly on strategicai.app
- Key routes:
  - /pricing
  - /how-it-works (or equivalent)
  - Login route
  - Intake start route
- No TonyCamero.com references appear in titles/metadata/nav/footer.

## Acceptance Criteria (must all pass)
- Marketing surface matches provided copy + wireframes.
- Platform functionality remains intact (login + intake + core app).
- strategicai.app resolves to the EXISTING Vercel project without errors.
- Build and deployment green.
- PR includes:
  - IA summary
  - CTA wiring notes
  - Screenshots or route checklist confirmation

## Rollback Plan
- Revert PR and redeploy.
- Remove strategicai.app domain from Vercel if necessary to prevent broken public surface.

## Stop Conditions
- If implementing wireframes requires architecture changes or backend refactors: STOP, REPORT, await authorization.
