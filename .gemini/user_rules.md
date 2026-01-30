# Project-Specific Rules
## META-TICKET Documentation
When I provide a META-TICKET in the format:
META-TICKET: [TICKET-NAME] ... END META-TICKET

You MUST:
1. Save it to `docs/meta-tickets/[TICKET-NAME].md` BEFORE starting implementation
2. Format it as proper markdown documentation
3. Include status, priority, problem, solution, and acceptance criteria sections
4. Confirm the save before proceeding
This is non-negotiable for audit trail and project governance.

## Governance Awareness (Non-Blocking)

When a META-TICKET or execution ticket is created or saved:

- Provide a gentle reminder that work is subject to `docs/GOVERNANCE.md` requirements.
- This reminder is informational only and must NOT block execution.
- Do not require explicit confirmation unless the user requests a governance review.

## GOVERNANCE.md Compliance (Non-Negotiable)

Before implementing any change that affects system behavior (DB schema, RBAC, state machine, API routes, irreversible actions, audit logging, or lifecycle gates):

1) Open and follow `GOVERNANCE.md`
2) Ensure the planned change does not violate any invariants
3) If there is any conflict between a ticket and `GOVERNANCE.md`, `GOVERNANCE.md` wins
4) Call out the specific section(s) of `GOVERNANCE.md` being satisfied in the META-TICKET

Do not proceed to implementation until this check is complete.



Purpose:
Maintain governance awareness and audit alignment without introducing friction or slowing execution.

Only escalate governance concerns when schema, authority, or irreversible state transitions are involved.