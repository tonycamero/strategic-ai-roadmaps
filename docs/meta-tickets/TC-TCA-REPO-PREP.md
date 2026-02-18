# META-TICKET v2 — TC-TCA-REPO-PREP-00 — TRUST CONSOLE AGENT (TENANT) — REPO PREP / NAMING NORMALIZATION

## INTENT
- Snap legacy “trustagent/roadmap copilot” naming into a clean, tenant-facing “Trust Console Agent” identity.
- Reduce cognitive dissonance before we touch the upgraded system prompt.
- This is NOT feature work. This is naming + file hygiene + compatibility shims only.

## HARD CONSTRAINTS
- No schema changes. No new services. No workflow logic changes.
- No route changes unless strictly necessary (prefer keeping /api/roadmap/qna).
- Preserve runtime behavior. Any rename must keep exports stable via aliases.
- Fail-closed: if a rename risks breaking builds without clear coverage, STOP and report.

## DELIVERABLES
- D0) Rename Plan Map (old → new) + affected imports list
- D1) PR/commit series plan (sequenced, rollback-safe)
- D2) Completed refactor with compatibility shims + green build/tests

---

# EXEC-TICKET — TC-TCA-REPO-PREP-01 — READ-ONLY INVENTORY: LEGACY NAMES + ENTRYPOINTS (NO EDITS)

## OBJECTIVE
- Produce D0: exhaustive map of legacy “trustagent/roadmap copilot” naming across FE/BE and determine safest rename boundaries.

## ACTIONS (READ-ONLY)
- rg/find/ls/cat only.

## COMMANDS
1) Identify “trustagent” and “roadmap copilot” strings
   `rg -n --hidden -S "trustagent|TrustAgent|ROADMAP COPILOT|Roadmap Copilot|copilot|homepagePromptCore|FETA|trustagentHomepage" frontend backend shared api || true`

2) Identify tenant agent UI surface + labels
   `rg -n --hidden -S "Executive Roadmap Copilot|TrustAgent|agentType === 'roadmap'|/api/roadmap/qna" frontend/src || true`

3) Identify tenant agent API surfaces
   `rg -n --hidden -S "/api/roadmap/qna|roadmapQnA|roadmapQnAAgent|roadmapQnAContext" backend/src || true`

## OUTPUT (D0)
### 1. Inventory & Risk Map

| Surface | File Path | Matches | Risk | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **FE UI Label** | `frontend/src/trustagent/TrustAgentShell.tsx` | "Your Executive Roadmap Copilot" | **LOW** | Safe to rename to "Trust Console Agent". |
| **FE UI Label** | `frontend/src/trustagent/TrustAgentShell.tsx` | "TrustAgent" (in logs/comments) | **LOW** | Internal logs can stay or be updated safely. |
| **FE API Call** | `frontend/src/lib/api.ts` | `/api/roadmap/qna` | **MED** | Keep route stable for now. |
| **BE Route** | `backend/src/routes/roadmap.routes.ts` | `/qna` | **MED** | Keep route stable. |
| **BE Controller**| `backend/src/controllers/roadmapQnA.controller.ts` | `roadmapQnA` | **LOW** | Internal naming, keep stable. |
| **BE Service** | `backend/src/trustagent/services/roadmapQnAAgent.service.ts`| `TrustAgent` | **HIGH** | System Prompt identity. **DO NOT TOUCH** in this ticket (handled in TC-TCA-PROMPT-01). |

### 2. Candidate Rename Scope
- **UI Labels (Frontend)**: **YES**. Replace "Executive Roadmap Copilot" -> "Trust Console Agent".
- **Folder Names**: **NO**. Keep `src/trustagent` to avoid import churn.
- **Service Names**: **NO**. Keep `roadmapQnA` for compatibility.
- **API Routes**: **NO**. Keep `/api/roadmap/qna`.

