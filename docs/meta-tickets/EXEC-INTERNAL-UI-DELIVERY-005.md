---
ID: EXEC-INTERNAL-UI-DELIVERY-005
TITLE: Add “Deliver Executive Brief” Control to Internal UI
OWNER: AG
SCOPE: SuperAdmin UI only

OBJECTIVE
Enable explicit delivery action from internal control plane.

TASKS
1. Locate Executive Brief panel component
2. Add button:
   - Label: “Deliver Executive Brief”
   - Visible ONLY if status === APPROVED

3. Add confirmation modal:
   Copy:
   “This document contains interpretive leadership insights intended for executive review.
    Once delivered, it becomes the reference point for diagnostic and discovery.”

4. On confirm:
   - Call delivery endpoint
   - Show success state
   - Disable button after delivery

CONSTRAINTS
- No tenant UI changes
- No preview/download options

DONE WHEN
- Button delivers brief
- Button disables after delivery
