EXEC-TICKET-07
Title: Schema Enforcement Layer

Objective:
Introduce strict runtime validation for:
- Discovery Notes
- Findings Object
- Ticket Object
- Roadmap Object

Add:
backend/src/agents/moderation/SchemaValidator.service.ts

Validation:
- Reject malformed outputs
- No silent coercion

pnpm -C backend test

Exit Criteria:
- Fails closed on schema violation
