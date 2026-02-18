# MERGE FREEZE — FRONTEND MUST BE GREEN

Rule: **No merges** to main/master while `pnpm build` fails in `@roadmap/frontend`.

Merge Gate:
- Required: `pnpm --filter @roadmap/frontend build` ✅
- Required: root `pnpm build` ✅

Until then:
- Backend-only commits allowed on feature branches
- PRs may be opened, reviewed, and labeled **DO NOT MERGE**
