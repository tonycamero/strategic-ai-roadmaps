# EXECUTION-TICKET v2: EXEC-FE-FORK-TONYCAMERO-SITE-001

## Parent META
META-FE-FORK-TONYCAMERO-SITE-001

## Objective
Create a dedicated repository for TonyCamero.com by forking the current monorepo and pruning it down to only the personal site codebase, preserving git history.

## Authorized Scope
- Target Path: `/home/tonycamero/code/tonycamero-site`
- Selective deletion of backend, superadmin, and intake logic within the FORK only.
- Pruning non-essential shared components/configs not used by the personal site.

## Execution Steps
1. Create the target directory and initialize it as a git repo (or `cp -a` and clean up `.git` if not forking from a remote).
   - *Refined Plan*: Copy the entire repo to the target path to preserve local history/state, then prune.
2. Prune the following from the NEW repository:
   - `backend/`
   - `frontend/src/superadmin/`
   - `frontend/src/intake/`
   - `docs/` (except essential site docs)
   - Any shared modules not imported by the landing page/public site.
3. Update `package.json` in the new repo to reflect its new identity.
4. Verify the site boots in the new repository.

## Constraints
- MUST NOT modify the original `Strategic_AI_Roadmaps` repository (except for this ticket persistence).
- MUST preserve git history in the new repository.
- MUST NOT delete shared logic that is still imported by the personal site.

## Acceptance Criteria
- `/home/tonycamero/code/tonycamero-site` contains a functional codebase for TonyCamero.com.
- `backend/` and `superadmin/` are absent from the new repo.
- The new repo boots (`npm run dev`) and renders the personal site correctly.
