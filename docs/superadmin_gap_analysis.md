# SuperAdmin Gap Analysis
**Date:** 2026-01-11  
**Baseline:** [SuperAdmin Audit Report](./superadmin_audit.md) (2026-01-07)  
**Current State:** Repository analysis as of 2026-01-11

---

## Executive Summary

The SuperAdmin system has **significant gaps** between documented behavior and actual implementation, particularly around **backend authorization enforcement**. While the frontend implements sophisticated authority-aware UI gating, the backend relies solely on basic authentication without role-based or authority-category enforcement.

**Critical Risk:** All SuperAdmin endpoints are accessible to any authenticated user with a valid token, regardless of their authority level (Executive/Delegate/Operator).

---

## 1. Authorization & Security Gaps

### 1.1 Backend Authorization Missing

| Component | Documented | Actual | Gap Severity |
|:----------|:-----------|:-------|:-------------|
| **Route Protection** | Authority-aware (Executive/Delegate/Operator) | Only `authenticate` middleware | 🔴 **CRITICAL** |
| **Executive Brief Access** | Executive-only | No backend enforcement | 🔴 **CRITICAL** |
| **Diagnostic Synthesis** | Executive-only trigger | No backend enforcement | 🔴 **CRITICAL** |
| **Roadmap Finalization** | Executive-only trigger | No backend enforcement | 🔴 **CRITICAL** |
| **Ticket Moderation** | Delegate+ access | No backend enforcement | 🟡 **HIGH** |

**Evidence:**
- `backend/src/routes/superadmin.routes.ts`: All routes use only `router.use(authenticate)` (line 21)
- No `@Roles()` decorators found
- No `requireSuperAdmin`, `requireExecutive`, or `requireDelegate` middleware exists
- `backend/src/middleware/auth.ts` only exports: `authenticate`, `requireRole`, `requireTenantAccess`, `requireEditorMode`

**Impact:**
- Any user with a valid JWT can call Executive-only endpoints (e.g., `/api/superadmin/firms/:id/exec-brief/status`)
- Frontend visibility controls are the **only** defense layer
- Direct API calls bypass all authority checks

### 1.2 Frontend Authority Implementation (Complete)

✅ **Implemented:**
- `useSuperAdminAuthority` hook maps roles to `AuthorityCategory` enum
- `AuthorityGuard` component enforces "Structural Invisibility"
- `SuperAdminLayout` hides/redirects based on authority
- Executive Brief widget properly gated in UI

**Gap:** Frontend-only enforcement creates security-by-obscurity, not true authorization.

---

## 2. Workflow & Feature Gaps

### 2.1 Dual Detail Pages (Ambiguous)

| Page | Route | Status | Issue |
|:-----|:------|:-------|:------|
| **Control Plane Detail** | `/superadmin/control-plane/firms/:id` | ✅ Exists | Zone 2 buttons are UI stubs (no handlers) |
| **Legacy Detail** | `/superadmin/firms/:id` | ✅ Exists | Fully functional, overlaps with Control Plane |

**Documented Risk Confirmed:**
- Both pages can trigger `generateSop01`
- Legacy page allows free-form status editing; Pipeline enforces Kanban transitions
- **No reconciliation logic** between the two views

**Recommendation:** Deprecate one or clearly define separation of concerns.

### 2.2 Hardcoded Cohort Logic

**Documented:** `EugeneCohortPage` hardcodes `EUGENE_Q1_2026`  
**Current State:** ✅ Confirmed (line 16 of `EugeneCohortPage.tsx`)

**Gap:** No dynamic cohort selection. Other cohorts invisible on Pipeline board.

**Backend Support:** `/api/superadmin/firms` accepts `?cohortLabel=` query param, but frontend doesn't expose it.

### 2.3 Executive Brief Implementation

**Documented:** Executive-only widget for acknowledging/waiving briefs  
**Current State:** ✅ **Fully Implemented**

**Backend Endpoints:**
- `GET /api/superadmin/firms/:tenantId/exec-brief`
- `POST /api/superadmin/firms/:tenantId/exec-brief`
- `PATCH /api/superadmin/firms/:tenantId/exec-brief/status`

