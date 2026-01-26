# META-TICKET v2
ID: META-FIX-ONBOARDING-JOURNEY-FLAGS-001
TITLE: Fix Onboarding Journey Tracking flags (sidebar step indicators) to derive from persisted state
PRIORITY: P0 (demo tomorrow)

SCOPE LOCK
- Touch ONLY these areas unless absolutely necessary:
  1) frontend/src/context/OnboardingContext.tsx
  2) frontend/src/layouts/OnboardingLayout.tsx (or the component that renders Journey Tracking sidebar)
  3) frontend/src/components/onboarding/** (ONLY if needed for step completion triggers)
  4) backend ONLY IF a missing onboarding-state endpoint/field is confirmed (no refactors)
- No schema migrations.
- No new flows, no UX changes beyond flag accuracy.
- No unrelated TypeScript “cleanup”.

PROBLEM STATEMENT
In the onboarding UI, user can be on a later step (e.g., Business Profile / Owner Intake), but earlier Journey Tracking steps ("Create Dashboard", "Organization Type") are not marked completed (not green).
This desync appears after creating a new client and moving through steps. Data exists and pages render, but sidebar flags remain incorrect.

TARGET BEHAVIOR (ACCEPTANCE)
Given a tenant in onboarding:
- If dashboard creation action succeeded (persisted), "Create Dashboard" shows completed (green) after refresh AND during same session.
- If organization type is selected and persisted, "Organization Type" shows completed (green) after refresh AND during same session.
- If business profile saved/persisted, "Business Profile" shows completed (green).
- Flags must be stable across reloads (rehydration from API), not dependent on navigation history.

HYPOTHESIS (LIKELY ROOT CAUSE)
Journey Tracking flags are currently driven by local UI state / linear reducer assumptions and are not recomputed from persisted backend state on reload (or after transitions).

INVARIANTS
- Journey flags must be derived from persisted facts, not route history.
- Do not “force green” based on current route.
- Fail closed: if state cannot be verified, do NOT mark complete.

PLAN (AG MUST FOLLOW)
Phase A — Locate the source of truth used by Journey Tracking
1) Identify which component renders the left sidebar step list.
2) Identify the source for step completion flags:
   - local React state? Context? onboarding state from API? tenantSummary.executionPhase? onboarding_states table?
3) Confirm what API calls occur on onboarding pages (Network → /api/tenants/me, /api/tenants/:id/..., etc.) and which responses include onboarding/progress info.

Phase B — Implement deterministic completion derivation
4) Define a pure function, e.g. deriveOnboardingProgress(tenant, baseline, orgType, businessProfile, intakes, etc.)
   - CreateDashboard complete if persisted dashboard (or equivalent) exists.
   - OrgType complete if persisted org type exists.
   - BusinessProfile complete if business profile fields exist (companyName/teamSize/monthlyLeads/region/etc.) AND profile finalized if such a flag exists.
   - OwnerIntake complete if owner intake submission exists (or intake status completed for role=owner).
5) Run this derivation:
   - on initial load (rehydrate)
   - after each save/transition event (optimistic update allowed ONLY if save response confirms persistence)

Phase C — Verify in UI
6) Manual test steps:
   - Create a new tenant, complete Create Dashboard, Org Type, Business Profile. Confirm steps go green immediately.
   - Hard refresh. Confirm greens persist.
   - Navigate directly to Owner Intake route. Confirm previous steps remain green.

Phase D — Guardrails
7) Add minimal logging (dev-only) behind a flag if needed, but remove noisy logs before final.

DELIVERABLES
- Minimal diff across allowed files.
- No new APIs unless current API lacks necessary persisted fields; if so, add ONE small backend field/endpoint and wire it.
- Provide exact file paths touched + explanation of derivation mapping.

STOP CONDITIONS
- If AG discovers missing backend truth source and a backend change is required, AG must:
  1) Identify the single smallest backend change needed
  2) Implement only that
  3) Not expand scope

SUCCESS CRITERIA
- Journey Tracking flags accurately reflect persisted completion state across reloads.
- No regressions to other onboarding steps.
