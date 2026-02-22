EXEC-TICKET-09
Title: Observability + Audit Trace

Objective:
Every orchestrator invocation logs:

- tenantId
- userId
- capability
- gravityMode
- authorityDecision

Implementation:
Use existing audit_events table if available.

Validation:
Trigger QnA → confirm audit row written.

Exit Criteria:
- Deterministic audit trail
