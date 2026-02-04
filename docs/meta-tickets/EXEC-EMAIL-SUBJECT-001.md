EXECUTION-TICKET: EXEC-EMAIL-SUBJECT-001

Title:
Adjust Team Invite Email Subject Line to Explicitly Reference Strategic AI Roadmaps

Status:
APPROVED

Authority Level:
Execution-Ticket (UI / Messaging Copy Only)

Objective:
Clarify the context of team invitation emails by explicitly naming the product
("Strategic AI Roadmaps") to reduce ambiguity and increase trust and open rates.

Current Behavior:
Outgoing team invitation email subject line renders as:
<Tenant Lead> has invited you to <Tenant Company Name>

Proposed Change:
Update the subject line template to:
<Tenant Lead> has invited you to Strategic AI Roadmaps for <Tenant Company Name>

Scope Constraints:
- STRICTLY limited to the email subject line string
- No changes to:
  - Email body
  - Email sending logic
  - Auth, tenant creation, or invite flows
  - Templates beyond the subject line
- No refactors
- No dependency changes

Files in Scope:
- Invite email template or mailer config file ONLY
  (exact file path to be identified before execution)

Files Explicitly Out of Scope:
- Intake flows
- Tenant provisioning
- Permissions
- UI copy elsewhere
- Any backend services unrelated to email dispatch

Risk Assessment:
- Low
- Copy-only change
- Fail-closed behavior preserved

Rollback Plan:
- Revert subject line string to previous value

Success Criteria:
- New invites display updated subject line
- No change to delivery, auth, or tenant behavior
