# META-TICKET v2 — FE STRIKE 7 (API COMPLIANCE BASELINE)
ID: FE-SUPERADMIN-API-COMPLIANCE-001-S7
Owner: Tony
Area: frontend/src/superadmin/*
Type: Stabilization / Compliance
Priority: P0
Status: READY

## Mission
Enforce "Sole Client" authority for SuperAdmin by eliminating any FE calls to non-existent ApiClient methods and removing the TypeScript build blockers introduced/left behind by feature-disable stubs (TS6133 + trivial type errors) **without adding new API surface**.

This is Strike 7 globally, Strike 1 of the FE Stabilization sequence.

## Non-Negotiable Rules
- DO NOT add new methods to `frontend/src/superadmin/api.ts` (ApiClient surface) in this strike.
- DO NOT re-introduce ad-hoc `fetch()` for superadmin endpoints.
- DO NOT refactor UI/UX beyond what is required to compile.
- If a feature is disabled due to missing API method, the UI must clearly show "Disabled (API Surface Compliance)" and the code must compile cleanly.
- Surgical edits only. No renames. No new components unless absolutely required to remove compile errors.
- Preserve routing and existing pages; this ticket is not about Wouter or route config.

## Scope (Files Allowed)
- frontend/src/superadmin/components/**
- frontend/src/superadmin/pages/**
- frontend/src/superadmin/SuperAdminLayout.tsx
- frontend/src/superadmin/api.ts (READ ONLY in intent; edits allowed only to fix typings/exports inconsistencies, not to add new endpoints)

## Primary Success Criteria
- `pnpm -C frontend exec tsc -p tsconfig.json --noEmit` passes OR is reduced to only unrelated pre-existing errors outside SuperAdmin.
- No remaining TS errors referencing missing ApiClient properties for SuperAdmin features in the targeted files.
- No TS6133 errors in the files modified by this ticket.
- UI remains functional for `/superadmin/firms` and any page that currently renders; disabled panels show explicit notice.

## Work Plan
### Phase A — Verify API Surface Authority
1) Open `frontend/src/superadmin/api.ts` and capture the exported method list (names + arg shapes).
2) Search for any usage of methods not in that list:
   - `rg -n "superadminApi\\.(\\w+)" frontend/src/superadmin`
   - `rg -n "api\\.(\\w+)" frontend/src/superadmin`
3) For each offender:
   - Replace the call site with a disabled UI path + warning log.
   - Remove any now-unused imports/state/handlers.

### Phase B — Fix TS6133 Build Blockers (Only in touched files)
For each file updated in this ticket:
- Remove unused imports (e.g., `superadminApi` if feature disabled).
- Remove unused state setters/vars (`setEditingId`, `editingId`, `onRefresh` if unused).
- Remove unused props in component signatures OR prefix with `_` ONLY if required by prop contract (prefer removing if possible).
- Remove unused type imports (`FC`, `CSSProperties`, `ReactNode`) or import them correctly if required.

### Phase C — Fix Trivial Type Errors In-Place
Resolve only errors surfaced by `tsc` that block build in the files touched:
- Example classes:
  - missing identifiers (`setEditingId` referenced but not defined)
  - wrong param shapes to existing methods
  - wrong prop types caused by removed fields

### Phase D — Evidence Pack
Produce a concise evidence pack in `docs/meta-tickets/FE-SUPERADMIN-API-COMPLIANCE-001-S7-EVIDENCE.md` with:
- List of files changed
- Before/after of every removed offending ApiClient call (method name + line refs)
- `tsc --noEmit` output (or remaining errors with explanation why they are unrelated/out of scope)

## Targeted Fix List (Known from current logs)
1) frontend/src/superadmin/SuperAdminLayout.tsx
   - Remove unused `FC` import or use it properly.
2) AssistedSynthesisAgentConsole.tsx
   - If disabled: remove unused `superadminApi` import and any unused handlers/state.
3) AssistedSynthesisModal.tsx
   - Remove unused `superadminApi` import, `onRefresh`, `editingId`, `accepted` unless actually used.
4) DiscoverySynthesisBuilder.tsx
   - Remove unused setters/vars or implement minimal usage if intended.
5) FirmDrawer.tsx
   - Remove unused `implementation` param and fix `ReactNode` missing import ONLY if actually required.
6) IntakeModal.tsx
   - Fix TS2345: do not pass object where string is expected; adjust to correct type contract (surgical).
7) OperatorExecutionPanel.tsx
   - Remove unused `setState` if feature disabled.
8) ReadinessChecklistCard.tsx
   - Remove unused `tenantId` if not used or underscore it if required by interface.
9) RoadmapGenerationPanel.tsx
   - Remove unused `canAssemble` if forced disabled; remove any dead logic and unused state.
10) EugeneCohortPage.tsx
   - Remove unused `CSSProperties`.
11) SuperAdminControlPlaneFirmDetailPage.tsx
   - Replace calls to non-existent methods:
     - closeIntakeWindow
     - generateFinalRoadmap
     - saveDiscoveryNotes
   - Fix TS2345 "string not assignable" errors by aligning arg-shapes to existing ApiClient methods.
   - Remove unused setters `setExecBriefData`, `setDiagData`, and unused handler `handleActivateModeration` if not referenced.
12) SuperAdminExecutePage.tsx
   - Remove unused `location` if unused.

## Acceptance Test
Run:
- `pnpm -C frontend exec tsc -p tsconfig.json --noEmit --pretty false`
- Confirm no TS6133 errors remain in modified files.
- Confirm no TS2339/TS2551 for missing ApiClient methods remain in SuperAdmin pages/components.

## Deliverables
- Code changes committed on a dedicated branch.
- Evidence pack markdown in docs/meta-tickets/.
- Final note listing any remaining TS errors that are outside SuperAdmin scope (if any).
