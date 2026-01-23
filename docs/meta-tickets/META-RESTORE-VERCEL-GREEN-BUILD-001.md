# META-RESTORE-VERCEL-GREEN-BUILD-001: Restore Vercel GREEN Build via Backend Type Spine + Schema Repair

- **Status**: IN_PROGRESS
- **Priority**: P0 – Production Blocking
- **Scope**: backend, shared (type spine only), vercel build surface
- **Mode**: SURGICAL REPAIR (NO REFACTORING)

## Problem
The Vercel production deployment is currently failing (RED) due to backend TypeScript compilation errors, database schema drift, and missing service/controller exports. This blocks all production deployments.

## Solution
Restore the Vercel production build to GREEN by:
1.  Hardening the build surface using a dedicated `tsconfig.vercel.json` to exclude non-runtime files.
2.  Patching the `TokenPayload` interface for backward compatibility.
3.  Resolving extensive merge conflicts in `backend/src/db/schema.ts`.
4.  Aligning the database schema for `tenants` and `tenant_documents` tables.
5.  Restoring missing service and controller logic/exports (onboarding, roadmap).
6.  Resolving merge conflicts in critical controllers and routes.

## Acceptance Criteria
- [ ] Vercel production build is GREEN.
- [ ] No TypeScript errors in backend build (`tsc -p backend/tsconfig.vercel.json`).
- [ ] Runtime behavior remains unchanged.
- [ ] No scripts, tests, or narrative files are compiled in the production build.

## Governance Satisfaction
This work satisfies the following sections of `docs/GOVERNANCE.md`:
- **Section 2.2: Schema Integrity**: Resolving schema drift and merge conflicts.
- **Section 3.1: Build Surface**: Hardening the production build to exclude non-essential code.
- **Section 4.1: RBAC/Auth**: Maintaining `TokenPayload` integrity while ensuring compatibility.

---
*Note: Work is subject to `docs/GOVERNANCE.md` requirements.*
