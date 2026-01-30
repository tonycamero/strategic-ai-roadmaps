# META-TICKET v2: EXEC-FE-COPY-PUBLIC-BRANDING-001

## Goal
Execute authorized **copy-only** branding updates on public marketing pages to transition "TrustAgent" to "TrustConsole" where appropriate, while strictly enforcing the boundary against Tenant/App modifications.

---

## Critical Constraints (Non-Negotiable)

- MUST NOT change logic, routing, or component behavior.
- MUST NOT touch Tenant or SuperAdmin pages (except to revert accidental changes).
- MUST ensure `TrustAgentShell` conditionally renders correct branding:
  - **Public/Homepage:** "TrustConsole"
  - **App/Roadmap Agent:** "Executive Roadmap Copilot" (or original "TrustAgent" if preferred, but distinct from public).
- MUST revert any accidental changes to `TeamMemberDashboard.tsx` or `Onepager.tsx` if they violate the "Public Only" rule.

- MUST store THIS META-TICKET in:
  - `docs/meta-tickets/EXEC-FE-COPY-PUBLIC-BRANDING-001.md`

---

## Execution Plan

1.  **Revert Tenant/App Violations:**
    - Restore `frontend/src/pages/team/TeamMemberDashboard.tsx` to its clean state (no diff).
    - Restore `frontend/src/pages/Onepager.tsx` to its clean state (no diff) OR confirm it is strictly public. (Assuming clean revert is safest).

2.  **Finalize Public Branding:**
    - Confirm `frontend/src/trustagent/TrustAgentShell.tsx` handles the distinction correctly:
      - `agentType === 'public'` -> "TrustConsole" (Title/Aria)
      - `agentType === 'roadmap'` -> "Executive Roadmap Copilot" (Title/Aria)
    - Confirm `frontend/src/trustagent/flows.ts` uses "TrustConsole" for the public intro message.

3.  **Verify & Lock:**
    - Run `git diff` to ensure only `TrustAgentShell.tsx` and `flows.ts` are modified (plus the meta-tickets).
    - Ensure build passes.

---

## Verification

- [ ] `TeamMemberDashboard.tsx` is clean (no diff).
- [ ] `Onepager.tsx` is clean (no diff).
- [ ] `TrustAgentShell.tsx` Logic:
  - `aria-label` is conditional.
  - Panel Title is conditional.
  - Intro message (in `flows.ts`) is "TrustConsole".

---

## Acceptance Criteria

- Public branding is "TrustConsole".
- App branding is "Executive Roadmap Copilot" (or unchanged).
- No file pollution in Tenant/SuperAdmin areas.