**Frontend Component:** `ExecutiveBriefSurface.tsx` exists

**Gap:** Backend endpoints have **no authority enforcement**—any authenticated user can transition brief status.

### 2.4 Roadmap Generation Ambiguity

**Documented Concern:** Two different endpoints with unclear relationship  
**Current State:** ✅ **Confirmed Ambiguity**

| Endpoint | Used By | Purpose |
|:---------|:--------|:--------|
| `POST /api/superadmin/firms/:id/generate-roadmap` | Legacy Detail | "Generate Roadmap (Legacy)" |
| `POST /api/superadmin/firms/:id/generate-final-roadmap` | Control Plane Detail | "Finalize Strategic Roadmap" |

**Analysis:**
- `generate-roadmap`: Calls `generateRoadmapForFirm` (line 2353 in controller)
- `generate-final-roadmap`: Calls `finalRoadmapController.generateFinalRoadmap` (separate controller)

**Gap:** No documentation explaining when to use which. Likely one is ticket-based, other is legacy.

---

## 3. Missing Features

### 3.1 Zone 2 Delegate Actions (UI Stubs)

**Documented:** Control Plane Detail has "Delegate Zone" buttons  
**Current State:** 🔴 **NOT IMPLEMENTED**

**Buttons with No Handlers:**
- "Assemble Knowledge Base"
- "Validate Team Roles"
- "Signal Executive Readiness"

**Evidence:** Lines 296-308 in `SuperAdminControlPlaneFirmDetailPage.tsx` show buttons with no `onClick` props.

**Impact:** Delegates see buttons they cannot use. Misleading UX.

### 3.2 Backend Authority Middleware

**Expected:** Middleware to enforce authority categories  
**Current State:** 🔴 **DOES NOT EXIST**

**What's Missing:**
```typescript
// Expected but not found:
export function requireAuthority(category: AuthorityCategory) { ... }
export function requireExecutive() { ... }
export function requireDelegate() { ... }
```

**Workaround:** Could use existing `requireRole('superadmin')` but this doesn't distinguish Executive vs Delegate.

### 3.3 Cohort Management UI

**Expected:** Dynamic cohort selection/filtering  
**Current State:** 🟡 **PARTIALLY IMPLEMENTED**

- Backend supports `?cohortLabel=` filter
- Frontend hardcodes `EUGENE_Q1_2026`
- No UI to switch cohorts or create new ones

---

## 4. Data Integrity Risks

### 4.1 Status Modification Conflicts

**Risk:** Legacy Detail page allows direct status editing via dropdown, while Pipeline enforces drag-and-drop transitions.

**Scenario:**
1. User sets status to `pilot_active` via Legacy Detail
2. Pipeline board shows firm in `pilot_active` column
3. No validation of "Max 10 Pilots" rule when editing via Legacy Detail

**Gap:** No server-side validation of status transitions.

### 4.2 Concurrent Modification

**Risk:** Two detail pages can modify same tenant simultaneously.

**Gap:** No optimistic locking, version tracking, or conflict resolution.

---

## 5. API Surface Discrepancies

### 5.1 Undocumented Endpoints

The following endpoints exist in backend but were not mentioned in audit:

| Endpoint | Purpose |
|:---------|:--------|
| `POST /api/superadmin/firms/:id/close-intake` | Intake closure gate (CR-UX-3) |
| `PATCH /api/superadmin/intakes/:id/coaching` | Update coaching feedback |
| `POST /api/superadmin/roadmap/:id/finalize` | Finalize Strategic Roadmap (CR-UX-7) |
| `GET /api/superadmin/snapshot/:id` | Executive Snapshot (CR-UX-8) |
| `GET /api/superadmin/firms/:id/client-context` | Client preview context |
| `POST /api/superadmin/firms/:id/generate-tickets` | Generate ticket pack |
| `POST /api/superadmin/firms/:id/extract-metadata` | Extract roadmap metadata |

**Impact:** Audit is incomplete. Additional workflows exist beyond documented scope.

### 5.2 Metrics & Snapshots

