# ✅ Core Runtime Validation Checklist

**Purpose**: Confirm the platform is tenant-safe and operational after the refactor.  
**Time**: ~1-2 hours for complete validation  
**Owner**: Tony (manual) or Warp-assisted

---

## A. Auth & Tenant Creation

### Goal
Confirm new users are correctly bound to tenants and tokens carry `tenantId`.

### Steps

**1. Signup Flow**
- [ ] Navigate to signup endpoint/UI
- [ ] Create account with fresh email
- [ ] **Verify in DB**:
  ```sql
  -- Check tenant created
  SELECT id, name, "ownerUserId", "createdAt" FROM tenants ORDER BY "createdAt" DESC LIMIT 1;
  
  -- Check user assigned to tenant
  SELECT id, email, "tenantId", role FROM users WHERE email = '<new-email>';
  
  -- Verify relationship
  SELECT 
    u.id as user_id, 
    u.email, 
    u."tenantId",
    t.id as tenant_id,
    t."ownerUserId"
  FROM users u
  LEFT JOIN tenants t ON u."tenantId" = t.id
  WHERE u.email = '<new-email>';
  ```
- [ ] **Expect**: `tenantId` matches, `ownerUserId` matches user id, no `ownerId` field

**2. Login Flow**
- [ ] Login with new account
- [ ] Decode JWT (use jwt.io or dev tools)
- [ ] **Expect payload**:
  - `userId` present and matches DB
  - `tenantId` present and matches DB
  - `role` is `owner`
  - NO `ownerId` field

**3. Middleware Behavior**
- [ ] Hit `/api/dashboard/owner` with token
- [ ] Check server logs for tenant resolution
- [ ] **Expect**:
  - `req.tenantId` populated in middleware logs
  - No fallback triggered for fresh tenant
  - Dashboard loads without errors

---

## B. Owner Dashboard & ROI Views

### Goal
Ensure owner dashboards are fully tenant-scoped.

### Steps

**1. Dashboard Access**
- [ ] Visit `/dashboard/owner` or equivalent
- [ ] **Verify**:
  - No backend errors in logs
  - Metrics populate (intakes, roadmaps, documents)
  - Recent activity shows

**2. Tenant Isolation Test**
- [ ] Create second test tenant via signup
- [ ] Add visible test data (intake, document)
- [ ] Login as Tenant A owner
- [ ] **Verify**: Tenant B data never appears in any view

**3. Transformation/ROI Dashboard**
- [ ] Visit ROI/transformation view
- [ ] **Verify**:
  - No errors loading
  - Metrics load for correct tenant only

---

## C. Intake Flows

### Goal
Intake flows are tenant-scoped and saved with `tenantId`.

### Steps

**1. Submit Intake**
- [ ] As owner, navigate to intake URL
- [ ] Fill all sections and submit
- [ ] **Check DB**:
  ```sql
  SELECT 
    id, 
    "tenantId", 
    "userId", 
    role, 
    status 
  FROM intakes 
  ORDER BY "createdAt" DESC 
  LIMIT 1;
  ```
- [ ] **Expect**:
  - `tenantId` matches current user's tenant
  - `userId` matches current user
  - NO `ownerId` field

**2. Dashboard Reflection**
- [ ] Owner dashboard shows new intake
- [ ] SuperAdmin view for that tenant shows increased count

---

## D. Roadmaps

### Goal
All roadmap endpoints work with `tenantId` and `createdByUserId`.

### Steps

**1. Roadmap Access**
- [ ] From owner UI, open or create roadmap
- [ ] **Verify**:
  - `/api/roadmaps/sections` returns successfully
  - Sections load without errors
  - Tickets/progress data displays

**2. DB Verification**
```sql
SELECT 
  id, 
  "tenantId", 
  "createdByUserId", 
  status,
  "createdAt"
FROM roadmaps 
ORDER BY "createdAt" DESC 
LIMIT 1;
```
- [ ] **Expect**:
  - `tenantId` set
  - `createdByUserId` set
  - NO `ownerId` field

**3. Tenant Isolation**
- [ ] As different tenant owner, attempt to access roadmap
- [ ] **Expect**: 403/404 error

---

## E. Documents

### Goal
Document CRUD is tenant-safe.

### Steps

