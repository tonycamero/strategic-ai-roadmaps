---
ID: EXEC-DIAGNOSTIC-GATE-006
TITLE: Gate Diagnostic Generation on Brief Delivery
OWNER: AG
SCOPE: Backend logic

OBJECTIVE
Ensure Diagnostic cannot be generated until Executive Brief is delivered.

TASKS
1. Locate diagnostic generation guard
2. Add requirement:
   executive_briefs.status === 'DELIVERED'

3. Error message:
   “Executive Brief must be delivered before diagnostic generation.”

CONSTRAINTS
- No UI warnings needed
- Backend enforcement only

DONE WHEN
- Diagnostic cannot run pre-delivery
