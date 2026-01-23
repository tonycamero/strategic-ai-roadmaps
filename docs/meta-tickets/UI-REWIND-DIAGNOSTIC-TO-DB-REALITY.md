# META-TICKET: UI-REWIND-DIAGNOSTIC-TO-DB-REALITY

**TYPE**: Canonical Correction / UI-Backend Alignment

**PRIORITY**: P0 — Blocks diagnostic generation workflow

**STATUS**: ✅ RESOLVED

---

## GOAL
Rewind SuperAdmin Execute surface so it reflects DB truth only (no legacy/public-id derived states), enabling creation of a REAL diagnostic row from scratch.

## PROBLEM
UI derives "Diagnostic GENERATED" from `tenantSummary.lastDiagnosticId` (public `diag_*` format) and/or other non-diagnostics signals.

This creates invalid actions (Lock/Publish) using a non-UUID id and breaks the canonical pipeline.

**Current Broken Flow**:
1. UI sees `lastDiagnosticId: "diag_xyz"` (legacy format)
2. UI shows "Diagnostic GENERATED" state
3. User clicks "Lock Diagnostic"
4. Frontend calls `lockDiagnostic(tenantId, "diag_xyz")` ❌
5. Backend expects UUID, fails

## CANONICAL UI TRUTH SOURCE
Diagnostic gate state MUST be derived ONLY from `diagnostics` table rows for the tenant.

**Correct Flow**:
1. Backend queries `diagnostics` table for tenant
2. Returns `latestDiagnostic: { id: UUID, status, createdAt } | null`
3. UI derives state from `latestDiagnostic.status`
4. Actions use `latestDiagnostic.id` (real UUID)

---

## REQUIRED CHANGES

### A) Backend: `getFirmDetail` Response Payload

**File**: `backend/src/controllers/superadmin.controller.ts`

**Add to response**:
```typescript
{
  tenantSummary: { ... },
  latestDiagnostic: {
    id: string;        // UUID from diagnostics table
    status: string;    // 'generated' | 'locked' | 'published' | 'archived'
    createdAt: string;
    updatedAt: string;
  } | null,
  diagnosticsCount: number,  // Optional: total diagnostics for tenant
  // ... rest of response
}
```

**Implementation**:
```typescript
// Query diagnostics table
const [latestDiag] = await db
  .select({
    id: diagnostics.id,
    status: diagnostics.status,
    createdAt: diagnostics.createdAt,
    updatedAt: diagnostics.updatedAt,
  })
  .from(diagnostics)
  .where(eq(diagnostics.tenantId, tenantId))
  .orderBy(desc(diagnostics.createdAt))
  .limit(1);

// Include in response
return res.json({
  // ...
  latestDiagnostic: latestDiag || null,
  diagnosticsCount: await db.select({ count: count() })
    .from(diagnostics)
    .where(eq(diagnostics.tenantId, tenantId)),
  // ...
});
```

**DO NOT** overload `tenantSummary.lastDiagnosticId` for execution actions.

---

### B) Frontend: `SuperAdminControlPlaneFirmDetailPage.tsx`

**File**: `frontend/src/superadmin/pages/SuperAdminControlPlaneFirmDetailPage.tsx`

#### 1. Update Type Definitions

Add to `FirmDetailResponse`:
```typescript
type FirmDetailResponse = {
  tenantSummary: { ... };
  latestDiagnostic: {
    id: string;
    status: 'generated' | 'locked' | 'published' | 'archived';
    createdAt: string;
    updatedAt: string;
  } | null;
  diagnosticsCount?: number;
  // ... rest
};
```

#### 2. Replace Diagnostic State Logic

**REMOVE** any logic that derives diagnostic state from:
- `tenantSummary.lastDiagnosticId`
- `sop_output` document counts
- Legacy `diag_*` IDs

