# META-TICKET v2: META-FE-FORK-TONYCAMERO-SITE-001
## Goal
Create a dedicated repository for the TonyCamero.com personal site by forking the current monorepo and pruning non-essential platform code (backend, superadmin, shared components not used by the site).

## Critical Constraints
- MUST use a "fork and prune" strategy to preserve git history.
- Target Location: `~/code/tonycamero-site` (assumed path for the new repo).
- MUST NOT delete code from the current `Strategic_AI_Roadmaps` repo.
- MUST define an explicit allowed file list for the new repository.
- MUST store THIS META-TICKET in: `docs/meta-tickets/META-FE-FORK-TONYCAMERO-SITE-001.md`

## Scope
### IN SCOPE
- Initialization of the new repository.
- Pruning of `backend/`, `frontend/src/superadmin/`, and `frontend/src/intake/` (if not used by site).
- Retaining essential root configs (Vite, TSConfig, Tailwind).

### OUT OF SCOPE
- Deploying the site (yet).
- Modifying the personal site code itself.

## Acceptance Criteria
- New repository exists at the target path.
- Repository contains only personal site code and necessary infrastructure.
- Site boots within the new repository context.
