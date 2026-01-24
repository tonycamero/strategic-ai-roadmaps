META-TICKET v2 — RESTORE VERCEL GREEN BUILD + POST-GREEN CLEANUP (SAR)

TICKET_ID: META-VERCEL-GREEN-RESTORE-001
PRIORITY: P0
OWNER: AG
REPO: strategic-ai-roadmaps (monorepo)
BRANCH_POLICY: Use a PR (no direct pushes to main)
TARGET: Restore Vercel GREEN build while preserving governance invariants; then create a post-green cleanup PR to prune temp files safely.

============================================================
0) GOVERNANCE / OPERATING CONSTRAINTS (HARD)
============================================================
- MUST operate strictly within GOVERNANCE.md + referenced governing docs.
- MUST save this exact META-TICKET to: docs/meta-tickets/META-VERCEL-GREEN-RESTORE-001.md BEFORE any code changes.
- MUST NOT "keep only stashed changes" as a default merge strategy.
  - Merge conflicts MUST be resolved surgically (preserve both sides unless proven dead).
  - Remove duplicates by selecting the single canonical implementation, not by deleting large upstream blocks.
- MUST preserve declared invariants of the system (authority gating / lifecycle contract / fail-closed behaviors).
- MUST stop at Definition of Done (DoD) and report verification outputs.

============================================================
1) PROBLEM STATEMENT
============================================================
Vercel deploy fails due to TypeScript "type spine" breakages:
- Stubbed/empty critical modules (services/controllers) causing missing exports.
- Merge conflicts left in key files (schema.ts, controllers/routes).
- Schema-type drift: controllers refer to columns not present in Drizzle schema.
- TokenPayload mismatch: controllers expect fields not present in type definition.
- Duplicate keys / duplicate function exports in superadmin controller.

Goal: Restore a GREEN build on Vercel by correcting the compile surface and aligning schema/types/exports with runtime expectations.

============================================================
2) SCOPE
============================================================
IN SCOPE:
- Fix TypeScript build errors preventing Vercel deployment.
- Resolve merge conflicts in specified files (remove conflict markers; preserve correct logic).
- Align Drizzle schema typings with code usage (add missing columns/exports).
- Restore missing exports in stubbed services/controllers as required by imports/routes.
- Keep backend build surface minimal for Vercel serverless compile (tsconfig.vercel.json).

OUT OF SCOPE:
- Feature work, refactors, reorganizing architecture, rewrites.
- Changing business logic semantics beyond what is required for build/route parity.
- Removing governance guardrails or weakening authority gating.

============================================================
3) PRIMARY OBJECTIVES (ORDERED EXECUTION)
============================================================

A) CREATE AUDIT RECORD (REQUIRED FIRST)
1. Create file:
   docs/meta-tickets/META-VERCEL-GREEN-RESTORE-001.md
2. Paste this ticket verbatim into it.
3. Commit immediately:
   chore(meta-tickets): add META-VERCEL-GREEN-RESTORE-001

B) BUILD SURFACE HARDENING (BACKEND)
4. Ensure backend build uses hardened tsconfig:
   - backend/tsconfig.vercel.json must exist and be referenced by backend build script.
   - backend/package.json "build" should run: tsc -p tsconfig.vercel.json
