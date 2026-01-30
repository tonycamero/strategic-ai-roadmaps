# META-TICKET v2: META-FE-PROXY-CANONICALIZE-API-BASE-001
## Goal
Ensure frontend uses the Vite proxy consistently (relative /api base) instead of hardcoding localhost:3001, preventing WSL connectivity failures.

## Critical Constraints
- MUST NOT change backend routes.
- MUST avoid broad refactors; change only API base configuration and callsites that hardcode localhost.
- MUST NOT introduce new dependencies.
- MUST store THIS META-TICKET in: `docs/meta-tickets/META-FE-PROXY-CANONICALIZE-API-BASE-001.md`
- MUST open a PR.

## Scope
- Replace hardcoded API base URLs with relative `/api` (or configured base) used by Vite proxy.
- Verify requests route through proxy in dev.

## Acceptance Criteria
- No frontend code references localhost:3001 for API calls in dev
- Dev works reliably in WSL via proxy
