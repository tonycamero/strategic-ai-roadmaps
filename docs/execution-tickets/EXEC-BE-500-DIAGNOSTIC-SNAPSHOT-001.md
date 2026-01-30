# EXECUTION-TICKET v2: EXEC-BE-500-DIAGNOSTIC-SNAPSHOT-001

## Parent META
META-BE-500-DIAGNOSTIC-SNAPSHOT-001

## Objective
Eliminate backend 500 errors by implementing the missing `getLatestSnapshot` handler referenced by `diagnostic.routes.ts`, restoring API contract integrity.

## Authorized Scope
- backend/src/controllers/diagnostic.controller.ts
- backend/src/routes/diagnostic.routes.ts (read-only verification only)
- backend/src/services or repositories already used for snapshots (reuse only)

## Execution Steps
1. Persist this EXECUTION-TICKET to:
   - docs/execution-tickets/EXEC-BE-500-DIAGNOSTIC-SNAPSHOT-001.md
2. Locate the route in `diagnostic.routes.ts` calling `getLatestSnapshot`.
3. Implement `getLatestSnapshot` in `diagnostic.controller.ts`:
   - Must return the most recent snapshot for the given firm/context.
   - Must validate required identifiers.
   - Must return a deterministic response or a clear 4xx/5xx error.
4. Reuse existing snapshot services or queries; do NOT introduce new persistence logic.
5. Ensure handler is exported and correctly wired.
6. Run backend locally and verify the 500 error is resolved.

## Constraints
- MUST NOT change DB schema or migrations.
- MUST NOT stub with fake data or return null silently.
- MUST NOT refactor unrelated controllers or routes.
- MUST preserve auth and authorization behavior.
- MUST open a PR; no direct merges.

## Acceptance Criteria
- Backend no longer crashes on diagnostic routes.
- `getLatestSnapshot` responds deterministically.
- No new failing tests or lint errors.
- PR references this EXECUTION ticket and parent META.

## Stop Conditions
- If correct behavior requires schema or contract changes:
  - STOP
  - REPORT findings
  - DO NOT proceed
