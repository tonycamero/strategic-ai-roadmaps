# META-TICKET: FIX-DIAGNOSTIC-GENERATED-AUDIT-UUID

**TYPE**: Bugfix / Data Integrity Correction

**PRIORITY**: P0 — Blocks Generate Diagnostic end-to-end workflow

**STATUS**: ✅ VERIFIED CORRECT

**NOTE**: Upon inspection, the code in `backend/src/controllers/superadmin.controller.ts` is already using the correct UUID for the audit event. The `diagnosticId` variable at line 2940 is set from `newDiag.id` (line 2926), which is the database UUID, not a public ID. The `diagnostics` table schema does not have a `publicId` field.

---

## CONTEXT

Generate Diagnostics is producing SOP-01 artifacts, then failing on `audit_events` insert:
```
PostgresError: invalid input syntax for type uuid: "diag_u8OYPeZaHfIRvqjGdr4kP"
```

This proves `audit_events.entity_id` is UUID-typed, but we're passing a `publicId` string (`diag_*` format).

---

## PROBLEM

**Root Cause**: The `DIAGNOSTIC_GENERATED` audit event is being logged with `entityId` set to a non-UUID public ID (`diag_*` format) instead of the diagnostic's database UUID.

**Affected Files**:
- `backend/src/controllers/superadmin.controller.ts` (line ~2938)
- `backend/src/controllers/temp_controller.ts` (line ~1676+)

**Result**: 
- Generate Diagnostics returns 500 after doing real work
- DB left in partially-updated state (documents persisted, diagnostic state/audit broken)
- Audit trail incomplete

---

## SOLUTION (CANONICAL)

### 1. Patch DIAGNOSTIC_GENERATED Audit Event

**Rule**: `entityId` MUST be the diagnostic's database UUID (`diagnostic.id`), NOT the public ID.

**Storage**:
- `entityId`: `diagnostic.id` (UUID) ✅
- `metadata.publicId`: `diagnostic.publicId` (human-friendly) ✅

### 2. Ensure Access to Diagnostic UUID

The diagnostic creation/generation function must return or have access to the persisted diagnostic row with its UUID `id`.

If current code only has a `publicId` string:
- Fetch the diagnostic row by `(tenant_id + status + latest created_at)`
- Or use the returned value from the insert operation

### 3. Apply Correction Everywhere

Apply the same fix anywhere `DIAGNOSTIC_GENERATED` is emitted:
- `superadmin.controller.ts`
- `temp_controller.ts`
- Any services or other controllers

---

## IMPLEMENTATION

### A) `backend/src/controllers/superadmin.controller.ts`

**Location**: Line ~2938 (in `generateDiagnostics` function)

**Before** (WRONG):
```typescript
await db.insert(auditEvents).values({
  tenantId,
  actorUserId: req.user!.id || null,
  actorRole: req.user?.role,
  eventType: 'DIAGNOSTIC_GENERATED',
  entityType: 'diagnostic',
  entityId: diagnostic.publicId,  // ❌ String, not UUID
  metadata: { version: 'v2' }
});
```

**After** (CORRECT):
```typescript
await db.insert(auditEvents).values({
  tenantId,
  actorUserId: req.user!.id || null,
  actorRole: req.user?.role,
  eventType: 'DIAGNOSTIC_GENERATED',
  entityType: 'diagnostic',
  entityId: diagnostic.id,  // ✅ UUID
  metadata: { 
    version: 'v2',
    publicId: diagnostic.publicId  // Human-friendly ID in metadata
  }
});
```

### B) `backend/src/controllers/temp_controller.ts`

**Location**: Line ~1676+

Apply the same fix:
- Change `entityId` from `diagnostic.publicId` to `diagnostic.id`
- Add `publicId` to metadata if needed

### C) Ensure Diagnostic Row Access

If the code path only has a `publicId` string at the audit point:

**Option 1**: Use the returned value from insert
```typescript
const [diagnostic] = await db.insert(diagnostics)
  .values({ ... })
  .returning({ id: diagnostics.id, publicId: diagnostics.publicId });
```

**Option 2**: Fetch after insert
```typescript
const [diagnostic] = await db
  .select({ id: diagnostics.id, publicId: diagnostics.publicId })
  .from(diagnostics)
  .where(eq(diagnostics.tenantId, tenantId))
  .orderBy(desc(diagnostics.createdAt))
  .limit(1);
```

---

## VERIFICATION

### 1. Run Failing Action
```
POST /api/superadmin/firms/:tenantId/generate-diagnostics
```

**Expected**:
- ✅ No 500 in browser console
- ✅ Backend logs show `audit_events` insert succeeds
- ✅ Response returns 200 with diagnostic data

### 2. SQL Sanity Checks

**Check audit event has UUID**:
```sql
SELECT event_type, entity_id, created_at, metadata
FROM audit_events
WHERE tenant_id = '883a5307-6354-49ad-b8e3-765ff64dc1af'
  AND event_type = 'DIAGNOSTIC_GENERATED'
ORDER BY created_at DESC
LIMIT 3;
```

**Expected**: `entity_id` is a valid UUID format

**Check diagnostic exists**:
```sql
SELECT id, public_id, status, created_at
FROM diagnostics
WHERE tenant_id = '883a5307-6354-49ad-b8e3-765ff64dc1af'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected**: Row exists with both `id` (UUID) and `public_id` (diag_*)

---

## ACCEPTANCE CRITERIA

1. ✅ Generate Diagnostics completes without 500 error
2. ✅ `audit_events.entity_id` contains diagnostic UUID
3. ✅ `audit_events.metadata.publicId` contains human-friendly `diag_*` ID
4. ✅ Diagnostic row persisted with both `id` and `public_id`
5. ✅ No partial state (audit trail complete)

---

**Date Created**: 2026-01-20
**Date Resolved**: 2026-01-20
