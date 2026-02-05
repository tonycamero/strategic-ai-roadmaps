# EXEC-BRIEF-PDF-500-CONTRACT-023 - STEP 1 COMPLETE

## Status: Violation Logging Implemented ✅

### Changes Made

**File:** `backend/src/services/executiveBriefValidation.service.ts`

1. **Line 227:** Added optional `context` parameter to `validateExecutiveBriefSynthesisOrThrow()`
   ```typescript
   export function validateExecutiveBriefSynthesisOrThrow(
       synthesis: ExecutiveBriefSynthesis,
       context?: { tenantId?: string; briefId?: string; briefMode?: string; targetMode?: string }
   ): void
   ```

2. **Lines 389-401:** Added structured violation logging before throw
   ```typescript
   console.error(
       "[ExecutiveBriefContract][VIOLATIONS]",
       JSON.stringify({
           tenantId: context?.tenantId,
           briefId: context?.briefId,
           mode: context?.briefMode,
           targetMode: context?.targetMode,
           violations
       }, null, 2)
   );
   ```

**File:** `backend/src/services/executiveBriefDelivery.ts`

**Lines 251-256:** Updated validation call to pass context
```typescript
validateExecutiveBriefSynthesisOrThrow(synthesis, {
  tenantId: tenant.id,
  briefId: brief.id,
  briefMode: brief.briefMode,
  targetMode
});
```

---

## Root Cause Identified (TypeScript Lint)

**Error:**
```
Argument of type '{ executiveAssertionBlock: any[]; strategicSignalSummary: any; topRisks: any[]; leverageMoves: any[]; operatingContextNotes: any; }' is not assignable to parameter of type 'ExecutiveBriefSynthesis'.
Type is missing the following properties: content, meta
```

**Location:** `executiveBriefDelivery.ts` Line 251

**Diagnosis:**
The synthesis object being validated (lines 241-248) is in **legacy format**:
```typescript
const synthesis = {
  executiveAssertionBlock: [],
  strategicSignalSummary: brief.synthesis?.executiveSummary || brief.synthesis?.operatingReality || '',
  topRisks: [],
  leverageMoves: [],
  operatingContextNotes: brief.synthesis?.operatingReality || ''
};
```

But `ExecutiveBriefSynthesis` type expects:
```typescript
{
  content: { ... },
  meta: { ... },
  executiveAssertionBlock: [...],
  ...
}
```

**This is a best-effort reconstruction comment in the code itself (line 240):**
> "Note: This is a best-effort reconstruction since we store in legacy format"

---

## Next Steps

### Step 2: Capture Actual Violations

**User must:**
1. Restart backend: `cd backend && pnpm dev`
2. Navigate to Shakey's in SuperAdmin
3. Click "REGENERATE"
4. Click "Regenerate PDF"
5. **Capture the `[ExecutiveBriefContract][VIOLATIONS]` JSON from backend logs**

**Expected violations (based on TypeScript error):**
- `content` field missing
- `meta` field missing

### Step 3: Fix Root Cause

**Most likely fix (FIX PATH C - Legacy brief adapter):**

The PDF generation path is trying to validate a **reconstructed legacy synthesis** that doesn't match the current contract.

**Solution:**
Either:
A) **Skip validation for legacy briefs** (if brief is stored in legacy format, don't validate during PDF generation)
B) **Properly reconstruct the synthesis** to match the current contract (add `content` and `meta` fields)
C) **Use the actual stored synthesis** instead of reconstructing it

**Recommendation:** Use the actual `brief.synthesis` object if it exists, instead of reconstructing it.

---

## Files Modified

1. `backend/src/services/executiveBriefValidation.service.ts` (logging added)
2. `backend/src/services/executiveBriefDelivery.ts` (context passed)

---

## Commands

### Restart Backend
```bash
cd backend
pnpm dev
```

### Test Flow
1. Open SuperAdmin: `http://localhost:5173/superadmin`
2. Navigate to Shakey's
3. Click "REGENERATE"
4. Click "Regenerate PDF"
5. Check backend logs for `[ExecutiveBriefContract][VIOLATIONS]`

---

## Awaiting User Input

**Please capture and paste the `[ExecutiveBriefContract][VIOLATIONS]` JSON output from the backend logs.**

This will confirm the exact violations and guide the fix in Step 3.