**1. Upload**
- [ ] Upload document (PDF or text) from owner UI
- [ ] **Check DB**:
  ```sql
  SELECT 
    id, 
    "tenantId", 
    "ownerUserId", 
    title,
    category,
    "filePath"
  FROM tenant_documents 
  ORDER BY "createdAt" DESC 
  LIMIT 1;
  ```
- [ ] **Expect**:
  - `tenantId` set to current tenant
  - `ownerUserId` set to current user
  - NO old `ownerId` field

**2. Download**
- [ ] Download document from UI
- [ ] **Verify**:
  - Document opens correctly
  - URL is tenant-scoped or signed

**3. Delete**
- [ ] Delete document
- [ ] **Verify**: Disappears from UI and DB

**4. Cross-Tenant Access**
- [ ] Try to access document as different tenant owner
- [ ] **Expect**: Access denied

---

## F. Invites

### Goal
Tenant-scoped invite flows.

### Steps

**1. Send Invite**
- [ ] As tenant owner, send invite to test email
- [ ] **Check DB**:
  ```sql
  SELECT 
    id, 
    "tenantId", 
    email, 
    role,
    token,
    accepted
  FROM invites 
  ORDER BY "createdAt" DESC 
  LIMIT 1;
  ```
- [ ] **Expect**:
  - `tenantId` set
  - NO `ownerId` field

**2. Accept Invite**
- [ ] Complete invite flow (accept, set password)
- [ ] **Check new user**:
  ```sql
  SELECT 
    id, 
    email, 
    "tenantId", 
    role
  FROM users 
  WHERE email = '<invited-email>';
  ```
- [ ] **Expect**:
  - `tenantId` matches inviter's tenant
  - `role` matches invite

---

## G. Onboarding States

### Goal
Onboarding progress is correct per tenant.

### Steps

**1. Trigger Progress**
- [ ] Complete actions that increment onboarding
  - Submit owner intake
  - Create roadmap
  - Upload document
  - Send invite

**2. Check State**
```sql
SELECT 
  "tenantId", 
  "percentComplete", 
  steps,
  badges
FROM onboarding_states 
WHERE "tenantId" = '<your-tenant-id>';
```
- [ ] **Verify**:
  - Single row per tenant
  - Steps/badges update as expected

---

## H. SuperAdmin Overview & Impersonation

### Goal
SuperAdmin can see everything with strict logging and scoping.

### Steps

**1. SuperAdmin Dashboard**
- [ ] Login as SuperAdmin
- [ ] Visit SuperAdmin overview
- [ ] **Verify**:
  - Tenants list loads
  - Metrics aggregate correctly
  - No cross-tenant data leakage

**2. Impersonation**
- [ ] Impersonate Tenant A owner
- [ ] **Verify**:
  - Owner dashboard loads as that owner
  - Data is correctly scoped
- [ ] **Check DB**:
  ```sql
  SELECT 
    "superAdminId", 
    "tenantId", 
    "ownerUserId",
    "startedAt",
    "endedAt"
  FROM impersonation_sessions 
  ORDER BY "startedAt" DESC 
  LIMIT 1;
  ```
- [ ] End impersonation
- [ ] **Verify**: `endedAt` set

**3. Cross-Tenant Isolation**
- [ ] Check all SuperAdmin subviews (docs, exports, workflows)
- [ ] **Verify**: No tenant data leakage

---

## Summary Checklist

Quick yes/no validation:

- [ ] Signup creates tenant + assigns user ✅
- [ ] JWT contains `tenantId` ✅
- [ ] Dashboard loads with correct tenant data ✅
- [ ] Intakes are tenant-scoped ✅
- [ ] Roadmaps are tenant-scoped ✅
- [ ] Documents are tenant-scoped ✅
- [ ] Invites are tenant-scoped ✅
- [ ] Cross-tenant access is blocked ✅
- [ ] SuperAdmin can view all tenants ✅
- [ ] Impersonation works and logs correctly ✅

---

## 🚨 If Something Fails

1. Check middleware logs for `tenantId` resolution
2. Verify JWT contains `tenantId` field
3. Check database for proper FK relationships
4. Review migration 023 was applied successfully
5. Check for any lingering `ownerId` references in failing endpoint

---

**Status**: ⬜ Not Started | 🟡 In Progress | ✅ Complete | ❌ Failed

Mark status for each section as you go.
