# Validation Test Script (Post-Migration 023)

**Purpose:** Manually verify tenant isolation and core flows work correctly  
**Time Required:** 2-4 hours  
**Prerequisites:** Backend running locally, 3 test tenants seeded

---

## Setup (5 min)

### 1. Start Backend
```bash
cd /home/tonycamero/code/Strategic_AI_Roadmaps/backend
pnpm dev
```

Backend should be running on `http://localhost:3001`

### 2. Verify Test Data
You should have these tenants already seeded:
- **Hayes Real Estate Group** (roberta@hayesrealestate.com - owner)
- **BrightFocus Marketing** (sarah@brightfocusmarketing.com - owner)
- **Sample Chamber** (tonycamerobiz@gmail.com - owner)
- **Platform Administration** (tony@scend.cash - superadmin)

Check with:
```bash
pnpm exec dotenv -e .env -- tsx src/scripts/show-tenants.ts
```

---

## Test 1: Authentication & JWT (15 min)

### 1.1 Login as Tenant Owner
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "roberta@hayesrealestate.com", "password": "<password>"}'
```

**Expected Response:**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "<uuid>",
    "email": "roberta@hayesrealestate.com",
    "role": "owner",
    "tenantId": "4e2c6eb1-0767-43d6-b6a4-3fca8efd3f64"
  }
}
```

**✅ Verify:**
- JWT token returned
- Response includes `tenantId`
- Role is correct

**Copy token for next tests:** `export TOKEN_ROBERTA="<paste-token-here>"`

### 1.2 Login as Another Tenant Owner
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "sarah@brightfocusmarketing.com", "password": "<password>"}'
```

**Copy token:** `export TOKEN_SARAH="<paste-token-here>"`

### 1.3 Login as SuperAdmin
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "tony@scend.cash", "password": "<password>"}'
```

**Copy token:** `export TOKEN_SUPERADMIN="<paste-token-here>"`

---

## Test 2: Owner Dashboard (Tenant Scoping) (20 min)

### 2.1 Roberta Fetches Her Dashboard
```bash
curl -X GET http://localhost:3001/api/owner/dashboard \
  -H "Authorization: Bearer $TOKEN_ROBERTA"
```

**Expected Response:**
```json
{
  "tenant": {
    "id": "4e2c6eb1-0767-43d6-b6a4-3fca8efd3f64",
    "name": "Hayes Real Estate Group",
    "ownerUserId": "b55910fc-e4a0-470e-b95e-28804b8cc3ac"
  },
  "metrics": { ... },
  "recentIntakes": [ ... ],
  "recentRoadmaps": [ ... ]
}
```

**✅ Verify:**
- Returns only Hayes Real Estate data
- No BrightFocus or Sample Chamber data visible
- Tenant name matches

### 2.2 Sarah Fetches Her Dashboard
```bash
curl -X GET http://localhost:3001/api/owner/dashboard \
  -H "Authorization: Bearer $TOKEN_SARAH"
```

**✅ Verify:**
- Returns only BrightFocus Marketing data
- Different tenantId than Roberta's

### 2.3 Cross-Tenant Access Blocked
Try to access Roberta's data with Sarah's token:
```bash
curl -X GET http://localhost:3001/api/tenants/4e2c6eb1-0767-43d6-b6a4-3fca8efd3f64 \
  -H "Authorization: Bearer $TOKEN_SARAH"
```

**Expected:** `403 Forbidden` or empty result

---

## Test 3: Intakes (Tenant Isolation) (30 min)

### 3.1 List Roberta's Intakes
```bash
curl -X GET http://localhost:3001/api/intakes \
  -H "Authorization: Bearer $TOKEN_ROBERTA"
```

**✅ Verify:**
- Returns intakes where `tenantId = 4e2c6eb1-...` (Hayes)
- No intakes from other tenants

### 3.2 Create Intake for Roberta's Tenant
```bash
curl -X POST http://localhost:3001/api/intakes \
  -H "Authorization: Bearer $TOKEN_ROBERTA" \
  -H "Content-Type: application/json" \
  -d '{
    "formData": {
      "businessName": "Test Business",
      "industry": "Real Estate"
    },
    "status": "draft"
  }'
```

**✅ Verify:**
- Intake created with `tenantId = 4e2c6eb1-...`
- Response includes intake ID

**Copy intake ID:** `export INTAKE_ID="<paste-id>"`

### 3.3 Verify Sarah Cannot Access Roberta's Intake
```bash
curl -X GET http://localhost:3001/api/intakes/$INTAKE_ID \
  -H "Authorization: Bearer $TOKEN_SARAH"
```

**Expected:** `403 Forbidden` or `404 Not Found`

### 3.4 Verify Roberta CAN Access Her Intake
```bash
curl -X GET http://localhost:3001/api/intakes/$INTAKE_ID \
  -H "Authorization: Bearer $TOKEN_ROBERTA"
```

**Expected:** Full intake data returned

---

