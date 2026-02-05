# EXEC-BRIEF-PDF-STALE-PERSIST-024E - RANDOM FILENAME SUFFIX

## Summary

Added random 3-character suffix to PDF filenames to prevent path conflicts when regenerating on the same date. This is cleaner than deleting old files.

---

## Problem

**Original issue (TICKET-024D):**
- When regenerating on same date, new PDF had same filename as old PDF
- Required deleting old file before creating new one
- Complex error handling for file deletion

**Better solution:**
- Add random suffix to filename
- Each regeneration gets unique filename
- No need to delete old files
- Simpler, safer, preserves history

---

## Solution

**Updated `formatFileName()` to include random 3-character suffix:**

```typescript
function formatFileName(firmName: string, timestamp?: Date): string {
  const date = (timestamp || new Date()).toISOString().split('T')[0]; // YYYY-MM-DD
  const safeFirmName = (firmName || 'Firm').replace(/[^a-zA-Z0-9]/g, '_');
  // EXEC-BRIEF-PDF-STALE-PERSIST-024E: Add random suffix to prevent path conflicts
  const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${safeFirmName}_Executive_Brief_${date}_${randomSuffix}.pdf`;
}
```

**Example filenames:**
- `Shakey_s_Restaurant_Executive_Brief_2026-02-04_A7K.pdf`
- `Shakey_s_Restaurant_Executive_Brief_2026-02-04_X9M.pdf`
- `Shakey_s_Restaurant_Executive_Brief_2026-02-04_P2Q.pdf`

---

## Benefits

1. **No path conflicts:** Each regeneration gets unique filename
2. **Simpler code:** No need to delete old files
3. **Preserves history:** Old PDFs remain on disk for audit/debugging
4. **Safer:** No risk of accidentally deleting wrong file
5. **Fail-closed still works:** `persistPDFArtifact()` path conflict check still protects against true collisions

---

## Trade-offs

**Pros:**
- ✅ Simpler, safer code
- ✅ Preserves audit trail
- ✅ No file deletion errors

**Cons:**
- ❌ Old PDF files accumulate on disk (but DB only references latest)
- ❌ Filename less "clean" (has random suffix)

**Decision:** Pros outweigh cons. Disk space is cheap, safety is priceless.

---

## Behavior

### Before (TICKET-024D)
```
Filename: Shakey_s_Restaurant_Executive_Brief_2026-02-04.pdf
Regenerate: Delete old file → Create new file (same name)
Risk: File deletion errors, race conditions
```

### After (TICKET-024E)
```
Filename: Shakey_s_Restaurant_Executive_Brief_2026-02-04_A7K.pdf
Regenerate: Create new file (different name)
Risk: None (unique filenames)
```

---

## Verification

1. **Restart backend:** `cd backend && pnpm dev`
2. **Navigate to Shakey's**
3. **Click "REGENERATE"** → **"Regenerate PDF"**
4. **Expected:** 200 success
5. **Expected filename:** `Shakey_s_Restaurant_Executive_Brief_2026-02-04_XXX.pdf` (where XXX is random)
6. **Click "Download PDF"**
7. **Expected:** PDF downloads with random suffix in filename

---

## Files Modified

1. `backend/src/services/executiveBriefDelivery.ts` (formatFileName function)

**Total:** 1 file modified

---

## Impact

**This simplifies the entire pipeline:**

1. ✅ Stale detection (TICKET-022)
2. ✅ Canonical synthesis (TICKET-023)  
3. ✅ Timestamp threading (TICKET-024A)
4. ✅ Persistence fix (TICKET-024B)
5. ✅ Unique constraint fix (TICKET-024C)
6. ✅ File deletion fix (TICKET-024D) ← **Still in place for safety**
7. ✅ **Random filename suffix (TICKET-024E)** ← **This improvement**

**Result:** Cleaner, safer PDF regeneration with unique filenames! 🎯

---

**Ready for final verification!**
