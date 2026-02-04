# EXEC-BRIEF-PDF-STALE-PERSIST-024D - FILE DELETION FIX

## Summary

Fixed file path conflict by deleting physical file along with DB row when removing stale artifacts.

---

## Problem

**Error:**
```
File already exists at path: .../Shakey_s_Restaurant_Executive_Brief_2026-02-04.pdf
```

**Root Cause:**
- TICKET-024C deleted DB row but NOT the physical file
- Both old and new PDFs had same date (2026-02-04) → same filename
- `persistPDFArtifact()` has fail-closed check that throws if file exists
- Result: 500 error

---

## Solution

Delete physical file BEFORE deleting DB row:

```typescript
// Delete physical file first
try {
  await fs.unlink(existingArtifact.filePath);
  console.log(`[PDF] Deleted stale file: ${existingArtifact.filePath}`);
} catch (error) {
  // File might not exist, that's okay
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
    console.warn(`[PDF] Failed to delete stale file: ${error}`);
  }
}

// Then delete DB row
await db
  .delete(executiveBriefArtifacts)
  .where(eq(executiveBriefArtifacts.id, existingArtifact.id));
```

---

## Expected Logs

```
[PDF_STALE] ... => regenerate=true
[PDF] Deleting stale artifact ca05... before persisting new one
[PDF] Deleted stale file: .../Shakey_s_Restaurant_Executive_Brief_2026-02-04.pdf
[PDF] Persisted artifact <new-id> for brief ...
[PDF] Persisted new artifact <new-id> (stale_replaced)
```

---

## Verification

1. Restart backend: `cd backend && pnpm dev`
2. Navigate to Shakey's
3. Click "REGENERATE" → "Regenerate PDF"
4. **Expected:** 200 success
5. **Expected logs:** File deletion message
6. Click "Download PDF"
7. **Expected:** PDF shows current date

---

**Ready for final verification!** 🎯
