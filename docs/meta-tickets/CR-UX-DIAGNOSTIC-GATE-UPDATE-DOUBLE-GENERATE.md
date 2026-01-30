# META-TICKET: CR-UX-DIAGNOSTIC-GATE-UPDATE-DOUBLE-GENERATE

**ID**: CR-UX-01

**TYPE**: UX + State Wiring + Safety Guard (Frontend first, optional backend hardening)

**PRIORITY**: P0

**STATUS**: ✅ RESOLVED

**OWNER**: AG

**REPO**: Strategic_AI_Roadmaps

---

## PATHS

- `frontend/src/superadmin/pages/SuperAdminControlPlaneFirmDetailPage.tsx`
- `frontend/src/superadmin/types.ts`
- `backend/src/controllers/superadmin.controller.ts` (optional hardening)

---

## SCOPE LOCK

- Do NOT touch `user_rules.md` or guardrail docs
- Do NOT reintroduce legacy routes
- Keep behavior aligned with Canonical Status System and TruthProbe

---

## CONTEXT / BUG

### Issue 1: UI Does Not Reflect Diagnostic Generation

1. UI does not reflect that a Diagnostic was generated, even though API payload includes:
   - `tenantSummary.lastDiagnosticId` (UUID)
   - `latestDiagnostic { id, status, createdAt, updatedAt }`

2. **Root cause**: Frontend does NOT store `firmDetail.latestDiagnostic` into `SuperAdminTenantDetail` state (`data`), so:
   - `getCanonicalStatus(3)` uses `!!data.latestDiagnostic` which is always `false`
   - Stage never becomes `COMPLETE`

### Issue 2: Duplicate DIAGNOSTIC_GENERATED Audit Events

3. Duplicate `DIAGNOSTIC_GENERATED` audit events occur if user clicks Generate twice (seconds apart)
   - **Repro**: Click Generate twice quickly; backend accepts both; activity shows duplicates

---

## GOALS (Definition of Done)

### A) Diagnostic Gate Updates Immediately After Generation

- After clicking Generate, the Diagnostic stage should move from `READY` → `COMPLETE`
- The action button should switch from "Generate" to "Lock" (or whatever TruthProbe indicates)

### B) Prevent Duplicate Generate Calls from Double-Click

- UI must disable the Generate button while request is in-flight
- Handler must early-return if already generating
- (Optional) Add simple backend idempotency to avoid duplicates even if UI fails

---

## IMPLEMENTATION

### Task 1: Wire `latestDiagnostic` into Frontend State

**File**: `frontend/src/superadmin/pages/SuperAdminControlPlaneFirmDetailPage.tsx`

**Location**: In `refreshData()`, where `detailData` is constructed

**Change**: Add `latestDiagnostic` to the object passed to `setData()`

**Before**:
```typescript
const detailData: SuperAdminTenantDetail = {
  tenant: {
    id: firmDetail.tenantSummary.id,
    name: firmDetail.tenantSummary.name,
    // ... other fields
  },
  // ... other properties
};
setData(detailData);
```

**After**:
```typescript
const detailData: SuperAdminTenantDetail = {
  tenant: {
    id: firmDetail.tenantSummary.id,
    name: firmDetail.tenantSummary.name,
    // ... other fields
  },
  latestDiagnostic: firmDetail.latestDiagnostic,  // ✅ Added
  // ... other properties
};
setData(detailData);
```

**Result**: `getCanonicalStatus(3)` now sees `diagExists = true` after `refreshData()`

---

### Task 2: Update TypeScript Types

**File**: `frontend/src/superadmin/types.ts`

**Change**: Add `latestDiagnostic` field to `SuperAdminTenantDetail` type

**Added**:
```typescript
export type SuperAdminTenantDetail = {
  tenant: {
    // ... existing fields
  };
  latestDiagnostic?: {
    id: string;
    status: 'generated' | 'locked' | 'published' | 'archived';
    createdAt: string;
    updatedAt: string;
  } | null;
  // ... other properties
};
```

---

### Task 3: Disable Generate Button and Guard Handler

**File**: `frontend/src/superadmin/pages/SuperAdminControlPlaneFirmDetailPage.tsx`

#### 3.1 Update Button Rendering

**Change**: Add `disabled` state to Generate button

**Before**:
```typescript
<button onClick={handleGenerateDiagnostic}>
  Generate Diagnostic
</button>
```

