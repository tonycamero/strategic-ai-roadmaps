# EXECUTION-TICKET v2: EXEC-FE-PROXY-CANONICALIZE-API-BASE-001

## Parent META
META-FE-PROXY-CANONICALIZE-API-BASE-001

## Objective
Eliminate frontend connectivity failures by removing all hardcoded `localhost:3001` API calls and enforcing use of the Vite proxy via relative API paths.

## Authorized Scope
- frontend API client configuration
- frontend callsites that hardcode backend base URLs
- Vite proxy usage (read-only confirmation of existing config)

## Execution Steps
1. Persist this EXECUTION-TICKET to:
   - docs/execution-tickets/EXEC-FE-PROXY-CANONICALIZE-API-BASE-001.md
2. Search frontend for hardcoded backend URLs:
   - `localhost:3001`
   - `http://127.0.0.1:3001`
3. Replace with canonical relative base (e.g. `/api`).
4. Ensure all dev requests flow through the existing Vite proxy.
5. Run frontend in WSL and verify API calls succeed.

## Constraints
- MUST NOT modify backend routes.
- MUST NOT introduce new env variables.
- MUST NOT change Vite config unless strictly required.
- MUST keep changes minimal and localized.
- MUST open a PR; no direct merges.

## Acceptance Criteria
- No frontend code references `localhost:3001`.
- Frontend boots and communicates with backend reliably in WSL.
- No regressions in production behavior.
- PR references this EXECUTION ticket and parent META.

## Stop Conditions
- If backend route changes are required:
  - STOP
  - REPORT
  - DO NOT proceed