### 3. Do-Not-Touch List
- `backend/src/trustagent/services/roadmapQnAAgent.service.ts` (System Prompt content)
- `backend/src/controllers/trustagentHomepage.controller.ts` (Legacy public agent)
- `frontend/src/trustagent/HomepageChatBody.tsx` (Legacy public UI)

## STOP CONDITIONS
- TrustAgentHomepage is NOT wired into the Tenant Dashboard (verified via `TrustAgentShell` usage).
- **Proceed to Phase 2.**

---

# EXEC-TICKET — TC-TCA-REPO-PREP-02 — RENAME PLAN FREEZE (NO CODE YET)

## OBJECTIVE
- Decide exact rename operations and compatibility shims BEFORE edits.

## RENAME TARGETS (DEFAULT SAFE PLAN)
### A) Frontend Labeling (Approved for PREP-03)
**Target File**: `frontend/src/trustagent/TrustAgentShell.tsx`
- **Change**: Replace "Your Executive Roadmap Copilot" -> "Trust Console Agent".
- **Change**: Replace "TrustAgent" -> "Trust Console Agent" (only where visible to user).

**Target File**: `frontend/src/pages/LandingPage.tsx`
- **Change**: Replace "Your Executive Roadmap Copilot" -> "Trust Console Agent" (if visible text).

### B) Onboarding Copy
**Target File**: `frontend/src/trustagent/components/Onboarding/TrustAgentOnboarding.tsx` (if exists, or similar)
- **Action**: Grep for "Copilot" and replace with "Agent" if tenant-facing.

### C) Backend Prompt Identity (DEFERRED)
- **Status**: Deferred to `TC-TCA-PROMPT-01`.

### D) File/Folder Naming (SKIPPED)
- **Decision**: Keep `src/trustagent` folders. No compatibility shims needed in PREP-04.

## OUTPUT
- **Plan Status**: FROZEN.
- **Next Step**: Execute PREP-03.

---

# EXEC-TICKET — TC-TCA-REPO-PREP-03 — IMPLEMENT: TENANT UI CLEAN BREAK (LABELS ONLY)

## OBJECTIVE
- Remove “Executive Roadmap Copilot” references from tenant-facing UI.
- Ensure tenant sees “Trust Console Agent” consistently.

## SCOPE
- frontend only; string/label updates only.

## TASKS
1) Update tenant chat shell header/title/subtitle areas
   - frontend/src/trustagent/TrustAgentShell.tsx (and any component it uses)

2) Update any onboarding copy referencing “Copilot”
   - rg “copilot” across frontend and replace only tenant-visible copy.

3) Ensure “Homepage TrustAgent” is not referenced in tenant navigation/copy.

## ACCEPTANCE
- Tenant portal shows “Trust Console Agent” in chat surface.
- No visible “Copilot” language remains for tenants.
- **Verification**: `rg` command returned 0 matches for "Executive Roadmap Copilot", "Roadmap Copilot", or "\bCopilot\b".

---

# EXEC-TICKET — TC-TCA-REPO-PREP-04 — COMPATIBILITY SHIMS (OPTIONAL, ONLY IF WE RENAME FILES)

## OBJECTIVE
- If any file/module is renamed, create alias exports to preserve imports and prevent breakage.

## RULES
- Use re-export barrels or thin wrappers; no logic changes.

## EXAMPLES (ONLY IF NEEDED)
- backend/src/trustConsoleAgent/* re-exporting from backend/src/trustagent/*
- frontend/src/trustConsoleAgent/* re-exporting from frontend/src/trustagent/*

## ACCEPTANCE
- No import breakage.
- Build passes.

---

# EXEC-TICKET — TC-TCA-REPO-PREP-05 — VERIFICATION: BUILD + SMOKE

## OBJECTIVE
- Prove repo is stable post “clean break” label changes.

## RUN
- pnpm -r lint (if present)
- pnpm -r test (if present)
- pnpm -r build (if present)

## OUTPUT
- Commands run + pass/fail
- If fail: exact error + file path + rollback recommendation
