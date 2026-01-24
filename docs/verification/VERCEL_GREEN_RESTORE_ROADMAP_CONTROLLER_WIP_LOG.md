Scope: 3 of 4 workspace projects
shared build$ npx tsc
shared build: Done
backend build$ tsc -p tsconfig.vercel.json
frontend build$ pnpm exec tsc -p tsconfig.json && pnpm exec vite build
frontend build: src/superadmin/api.ts(1,1): error TS1185: Merge conflict marker encountered.
frontend build: src/superadmin/api.ts(432,1): error TS1185: Merge conflict marker encountered.
frontend build: src/superadmin/api.ts(981,1): error TS1185: Merge conflict marker encountered.
frontend build: src/superadmin/components/DiagnosticModerationSurface.tsx(1,1): error TS1185: Merge conflict marker encountered.
frontend build: src/superadmin/components/DiagnosticModerationSurface.tsx(187,1): error TS1185: Merge conflict marker encountered.
frontend build: src/superadmin/components/DiagnosticModerationSurface.tsx(394,1): error TS1185: Merge conflict marker encountered.
frontend build: Failed
/home/tonycamero/code/Strategic_AI_Roadmaps/frontend:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @roadmap/frontend@1.0.0 build: `pnpm exec tsc -p tsconfig.json && pnpm exec vite build`
Exit status 2