**Documented:** Basic metrics card with manual input  
**Current State:** ✅ **More Extensive Than Documented**

**Additional Endpoints:**
- `GET /api/superadmin/metrics/daily-rollup` (30-day trends)
- `POST /api/superadmin/firms/:id/metrics/baseline`
- `POST /api/superadmin/firms/:id/metrics/snapshot`
- `POST /api/superadmin/firms/:id/metrics/compute-outcome`
- `POST /api/superadmin/firms/:id/export/case-study`

**Gap:** Audit only documented frontend `SnapshotInputModal`, not full metrics pipeline.

---

## 6. Recommended Immediate Actions

### Priority 1: Security (CRITICAL)

1. **Implement Backend Authority Middleware**
   - Create `requireAuthority(category: AuthorityCategory)` middleware
   - Apply to all Executive-only endpoints:
     - `/firms/:id/exec-brief/*`
     - `/firms/:id/generate-final-roadmap`
     - `/snapshot/:id`
   
2. **Add Role Validation to Existing Endpoints**
   - Minimum: Verify `req.user.role === 'superadmin'` on all routes
   - Better: Map role to authority category and enforce

### Priority 2: UX Consistency (HIGH)

3. **Remove or Implement Zone 2 Buttons**
   - Either wire up handlers or remove from UI
   - Document intended behavior if keeping

4. **Resolve Dual Detail Page Ambiguity**
   - Option A: Deprecate Legacy Detail, migrate features to Control Plane
   - Option B: Clearly separate "Operational Admin" vs "Decision Authority" contexts

### Priority 3: Feature Completeness (MEDIUM)

5. **Dynamic Cohort Selection**
   - Add cohort dropdown to Pipeline page
   - Persist selection in localStorage or URL param

6. **Status Transition Validation**
   - Enforce "Max 10 Pilots" rule on backend
   - Validate status transitions server-side

---

## 7. Architecture Recommendations

### 7.1 Authority Enforcement Pattern

**Proposed:**
```typescript
// backend/src/middleware/authority.ts
import { AuthorityCategory, RoleToAuthorityMap } from '@roadmap/shared';

export function requireAuthority(required: AuthorityCategory) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    const category = role ? RoleToAuthorityMap[role] : null;
    
    if (!category) {
      return res.status(403).json({ error: 'Invalid authority' });
    }
    
    // Executives bypass all checks
    if (category === AuthorityCategory.EXECUTIVE) {
      return next();
    }
    
    if (category !== required) {
      return res.status(403).json({ 
        error: 'Insufficient authority',
        required,
        actual: category
      });
    }
    
    next();
  };
}
```

**Usage:**
```typescript
router.patch(
  '/firms/:tenantId/exec-brief/status',
  authenticate,
  requireAuthority(AuthorityCategory.EXECUTIVE),
  superadminController.transitionExecutiveBriefStatus
);
```

### 7.2 Unified Detail Page Strategy

**Option A: Single Adaptive Detail Page**
- Merge Control Plane and Legacy into one component
- Show/hide sections based on authority
- Use tabs for "Decision View" vs "Operational View"

**Option B: Clear Separation**
- Control Plane: Executive decision-making only
- Legacy Detail: Operational data management
- Remove overlapping actions (e.g., both triggering SOP-01)

---

## 8. Testing Gaps

**Documented:** No test coverage mentioned in audit  
**Current State:** Unknown (not analyzed)

**Recommended:**
1. **Integration Tests:** Verify authority enforcement on all protected endpoints
2. **E2E Tests:** Validate UI visibility rules match backend permissions
3. **Security Tests:** Attempt to call Executive endpoints as Delegate/Operator

---

## Conclusion

The SuperAdmin system has a **well-designed frontend authority model** but **lacks backend enforcement**, creating a critical security gap. The dual detail pages and hardcoded cohort logic introduce UX confusion and scalability limits. Immediate priority should be implementing backend authority middleware before any new features.

**Overall Maturity:**
- Frontend: 85% complete (missing Zone 2 handlers)
- Backend: 40% complete (missing authorization layer)
- Documentation: 70% complete (missing newer endpoints)
