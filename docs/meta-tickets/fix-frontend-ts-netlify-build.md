# META-TICKET v2
id: fix-frontend-ts-netlify-build
repo: strategic-ai-roadmaps
branch: feat/pdf-leadership-context-v1-pagebreak-hardening
scope: frontend only
goal: make `pnpm --filter @roadmap/frontend build` pass by resolving TS2339/TS2322 errors without weakening type safety

CONSTRAINTS
- Do not change runtime behavior except making rendering null-safe.
- Do not add `any`, `unknown as`, `@ts-ignore`, or disable strict TS.
- Prefer updating/introducing explicit types that reflect the data we actually render.
- Keep diffs minimal and localized to the two failing files unless a shared type already exists and is clearly the correct home.
- After changes, run: `cd frontend && pnpm exec tsc -p tsconfig.json` and `pnpm exec vite build`.

TARGET ERRORS (from Netlify)
1) TS2339 in `frontend/src/superadmin/components/ExecutiveBriefModal.tsx`
   - properties missing on typed object: `executiveSummary`, `operatingReality`, `constraintLandscape`, `blindSpotRisks`
   - occurrences around lines ~108,115,122,129,259,265

2) TS2322 + TS2339 in `frontend/src/superadmin/pages/SuperAdminControlPlaneFirmDetailPage.tsx`
   - `string | null | undefined` used where `string` required (around ~1659)
   - missing property `status` on typed object (around ~1684)

IMPLEMENTATION REQUIREMENTS
A) ExecutiveBriefModal.tsx
- Identify the object being rendered (e.g. `brief`, `selectedBrief`, `executiveBrief`).
- Ensure its TypeScript type includes:
  - `executiveSummary?: string | null`
  - `operatingReality?: string | null`
  - `constraintLandscape?: string | null`
  - `blindSpotRisks?: string | null`
- Update rendering to be null-safe using `?.` and `?? ''` (do not change displayed headings/layout).

B) SuperAdminControlPlaneFirmDetailPage.tsx
- For any value typed `string | null | undefined` passed to a `string` prop/variable, use `?? ''` fallback at the closest boundary.
- For `status`, either:
  - update the relevant interface/type (preferred) to include `status?: string | null`, OR
  - guard the access so TS knows it may be absent (no `any`).

DELIVERABLES
- Commit message: `fix(frontend): align executive brief types + null-safe props`
- Output:
  - `pnpm --filter @roadmap/frontend build` succeeds locally
  - No new TS errors introduced
