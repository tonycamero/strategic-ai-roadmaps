# META-TICKET v2: META-SHARED-IMPORT-CANONICALIZE-001

## Goal
Eliminate runtime export mismatches by removing ALL frontend imports from `shared/dist/*` and canonicalizing frontend imports to the `shared` package entry (or approved source entry), so the homepage and all routes boot without `does not provide an export named ...` errors.

## Critical Constraints
- MUST preserve platform invariants (authority gating / lifecycle contract / fail-closed behaviors).
- MUST NOT change backend, DB, auth, intake, or protected-route logic.
- MUST NOT upgrade dependencies, tooling, Vite config, or pnpm workspace settings.
- MUST NOT refactor shared domain logic beyond what is required to fix import paths.
- MUST keep changes surgical: import-path edits only, plus any minimum required barrel export wiring.
- MUST NOT delete large code blocks.
- MUST store THIS META-TICKET in: `docs/meta-tickets/META-SHARED-IMPORT-CANONICALIZE-001.md`
- MUST open a PR for review (no direct merges to main).

## Problem Statement (Authoritative Signal)
Frontend console error on homepage boot:
- The requested module `shared/dist/executiveBrief.js` does not provide an export named `normalizeText`.

## Root Cause Hypothesis
- Frontend is importing from `shared/dist/*` (stale or divergent build artifacts) rather than the canonical `shared` package entry, causing TS/JS "split brain" export mismatches.

## Scope
### IN SCOPE
- Identify and remove ALL imports in `frontend/` that reference:
  - `shared/dist/*`
  - relative paths into `../shared/dist/*`
  - any direct file path into `shared/dist/*`
- Replace them with canonical imports:
  - `import ... from "@roadmap/shared"` OR
  - `import ... from "@roadmap/shared/<approved-subpath>"` (only if that subpath is part of the package's public API)
- If required, minimally adjust `shared` package exports (barrel/index) so the canonical import provides the same symbols WITHOUT changing business logic.

### OUT OF SCOPE
- Rebuilding or publishing shared package artifacts as a "solution"
- Dependency upgrades
- Large-scale file moves
- Any new features or UX changes

## Execution Plan

### Phase A - Persist ticket
- Write this META-TICKET verbatim to `docs/meta-tickets/META-SHARED-IMPORT-CANONICALIZE-001.md` before any code edits.

### Phase B - Inventory offending imports (read-only)
- Ripgrep for direct dist imports:
  - `rg "shared/dist" frontend -n`
  - `rg "../shared/dist|../../shared/dist" frontend -n`
- Produce a short list in PR description of all files to be changed.

### Phase C - Canonicalize import paths (surgical edits)
For each offending import:
- Replace `shared/dist/<module>` with the canonical package API:
  - Prefer: `import { X } from "@roadmap/shared";`
- No logic changes; only import-path changes.

### Phase D - Ensure shared public API exposes required exports (minimal wiring)
- If frontend previously imported a symbol from `shared/dist/<module>` that is not exposed via `shared` public entry:
  - Add the minimal export to the canonical entrypoint (likely `shared/src/index.ts` and its build output path), WITHOUT altering logic.
- Do not add new behaviors; only surface existing exports.

### Phase E - Verification
- Start dev server and confirm the specific error is gone:
  - No "does not provide an export named normalizeText"
  - Homepage loads without runtime module export failures
- Run TypeScript build (or repo standard build command) to ensure no new type errors from import changes.

## Acceptance Criteria
- `rg "shared/dist" frontend -n` returns zero results.
- App boots locally; homepage renders without the `normalizeText` export error.
- No platform invariants broken; no backend changes made.
- PR opened referencing META-SHARED-IMPORT-CANONICALIZE-001.
