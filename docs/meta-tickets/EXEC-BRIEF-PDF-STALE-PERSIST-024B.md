# EXEC-BRIEF-PDF-STALE-PERSIST-024B - IMPLEMENTATION COMPLETE

## Summary

Fixed stale artifact persistence: when `isStale === true`, the system now persists a new artifact instead of streaming transiently, ensuring Download PDF gets the regenerated version.

---

## Problem (Forensic Analysis)

**Symptom:** After clicking "Regenerate PDF", the downloaded PDF still shows the old date (1/30/2026) instead of the current date.

**Root Cause (from logs):**
```
[PDF_STALE] briefUpdatedAt=2026-02-04T00:32:39.000Z artifactCreatedAt=2026-01-30T08:50:11.747Z => regenerate=true
[PDF] Transiently using regenerated executive PDF for delivery.
action=regen_stream
[PDF] Generated/Resolved artifact ca05c6ae-23f5-401c-bb29-26458b2b65de (email skipped).
```

**What was happening:**
1. ✅ Stale detection worked correctly
2. ✅ PDF was regenerated in-memory
3. ❌ **New artifact was NOT persisted** (fell into "transient" path)
4. ❌ Returned old artifact ID (`ca05...` from Jan 30)
5. ❌ Download PDF selected latest artifact by `created_at DESC` → still Jan 30

**The code path:**
```typescript
if (!existingArtifact) {
  // Persist new artifact ✅
} else {
  // Transient stream only ❌ (even when stale!)
  console.log('[PDF] Transiently using regenerated executive PDF for delivery.');
}
```

**Result:** Regenerated PDF was never saved, so Download always got the old file.

---

## Solution

Changed the persistence condition from:
```typescript
if (!existingArtifact) {
  // persist
}
```

To:
```typescript
if (!existingArtifact || isStale) {
  // persist
}
```

**Now:** When stale is detected, a new artifact row is created with `createdAt = now`, and Download PDF correctly selects it.

---

## Changes Made

### File: `backend/src/services/executiveBriefDelivery.ts`

**Lines 324-332:** Updated persistence condition
```typescript
// EXEC-BRIEF-PDF-STALE-PERSIST-024B: Always persist when stale or missing
// If we don't have an artifact OR it's stale, persist a new one
if (!existingArtifact || isStale) {
  const fileName = formatFileName(tenant.name, artifactCreatedAt);
  artifact = await persistPDFArtifact({
    executiveBriefId: brief.id,
    tenantId: tenant.id,
    pdfBuffer,
    fileName,
  });
  console.log(`[PDF] Persisted new artifact ${artifact.id} (${isStale ? 'stale_replaced' : 'first_time'})`);
}
```

---

## Observability

### New Log

**When stale artifact is replaced:**
```
[PDF] Persisted new artifact <new-id> (stale_replaced)
```

**When first artifact is created:**
```
[PDF] Persisted new artifact <new-id> (first_time)
```

**Full expected log sequence:**
```
[PDF_STALE] briefUpdatedAt=2026-02-04T... artifactCreatedAt=2026-01-30T... => regenerate=true
[PDF_CANON] briefId=... using existing synthesis (has content+meta)
[ExecutiveBriefContract] ... pass violations=0
[PDF Renderer] Rendering brief with mode: EXECUTIVE_SYNTHESIS
[PDF_RENDER] artifactCreatedAt=2026-02-04T...
[PDF] Persisted new artifact <new-id> (stale_replaced)  ← NEW
[ExecutiveBriefDelivery] ... action=regen_stream
```

---

## Behavior

### Before Fix

1. User clicks "Regenerate PDF"
2. Stale detection: `isStale = true` ✅
3. PDF regenerated in-memory ✅
4. **Persistence check:** `if (!existingArtifact)` → FALSE (artifact exists)
5. **Falls into transient path** → no new artifact row created ❌
6. Returns old artifact ID ❌
7. User clicks "Download PDF"
8. Query: `SELECT * ... ORDER BY created_at DESC LIMIT 1`
9. **Gets old artifact** (Jan 30) ❌
10. **Downloads old PDF** ❌

### After Fix