## Test 4: Roadmaps (Tenant + User Attribution) (30 min)

### 4.1 List Roberta's Roadmaps
```bash
curl -X GET http://localhost:3001/api/roadmaps \
  -H "Authorization: Bearer $TOKEN_ROBERTA"
```

**✅ Verify:**
- Returns roadmaps where `tenantId = 4e2c6eb1-...`
- Each roadmap has `createdByUserId` (user who generated it)
- No roadmaps from other tenants

### 4.2 Generate Roadmap (if endpoint exists)
```bash
curl -X POST http://localhost:3001/api/roadmaps/generate \
  -H "Authorization: Bearer $TOKEN_ROBERTA" \
  -H "Content-Type: application/json" \
  -d '{"intakeId": "'$INTAKE_ID'"}'
```

**✅ Verify:**
- Roadmap created with:
  - `tenantId = 4e2c6eb1-...`
  - `createdByUserId = b55910fc-...` (Roberta's user ID)
- Status is `draft` or `published`

**Copy roadmap ID:** `export ROADMAP_ID="<paste-id>"`

### 4.3 Verify Sarah Cannot Access Roberta's Roadmap
```bash
curl -X GET http://localhost:3001/api/roadmaps/$ROADMAP_ID \
  -H "Authorization: Bearer $TOKEN_SARAH"
```

**Expected:** `403 Forbidden` or `404 Not Found`

---

## Test 5: Documents (File Storage + Tenant Scoping) (20 min)

### 5.1 Upload Document for Roberta
```bash
curl -X POST http://localhost:3001/api/documents/upload \
  -H "Authorization: Bearer $TOKEN_ROBERTA" \
  -F "file=@/path/to/test.pdf" \
  -F "fileName=test-document.pdf"
```

**✅ Verify:**
- Document created with `tenantId = 4e2c6eb1-...`
- `ownerUserId` matches Roberta's user ID
- Response includes document ID

**Copy document ID:** `export DOC_ID="<paste-id>"`

### 5.2 List Roberta's Documents
```bash
curl -X GET http://localhost:3001/api/documents \
  -H "Authorization: Bearer $TOKEN_ROBERTA"
```

**✅ Verify:**
- Only documents for Hayes tenant visible
- New document appears in list

### 5.3 Verify Sarah Cannot Access Roberta's Document
```bash
curl -X GET http://localhost:3001/api/documents/$DOC_ID \
  -H "Authorization: Bearer $TOKEN_SARAH"
```

**Expected:** `403 Forbidden`

### 5.4 Download Document (Roberta)
```bash
curl -X GET http://localhost:3001/api/documents/$DOC_ID/download \
  -H "Authorization: Bearer $TOKEN_ROBERTA" \
  --output downloaded-test.pdf
```

**✅ Verify:**
- File downloads successfully
- File is the uploaded test document

---

## Test 6: Invites (Tenant Boundaries) (15 min)

### 6.1 Send Invite (Roberta invites staff)
```bash
curl -X POST http://localhost:3001/api/invites \
  -H "Authorization: Bearer $TOKEN_ROBERTA" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newstaff@hayesrealestate.com",
    "role": "staff"
  }'
```

**✅ Verify:**
- Invite created with `tenantId = 4e2c6eb1-...`
- Email matches
- Role is `staff`

**Copy invite ID:** `export INVITE_ID="<paste-id>"`

### 6.2 List Roberta's Invites
```bash
curl -X GET http://localhost:3001/api/invites \
  -H "Authorization: Bearer $TOKEN_ROBERTA"
```

**✅ Verify:**
- Only invites for Hayes tenant visible
- New invite appears in list

### 6.3 Verify Sarah Cannot See Roberta's Invites
```bash
curl -X GET http://localhost:3001/api/invites/$INVITE_ID \
  -H "Authorization: Bearer $TOKEN_SARAH"
```

**Expected:** `403 Forbidden` or `404 Not Found`

---

## Test 7: Discovery Call Notes (User Attribution) (15 min)

### 7.1 Create Discovery Note (if endpoint exists)
```bash
curl -X POST http://localhost:3001/api/discovery-notes \
  -H "Authorization: Bearer $TOKEN_ROBERTA" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Initial discovery call notes for Hayes",
    "tenantId": "4e2c6eb1-0767-43d6-b6a4-3fca8efd3f64"
  }'
```

**✅ Verify:**
- Note created with:
  - `tenantId = 4e2c6eb1-...`
  - `createdByUserId = b55910fc-...` (Roberta)

### 7.2 List Discovery Notes
```bash
curl -X GET http://localhost:3001/api/discovery-notes \
  -H "Authorization: Bearer $TOKEN_ROBERTA"
```

**✅ Verify:**
- Only notes for Hayes tenant visible

---

## Test 8: SuperAdmin Impersonation (30 min)

### 8.1 SuperAdmin Views All Tenants
```bash
curl -X GET http://localhost:3001/api/superadmin/tenants \
  -H "Authorization: Bearer $TOKEN_SUPERADMIN"
```

**Expected Response:**
```json
[
  { "id": "4e2c6eb1-...", "name": "Hayes Real Estate Group", ... },
  { "id": "bf472c81-...", "name": "BrightFocus Marketing", ... },
  { "id": "fdda8dde-...", "name": "Sample Chamber", ... },
  { "id": "99c23d61-...", "name": "Platform Administration", ... }
]
```

**✅ Verify:**
- All tenants visible (not just superadmin's own)

### 8.2 SuperAdmin Impersonates Hayes Tenant
```bash
curl -X POST http://localhost:3001/api/superadmin/impersonate \
  -H "Authorization: Bearer $TOKEN_SUPERADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "4e2c6eb1-0767-43d6-b6a4-3fca8efd3f64",
    "reason": "Validation testing"
  }'
```

**Expected:** New token with Hayes tenant context

**Copy impersonation token:** `export TOKEN_IMPERSONATE="<paste-token>"`

### 8.3 Access Hayes Data as SuperAdmin
```bash
curl -X GET http://localhost:3001/api/intakes \
  -H "Authorization: Bearer $TOKEN_IMPERSONATE"
```

**✅ Verify:**
- Returns Hayes intakes
- SuperAdmin can access tenant data while impersonating

### 8.4 Check Impersonation Audit Log
```bash
curl -X GET http://localhost:3001/api/superadmin/audit-log \
  -H "Authorization: Bearer $TOKEN_SUPERADMIN"
```

**✅ Verify:**
- Impersonation action logged with:
  - Timestamp
  - SuperAdmin user ID
  - Target tenant ID
  - Reason: "Validation testing"

---

## Test 9: SOP Tickets Moderation (15 min)

### 9.1 List SOP Tickets
```bash
curl -X GET http://localhost:3001/api/sop-tickets \
  -H "Authorization: Bearer $TOKEN_ROBERTA"
```

**✅ Verify:**
- Tickets have `moderationStatus` field (pending/approved/rejected)
- Only Hayes tenant tickets visible

### 9.2 Check Moderation Status Values
Inspect a few tickets:
- Some should have `moderationStatus: 'approved'`
- Some should have `moderationStatus: 'pending'`
- Backfill from `approved` boolean worked correctly

---

## Test 10: Database Direct Inspection (10 min)

### 10.1 Verify Schema Changes
```bash
pnpm exec dotenv -e .env -- tsx src/scripts/verify-migration.ts
```

**Expected Output:**
```
✅ users.tenant_id
✅ tenants.owner_user_id
✅ intakes.tenant_id
✅ roadmaps.tenant_id + created_by_user_id
✅ sop_tickets.moderation_status
✅ 4+ indexes created
```

### 10.2 Spot-Check Data Integrity
```bash
pnpm exec dotenv -e .env -- tsx -e "
import { db } from './src/db/index.js';
import { users, tenants } from './src/db/schema.js';

const data = await db.select({
  userName: users.name,
  userTenantId: users.tenantId,
  tenantName: tenants.name,
  tenantOwnerUserId: tenants.ownerUserId
})
.from(users)
.leftJoin(tenants, eq(users.tenantId, tenants.id))
.limit(5);

console.table(data);
"
```

**✅ Verify:**
- All users have valid `tenantId` (or NULL for superadmin)
- All tenants have valid `ownerUserId`
- User-tenant relationships look correct

---

## Validation Checklist Summary

| Test | Status | Notes |
|------|--------|-------|
| Auth & JWT | ☐ | Token includes tenantId |
| Owner Dashboard | ☐ | Tenant-scoped data only |
| Intakes (Create/Read) | ☐ | Cross-tenant blocked |
| Roadmaps (Generate/Read) | ☐ | tenantId + createdByUserId |
| Documents (Upload/Download) | ☐ | Tenant + owner scoped |
| Invites | ☐ | Tenant boundaries enforced |
| Discovery Notes | ☐ | User attribution correct |
| SuperAdmin View All | ☐ | Cross-tenant visibility |
| SuperAdmin Impersonate | ☐ | Audit trail logged |
| SOP Moderation Status | ☐ | Field present + backfilled |
| Schema Verification | ☐ | All columns renamed |

---

## Issues Found Template

If you find issues, document them here:

### Issue 1: [Title]
**Test:** Test X.Y  
**Expected:** ...  
**Actual:** ...  
**Impact:** High/Medium/Low  
**Next Steps:** ...

---

## Success Criteria

✅ **All tests pass** = Migration successful, platform stable  
⚠️ **Minor issues** = Fix before production, not blocking  
❌ **Major issues** = Rollback or urgent fix required

---

## After Validation

**If all tests pass:**
1. Push to staging
2. Run validation again on staging
3. Schedule production migration window

**If issues found:**
1. Document in this file
2. Create fix tickets
3. Re-run validation after fixes

---

**End of Validation Script**
