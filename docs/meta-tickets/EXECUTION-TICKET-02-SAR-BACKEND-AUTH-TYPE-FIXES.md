# EXECUTION-TICKET-02 — SAR-BACKEND-AUTH-TYPE-FIXES

SCOPE
- Resolve TypeScript errors in backend/src related to UserRole and jwt.sign.
- These were uncovered after switching to tsconfig.json in EXECUTION-TICKET-01.

FILES
- MODIFY: backend/src/controllers/superadmin.controller.ts
- MODIFY: backend/src/utils/auth.ts

STEPS (WSL)
1) Fix UserRole import in superadmin.controller.ts
- Add `UserRole` to imports from `@roadmap/shared`.
- Ensure line 147 explicit cast `role: ownerUser.role as UserRole` is satisfied.

2) Fix jwt.sign typings in utils/auth.ts
- Correct `jwt.sign` call to satisfy `jsonwebtoken` types.
- Cast `JWT_SECRET` and `expiresIn` if required.

3) Verify Backend Build
- Run:
  pnpm --filter @roadmap/backend build

ACCEPTANCE
- pnpm --filter @roadmap/backend build passes.
- No regressions in auth or impersonation logic.

COMMIT (ONE)
- Branch: fix/intake-route-spaces
- Commit message:
  "fix(backend): resolve auth type errors in superadmin controller and auth utils"
