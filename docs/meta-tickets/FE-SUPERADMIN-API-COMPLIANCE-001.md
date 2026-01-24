# Ticket: FE-SUPERADMIN-API-COMPLIANCE-001
Title: Enforce SuperAdmin API Client Authority on All Frontend Components

## Problem
Several frontend components are bypassing the authoritative SuperAdmin ApiClient, making direct fetch calls or using undefined methods. This violates the "Single Source of Truth" architectural principle for the SuperAdmin Control Plane.

## Violations Detected
1. **Direct Fetch Calls**: Components like `ExecutiveSnapshot` and `AdvisorPanel` are using `fetch()` directly.
2. **Method Does Not Exist**: Components are calling methods on `superadminApi` that simply do not exist in `frontend/src/superadmin/api.ts` (e.g., `generateRoadmap`).
3. **Invalid SVG Props**: Specific components (`ExecuteTenantRow`) have SVG `title` props that cause React warnings/errors and are not accessible.

## Scope & Requirements
- **Target Files**:
  - `frontend/src/superadmin/components/RoadmapGenerationPanel.tsx`
  - `frontend/src/superadmin/components/AssistedSynthesisAgentConsole.tsx`
  - `frontend/src/superadmin/components/AssistedSynthesisModal.tsx`
  - `frontend/src/superadmin/components/ExecuteTenantRow.tsx` (SVG Fixes)
  - `frontend/src/superadmin/components/OperatorExecutionPanel.tsx` (or similar panel if found)
  - `frontend/src/superadmin/components/AdvisorPanel.tsx` (if exists)

- **Rules**:
  - **NO new ApiClient methods**: You cannot add new methods to `api.ts`.
  - **Disable if Missing**: If a component needs a method that is missing from `ApiClient`, DISABLE the feature in the UI (e.g., button disabled, warning message). DO NOT fix the API client.
  - **Constitution**: The `frontend/src/superadmin/api.ts` file is the CONSTITUTION. If it's not there, the feature effectively does not exist.

## Action Plan
1. **Audit & Fix**:
   - For `RoadmapGenerationPanel`, remove invalid calls (e.g. `generateRoadmap`, `getGenerationStatus`). Replace with "Feature Disabled due to API Authority" state.
   - For `AssistedSynthesisAgentConsole`, disable the chat interface if `sendAgentMessage` is missing.
   - For `ExecuteTenantRow`, replace invalid SVG `title="..."` props with valid `<title>...</title>` children.
   - For any component using direct `fetch`, convert to `ApiClient` if method exists, or disable if not.

## Deliverables
- Updated frontend components that strictly adhere to `superadminApi` surface.
- No direct fetch calls (except where strictly necessary for binary/blob downloads if `api.ts` supports it, but purely ad-hoc fetches are banned).
- SVG accessibility fixes.
