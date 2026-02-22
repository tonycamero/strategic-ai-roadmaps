EXEC-TICKET-06
Title: Authority Enforcement Centralization

Objective:
Move all lifecycle + gate checks into AuthorityResolver.

Rules:
- Intake locked?
- Exec Brief approved?
- Diagnostic sufficient?
- ROI baseline locked?

Remove lifecycle checks from controllers once validated.

Validation:
Search for duplicated gate logic:

rg -n "status ===|status !==|LOCK|SUFFICIENCY" backend/src/controllers

Exit Criteria:
- Controllers contain no lifecycle logic
- AuthorityResolver is single source of truth
