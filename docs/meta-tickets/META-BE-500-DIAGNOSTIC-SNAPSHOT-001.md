# META-TICKET v2: META-BE-500-DIAGNOSTIC-SNAPSHOT-001
## Goal
Restore backend stability by resolving the 500 error caused by missing controller handler `getLatestSnapshot` referenced by `diagnostic.routes.ts`.

## Critical Constraints
- MUST NOT change DB schema or migrations.
- MUST preserve existing auth/authorization behavior.
- MUST implement the handler to return valid data or fail-closed with a clear 4xx/5xx response (no silent nulls).
- MUST NOT refactor unrelated controllers/routes.
- MUST store THIS META-TICKET in: `docs/meta-tickets/META-BE-500-DIAGNOSTIC-SNAPSHOT-001.md`
- MUST open a PR (no direct merges).

## Scope
### IN SCOPE
- backend route/controller wiring for `getLatestSnapshot`
- minimal service call or repository query required to return “latest snapshot” consistent with existing snapshot model

### OUT OF SCOPE
- adding new endpoints
- altering frontend
- changing schema

## Execution
1. Persist ticket.
2. Find route usage and expected response shape.
3. Implement `getLatestSnapshot` in `diagnostic.controller.ts` using the existing snapshot service/repo.
4. Add minimal validation + error handling.
5. Verify endpoint works and backend no longer crashes.

## Acceptance Criteria
- Server no longer throws 500 due to missing handler.
- Endpoint responds deterministically.
- PR references META-BE-500-DIAGNOSTIC-SNAPSHOT-001.
