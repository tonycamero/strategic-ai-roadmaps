---
ID: EXEC-BRIEF-DELIVERY-ENDPOINT-003
TITLE: Add Internal Executive Brief Delivery Endpoint
OWNER: AG
SCOPE: Backend API

OBJECTIVE
Create explicit, internal-only delivery endpoint for Executive Briefs.

TASKS
1. Add POST endpoint:
   /api/internal/executive-briefs/:id/deliver

2. Auth:
   - SuperAdmin / Strategy only

3. Handler logic:
   a. Call renderPrivateLeadershipBriefToPDF
   b. Send email via Resend with PDF attachment
   c. Update executive_briefs:
      - status = 'DELIVERED'
      - delivered_at = now()
      - delivered_to = owner email
   d. Emit audit log

4. Idempotency:
   - If already DELIVERED → return 409

CONSTRAINTS
- No tenant-accessible routes
- No auto-send triggers

DONE WHEN
- Endpoint delivers PDF email successfully
- State transition persists
