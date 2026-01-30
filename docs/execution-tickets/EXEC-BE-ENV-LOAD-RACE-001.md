# EXECUTION-TICKET v2: EXEC-BE-ENV-LOAD-RACE-001

## Parent META
META-BE-ENV-LOAD-RACE-001

## Objective
Fix backend startup/migration failures by ensuring `.env` variables are loaded **before** database initialization or migrations execute.

## Authorized Scope
- Backend entrypoint(s) used for migrations and server startup
- Environment initialization logic only

## Execution Steps
1. Persist this EXECUTION-TICKET to:
   - docs/execution-tickets/EXEC-BE-ENV-LOAD-RACE-001.md
2. Identify the migration/startup entry file.
3. Ensure environment loading (e.g., dotenv/config or equivalent) executes:
   - Before DB client initialization
   - Before migrations are invoked
4. Make env loading explicit and deterministic.
5. Run migration script locally with a valid `.env`.

## Constraints
- MUST NOT alter migration contents.
- MUST NOT change DB schema.
- MUST NOT add new required env vars.
- MUST NOT upgrade dependencies.
- MUST open a PR; no direct merges.

## Acceptance Criteria
- Migrations run without env-related failures.
- DB initializes only after env is loaded.
- No side effects to runtime behavior.
- PR references this EXECUTION ticket and parent META.

## Stop Conditions
- If fixing requires restructuring deployment or secrets management:
  - STOP
  - REPORT minimal options
  - DO NOT proceed