5. tsconfig.vercel.json MUST exclude non-runtime folders:
   - backend/src/scripts/**
   - backend/src/tests/**
   - backend/src/narrative/**
   - any temp/dev controllers (e.g., temp_controller.ts) if not required at runtime

C) CORE TYPE SPINE: AUTH TOKEN PAYLOAD COMPATIBILITY
6. In backend/src/utils/auth.ts:
   - Update TokenPayload to include backward compatible fields:
     - id?: string (optional)
     - email: string (required)
     - isInternal: boolean (required)
   - Ensure token creation paths provide email + isInternal (default isInternal=false if unknown).

D) DATABASE SCHEMA ALIGNMENT (DRIZZLE)
7. In backend/src/db/schema.ts (uploaded):
   - Resolve ALL merge conflict markers.
   - Ensure exports referenced by code exist:
     - sopTickets MUST be exported if code imports it.
   - Add missing columns referenced by controllers to maintain type correctness:
     tenants table: knowledgeBaseReadyAt, rolesValidatedAt, execReadyAt, discoveryAcknowledgedAt
     tenant_documents table: section, sopNumber, outputNumber
   - Ensure column types are consistent with existing conventions in schema.
8. Verify: backend compiles against updated schema types (no TS2339 property missing errors for these fields).

E) SERVICE EXPORTS: REMOVE STUB BREAKAGES
9. In backend/src/services/onboardingState.service.ts (uploaded):
   - Implement and export:
     - getManyOnboardingStates
     - invalidateOnboardingStateCache
   - Minimal functional implementation acceptable:
     - If caching exists, invalidate appropriately; if not, no-op with explicit comment.
     - getManyOnboardingStates should return correct shape expected by command_center.controller.ts.

10. In backend/src/services/onboardingProgress.service.ts:
   - Align export style with imports:
     - If controllers import OnboardingProgressService class but file exports singleton (or vice versa), fix to match.
   - Prefer minimal change: adjust exports to satisfy existing imports without altering runtime behavior.

F) CONTROLLER + ROUTE CONTRACTS (NO MISSING HANDLERS)
11. In backend/src/controllers/roadmap.controller.ts (uploaded):
   - Ensure it exports all handlers required by backend/src/routes/roadmap.routes.ts:
     - getRoadmapSections
     - getRoadmapSection
     - upsertRoadmapSection
     - updateSectionStatus
     - syncRoadmapStatus
     - refreshRoadmap
     - getRoadmapTickets
     - exportRoadmap
   - If logic exists in temp_controller.ts, extract only the required handler logic with minimal dependencies.
   - Do not introduce new architecture; preserve existing request/response shapes.

12. In backend/src/controllers/superadmin.controller.ts:
   - Remove duplicate object literal keys (TS1117).
   - Remove duplicate function exports by selecting ONE canonical definition.
   - IMPORTANT: Do NOT delete large file regions blindly.
     - Strategy: list all exported handlers used by superadmin.routes.ts; ensure exactly one implementation each.

13. In backend/src/routes/superadmin.routes.ts:
   - Resolve conflicts if any.
   - Ensure it references only existing controller exports.

G) MERGE CONFLICT CLEANUP (TARGETED)
14. Resolve remaining conflicts in:
   - backend/src/controllers/ticketModeration.controller.ts
   - backend/src/controllers/tenants.controller.ts
   - backend/src/routes/superadmin.routes.ts (if still conflicted)
   - backend/src/services/sop01Persistence.ts (if referenced and conflicted)
   - any file listed by git status as unmerged that impacts build output.

H) LOCAL VERIFICATION (DEFINITION OF DONE)
15. Run local builds:
   - From repo root:
     pnpm -r --filter @roadmap/shared --filter @roadmap/backend --filter @roadmap/frontend build
16. Capture output logs and commit them to:
   - docs/verification/VERCEL_GREEN_RESTORE_LOCAL_BUILD_LOG.md (paste build output)
17. Push PR and confirm Vercel deployment is GREEN.

============================================================
4) POST-GREEN CLEANUP TICKET (SEPARATE PR)
============================================================
TICKET_ID: META-POST-GREEN-PRUNE-001
PRIORITY: P1
GOAL: prune temp/debug files safely after build is GREEN.

RULES:
- MUST be separate PR after GREEN is confirmed.
- MUST NOT delete anything required at runtime or for governance/audit trails.
- MUST preserve docs/meta-tickets/ history and docs/contracts/ governance materials.

CANDIDATES TO PRUNE (ONLY IF NOT IMPORTED/REQUIRED):
- backend/src/controllers/temp_controller.ts (if not used by runtime routes)
- backend/src/scripts/** (keep but ensure excluded from tsc surface; optional to keep)
- ad-hoc shell scripts in backend/ root (check_*.sh etc) — move to docs/ops/ or delete if obsolete
- duplicate verify_*.ts scripts (keep only canonical ones, or move to docs/verification/notes)
- untracked scratch outputs (*.txt) that are not referenced

CLEANUP PROCESS:
1) Generate an "import/usage proof" before deletion:
   - rg -n "temp_controller|verify_|check_" backend/src backend
2) Delete/move only files with zero runtime references.
3) Ensure tsconfig.vercel.json exclusions remain correct.
4) Run full monorepo build again and verify no regressions.
5) Add docs/verification/POST_GREEN_PRUNE_LOG.md describing what was pruned and why.

============================================================
5) ACCEPTANCE CRITERIA (DoD)
============================================================
- ✅ Ticket file saved in docs/meta-tickets/ BEFORE code changes.
- ✅ No conflict markers remain in any committed file.
- ✅ pnpm recursive build passes locally:
  pnpm -r --filter @roadmap/shared --filter @roadmap/backend --filter @roadmap/frontend build
- ✅ Vercel deployment is GREEN for the PR merge commit.
- ✅ Post-green cleanup ticket exists (but executed in separate PR only after GREEN).

============================================================
6) DELIVERABLES
============================================================
- PR #1: "fix(vercel): restore green build" (all compile/runtime parity fixes)
- docs/verification/VERCEL_GREEN_RESTORE_LOCAL_BUILD_LOG.md
- PR #2 (after GREEN): "chore(cleanup): prune temp files safely"
- docs/verification/POST_GREEN_PRUNE_LOG.md
