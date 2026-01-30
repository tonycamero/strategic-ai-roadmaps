# META-TICKET v2: META-BE-ENV-LOAD-RACE-001
## Goal
Fix migration/startup ordering so environment variables are loaded before DB initialization, preventing migration script failures.

## Critical Constraints
- MUST NOT change schema or migrations content.
- MUST NOT change deployment secrets or add new required env vars.
- MUST make env loading explicit and deterministic.
- MUST store THIS META-TICKET in: `docs/meta-tickets/META-BE-ENV-LOAD-RACE-001.md`
- MUST open a PR (no direct merges).

## Scope
### IN SCOPE
- migration script entrypoint ordering
- dotenv/config initialization placement

### OUT OF SCOPE
- DB schema changes
- dependency upgrades

## Acceptance Criteria
- migrations run successfully with standard .env present
- no DB init occurs before env load