**After**:
```typescript
<button 
  onClick={handleGenerateDiagnostic}
  disabled={isGenerating}
  aria-disabled={isGenerating}
  style={{ 
    opacity: isGenerating ? 0.5 : 1, 
    cursor: isGenerating ? 'not-allowed' : 'pointer' 
  }}
>
  {isGenerating ? 'Generating...' : 'Generate Diagnostic'}
</button>
```

#### 3.2 Add Guard to Handler

**Change**: Add early return if already generating

**Before**:
```typescript
const handleGenerateDiagnostic = async () => {
  if (!params?.tenantId) return;
  setIsGenerating(true);
  try {
    // ... generation logic
  } finally {
    setIsGenerating(false);
  }
};
```

**After**:
```typescript
const handleGenerateDiagnostic = async () => {
  if (!params?.tenantId) return;
  if (isGenerating) return;  // ✅ Guard against double-click
  setIsGenerating(true);
  try {
    // ... generation logic
  } finally {
    setIsGenerating(false);
  }
};
```

#### 3.3 Apply to All Action Buttons

**Change**: Add `disabled={isGenerating}` to all spine action buttons:
- Lock Intake
- Lock Diagnostic
- Publish Diagnostic
- Ingest Discovery

This prevents concurrent state collisions.

---

### Task 4: Backend Idempotency (Optional Hardening)

**File**: `backend/src/controllers/superadmin.controller.ts`

**Location**: `generateDiagnostics` handler (around line 2908-2942)

**Problem**: Currently inserts `DIAGNOSTIC_GENERATED` audit event on every call, even if diagnostic already exists

**Solution**: Only insert audit event if a new diagnostic row was created

**Before**:
```typescript
let diagnosticId = existing?.id;

if (!diagnosticId) {
  const [newDiag] = await db.insert(diagnostics).values({...}).returning();
  diagnosticId = newDiag.id;
  
  await db.update(tenants)
    .set({ lastDiagnosticId: diagnosticId })
    .where(eq(tenants.id, tenantId));
}

// ❌ Always inserts audit event, even for existing diagnostic
await db.insert(auditEvents).values({
  eventType: 'DIAGNOSTIC_GENERATED',
  entityId: diagnosticId,
  // ...
});
```

**After**:
```typescript
let diagnosticId = existing?.id;
let isNewDiagnostic = false;

if (!diagnosticId) {
  const [newDiag] = await db.insert(diagnostics).values({...}).returning();
  diagnosticId = newDiag.id;
  isNewDiagnostic = true;
  
  await db.update(tenants)
    .set({ lastDiagnosticId: diagnosticId })
    .where(eq(tenants.id, tenantId));
}

// ✅ Only insert audit event for new diagnostics
if (isNewDiagnostic) {
  await db.insert(auditEvents).values({
    eventType: 'DIAGNOSTIC_GENERATED',
    entityId: diagnosticId,
    // ...
  });
}
```

---

## VERIFICATION STEPS

### Frontend

1. Load Firm Detail page for tenant `883a5307-6354-49ad-b8e3-765ff64dc1af`
2. Confirm API payload includes `latestDiagnostic` (already confirmed)
3. Click Generate once:
   - ✅ No console error
   - ✅ Diagnostic gate transitions to COMPLETE state after `refreshData()`
   - ✅ Generate button disappears; Lock appears (if TruthProbe says generated)
4. Click Generate rapidly multiple times:
   - ✅ Only one network request sent (or subsequent clicks ignored)
   - ✅ Button disabled while in-flight

### Backend (if optional hardening applied)

1. Trigger `generateDiagnostics` twice (simulate via curl/Postman)
2. Confirm `audit_events` has at most one `DIAGNOSTIC_GENERATED` for the same tenant + diagnosticId in the same "generated" state window

---

## ACCEPTANCE CRITERIA

- ✅ `latestDiagnostic` wired into frontend state
- ✅ TypeScript types updated
- ✅ Generate button disabled during request
- ✅ Handler guards against double-click
- ✅ All spine action buttons respect `isGenerating`
- ✅ (Optional) Backend prevents duplicate audit events

---

## NOTES / LANDMINES

- ⚠️ `tenantSummary.lastDiagnosticId` is a UUID in payload, while older rows show `diag_*` ids. Do NOT mix these; follow current schema truth.
- ⚠️ Do not introduce new `executionPhase` values unless required; this ticket is about `latestDiagnostic` wiring + click safety.

---

**Date Created**: 2026-01-20
**Date Resolved**: 2026-01-20
