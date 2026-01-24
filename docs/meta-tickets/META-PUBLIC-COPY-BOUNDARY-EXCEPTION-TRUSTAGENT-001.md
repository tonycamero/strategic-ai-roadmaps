# META-TICKET v2: META-PUBLIC-COPY-BOUNDARY-EXCEPTION-TRUSTAGENT-001

## Goal
Formally authorize the already-completed public-facing branding changes that rename “TrustAgent” → “TrustConsole” within the TrustAgent public sales experience, while preserving the boundary against Tenant/SuperAdmin modifications.

This ticket closes the governance loop on the boundary incident without reverting accepted work.

## Authorized Exception (Explicit Allowlist)
The following files are explicitly authorized to remain modified for public branding:
- frontend/src/trustagent/TrustAgentShell.tsx
- frontend/src/trustagent/flows.ts

## Non-Negotiable Constraints
- MUST NOT modify any Tenant/App/SuperAdmin pages or copy.
- MUST NOT modify:
  - frontend/src/pages/team/**
  - frontend/src/superadmin/**
  - any tenant dashboard/app routes
- MUST keep TrustAgent gated from tenant artifacts and data (existing controls assumed correct).
- MUST NOT expand scope beyond the two allowlisted files above.
- MUST store THIS META-TICKET in:
  - docs/meta-tickets/META-PUBLIC-COPY-BOUNDARY-EXCEPTION-TRUSTAGENT-001.md
- MUST open a PR (no direct merges).

## Required Verification (Read-Only)
Agent MUST provide, in PR description:
1) `git diff --name-only origin/<base>...HEAD`
2) Confirmation that ONLY these files are changed:
   - frontend/src/trustagent/TrustAgentShell.tsx
   - frontend/src/trustagent/flows.ts
3) Explicit statement:
   - “No Tenant/App/SuperAdmin files were modified.”

## Acceptance Criteria
- TrustConsole branding remains live on public-facing TrustAgent experience.
- No changes exist in forbidden directories (team/tenant/superadmin).
- PR includes the verification outputs above.