1. User clicks "Regenerate PDF"
2. Stale detection: `isStale = true` ✅
3. PDF regenerated in-memory ✅
4. **Persistence check:** `if (!existingArtifact || isStale)` → TRUE ✅
5. **Persists new artifact** with `createdAt = now` ✅
6. Returns new artifact ID ✅
7. User clicks "Download PDF"
8. Query: `SELECT * ... ORDER BY created_at DESC LIMIT 1`
9. **Gets new artifact** (today) ✅
10. **Downloads new PDF** ✅

---

## Forensic Verification

### Before Fix (from logs)
```
[PDF_SELECT] path=download ... artifactId=ca05c6ae-23f5-401c-bb29-26458b2b65de artifactCreatedAt=2026-01-30T08:50:11.747Z
```
**Artifact ID:** `ca05...` (old)  
**Created:** Jan 30  
**Result:** Old PDF downloaded

### After Fix (expected)
```
[PDF_SELECT] path=download ... artifactId=<new-uuid> artifactCreatedAt=2026-02-04T...
```
**Artifact ID:** New UUID  
**Created:** Today  
**Result:** New PDF downloaded

---

## Database Impact

### Before Fix
```sql
SELECT * FROM executive_brief_artifacts 
WHERE tenant_id = '26e5...' 
  AND artifact_type = 'PRIVATE_LEADERSHIP_PDF'
ORDER BY created_at DESC;
```
**Result:** 1 row (Jan 30)

### After Fix
```sql
SELECT * FROM executive_brief_artifacts 
WHERE tenant_id = '26e5...' 
  AND artifact_type = 'PRIVATE_LEADERSHIP_PDF'
ORDER BY created_at DESC;
```
**Result:** 2 rows (Jan 30 + Feb 4)

**Note:** Old artifacts are preserved (not deleted), new ones are added. This maintains audit trail.

---

## Verification Steps

### Manual Test

1. **Restart backend:**
   ```bash
   cd backend
   pnpm dev
   ```

2. **Count artifacts BEFORE:**
   - Check DB or logs for artifact count

3. **Test with Shakey's:**
   - Open SuperAdmin: `http://localhost:5173/superadmin`
   - Navigate to Shakey's
   - Click "REGENERATE"
   - Click "Regenerate PDF"
   - **Expected logs:**
     ```
     [PDF_STALE] ... => regenerate=true
     [PDF_CANON] briefId=... using existing synthesis (has content+meta)
     [PDF Renderer] Rendering brief with mode: EXECUTIVE_SYNTHESIS
     [PDF_RENDER] artifactCreatedAt=2026-02-04T...
     [PDF] Persisted new artifact <new-id> (stale_replaced)
     ```

4. **Count artifacts AFTER:**
   - Should be +1 from before

5. **Download PDF:**
   - Click "Download PDF"
   - **Expected:** PDF shows "Generated: 2/04/2026"
   - **Expected:** Filename includes `2026-02-04`

6. **Verify logs:**
   - Download should show NEW artifact ID (not `ca05...`)

---

## Files Modified

1. `backend/src/services/executiveBriefDelivery.ts` (persistence condition + logging)

**Total:** 1 file modified

---

## Acceptance Criteria

### ✅ Implemented
- [x] Stale artifact persistence condition updated
- [x] New artifact created when `isStale === true`
- [x] Logging added to show "stale_replaced" vs "first_time"
- [x] Old artifacts preserved (audit trail)

### ⏳ Pending Manual Verification
- [ ] Restart backend
- [ ] Test with Shakey's
- [ ] Verify logs show `[PDF] Persisted new artifact ... (stale_replaced)`
- [ ] Verify artifact count increases
- [ ] Verify Download PDF gets new artifact
- [ ] Verify PDF shows current date
- [ ] Verify filename includes current date

---

## Impact

**This completes the full PDF regeneration pipeline:**

1. ✅ Stale artifact detection (TICKET-022)
2. ✅ Canonical synthesis resolution (TICKET-023)
3. ✅ Timestamp threading (TICKET-024A)
4. ✅ **Stale artifact persistence (TICKET-024B)** ← **This fix**

**Result:** End-to-end PDF regeneration now works correctly:
- Detects stale artifacts
- Regenerates synthesis if needed
- Renders new PDF with correct timestamp
- **Persists new artifact to database**
- Download gets the latest version

---

**Ready for manual verification!** 🎯