**REPLACE** with:
```typescript
const getCanonicalStatus = (stage: number): 'LOCKED' | 'READY' | 'COMPLETE' => {
  if (!data) return 'LOCKED';
  
  // ... s1, s2 (unchanged)
  
  // s3: Diagnostic (Source: latestDiagnostic from diagnostics table)
  const diagExists = !!data.latestDiagnostic;
  const diagPublished = data.latestDiagnostic?.status === 'published';
  
  const s3 = (diagExists && s1 === 'COMPLETE') ? 'COMPLETE' : (s1 === 'COMPLETE' ? 'READY' : 'LOCKED');
  if (stage === 3) return s3;
  
  // s4: Discovery (requires published diagnostic)
  const s4Fact = truthProbe?.discovery?.exists || false;
  const s4 = (s4Fact && diagPublished) ? 'COMPLETE' : (diagPublished ? 'READY' : 'LOCKED');
  if (stage === 4) return s4;
  
  // ...
};
```

#### 3. Update Diagnostic Gate UI

**Render Logic**:
```typescript
{/* Stage 3: Diagnostic */}
{!data.latestDiagnostic && (
  <button onClick={handleGenerateDiagnostic}>
    Generate Diagnostic
  </button>
)}

{data.latestDiagnostic?.status === 'generated' && (
  <>
    <span>Diagnostic Generated</span>
    <button onClick={() => handleLockDiagnostic(data.latestDiagnostic.id)}>
      Lock Diagnostic
    </button>
  </>
)}

{data.latestDiagnostic?.status === 'locked' && (
  <>
    <span>Diagnostic Locked</span>
    <button onClick={() => handlePublishDiagnostic(data.latestDiagnostic.id)}>
      Publish Diagnostic
    </button>
  </>
)}

{data.latestDiagnostic?.status === 'published' && (
  <span className="badge-success">Diagnostic Published</span>
)}
```

#### 4. Update Action Handlers

**Ensure handlers use UUID**:
```typescript
const handleLockDiagnostic = async (diagnosticId: string) => {
  if (!params?.tenantId) return;
  // diagnosticId is now guaranteed to be UUID from latestDiagnostic.id
  await superadminApi.lockDiagnostic(params.tenantId, diagnosticId);
  await refreshData();
};

const handlePublishDiagnostic = async (diagnosticId: string) => {
  if (!params?.tenantId) return;
  // diagnosticId is now guaranteed to be UUID from latestDiagnostic.id
  await superadminApi.publishDiagnostic(params.tenantId, diagnosticId);
  await refreshData();
};
```

---

### C) Remove/Ignore Legacy `diag_*` for Gate Actions

**Rules**:
- `lastDiagnosticId` may display for informational purposes
- `lastDiagnosticId` MUST NEVER drive buttons/routes/actions
- All diagnostic actions MUST use `latestDiagnostic.id` (UUID)

---

## ACCEPTANCE CRITERIA

For tenant `883a5307-6354-49ad-b8e3-765ff64dc1af`:

1. ✅ UI shows "No diagnostic yet" (not "GENERATED") when `latestDiagnostic === null`
2. ✅ Clicking "Generate Diagnostic" creates a `diagnostics` row
3. ✅ After refresh, UI shows "GENERATED" with real UUID
4. ✅ "Lock Diagnostic" button uses UUID from `latestDiagnostic.id`
5. ✅ "Publish Diagnostic" button uses UUID from `latestDiagnostic.id`
6. ✅ Lock/Publish work end-to-end without 404/500 errors
7. ✅ Discovery gate only enables when `latestDiagnostic.status === 'published'`

---

## VERIFICATION STEPS

1. Clear any legacy `diag_*` from `tenants.lastDiagnosticId` for test tenant
2. Confirm UI shows "No diagnostic yet"
3. Click "Generate Diagnostic"
4. Verify `diagnostics` table has new row with UUID
5. Verify UI updates to show "GENERATED" state
6. Click "Lock" → verify status changes to "locked"
7. Click "Publish" → verify status changes to "published"
8. Verify Discovery gate becomes READY

---

## FILES TO MODIFY

1. `backend/src/controllers/superadmin.controller.ts` - `getFirmDetail`
2. `frontend/src/superadmin/pages/SuperAdminControlPlaneFirmDetailPage.tsx`
   - Type definitions
   - `getCanonicalStatus` function
   - Diagnostic gate rendering
   - Action handlers

---

**Date Created**: 2026-01-20
**Status**: In Progress
