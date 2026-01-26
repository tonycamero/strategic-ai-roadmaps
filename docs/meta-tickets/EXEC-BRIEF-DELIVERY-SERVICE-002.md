---
ID: EXEC-BRIEF-DELIVERY-SERVICE-002
TITLE: Wire PDF Renderer into Executive Brief Delivery Service
OWNER: AG
SCOPE: Backend only

OBJECTIVE
Enable Executive Brief PDF generation via existing delivery service.

TASKS
1. Open:
   backend/src/services/executiveBriefDelivery.service.ts

2. Remove hard-coded throw:
   throw new Error('PDF rendering disabled...')

3. Import renderer from:
   backend/src/services/pdf/

4. Implement:
   renderPrivateLeadershipBriefToPDF(briefId)

5. Guards:
   - brief.status MUST === 'APPROVED'
   - throw explicit error otherwise

6. Fetch + assemble aggregate data:
   - executive_briefs
   - intake_vectors
   - derived role attributions

7. Return PDF Buffer

CONSTRAINTS
- No email logic here
- No state mutation here

DONE WHEN
- Function returns Buffer for approved brief
- Function throws clean error for non-approved brief
