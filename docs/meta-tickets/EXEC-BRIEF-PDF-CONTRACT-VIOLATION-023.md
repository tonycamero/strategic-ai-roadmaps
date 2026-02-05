# EXEC-BRIEF-PDF-CONTRACT-VIOLATION-023 - IMPLEMENTATION COMPLETE

## Summary

Fixed PDF regeneration 500 error by replacing legacy synthesis reconstruction with canonical synthesis resolution that regenerates synthesis when needed.

---

## Problem

**Before:** PDF regeneration failed with `CONTRACT_VIOLATION` because the code was reconstructing a legacy synthesis object missing required `content` and `meta` fields.

**Root Cause (TypeScript Lint):**
```
Type '{ executiveAssertionBlock: any[]; strategicSignalSummary: any; topRisks: any[]; leverageMoves: any[]; operatingContextNotes: any; }' is missing the following properties: content, meta
```

---

## Solution

Implemented canonical synthesis resolution in `generateAndDeliverPrivateBriefPDF()`:

1. **Check if synthesis is valid** (has `content` + `meta`)
2. **If invalid/missing:** Regenerate using `executeSynthesisPipeline()`
3. **Persist** regenerated synthesis to brief record
4. **Update** brief object for renderer
5. **Validate** canonical synthesis before rendering
6. **Render** PDF with canonical synthesis

---

## Changes Made

### File: `backend/src/services/executiveBriefDelivery.ts`

**Line 7:** Added imports
```typescript
import { executiveBriefArtifacts, users, intakeVectors, executiveBriefs } from '../db/schema';
```

**Lines 236-283:** Replaced legacy reconstruction with canonical resolution
```typescript
// EXEC-BRIEF-PDF-CONTRACT-VIOLATION-023: Resolve canonical synthesis
const { validateExecutiveBriefSynthesisOrThrow, logContractValidation } = await import('./executiveBriefValidation.service');
const { SynthesisError, executeSynthesisPipeline } = await import('./executiveBriefSynthesis.service');

let canonicalSynthesis: any = brief.synthesis;
let synthesisSource = 'existing';

// Check if synthesis has required fields (content + meta)
const hasRequiredFields = canonicalSynthesis?.content && canonicalSynthesis?.meta;

if (!hasRequiredFields) {
  console.log(`[PDF_CANON] briefId=${brief.id} synthesis missing required fields, regenerating...`);
  synthesisSource = 'regen_pipeline';

  // Fetch intake vectors for this tenant to regenerate synthesis
  const vectors = await db
    .select()
    .from(intakeVectors)
    .where(eq(intakeVectors.tenantId, tenant.id));

  if (vectors.length === 0) {
    throw new Error(`[PDF_CANON] No intake vectors found for tenant ${tenant.id}, cannot regenerate synthesis`);
  }

  // Regenerate synthesis using the same pipeline as normal generation
  canonicalSynthesis = await executeSynthesisPipeline(vectors as any, {
    tenantId: tenant.id,
    briefId: brief.id,
    action: 'pdf_regen'
  });

  // Persist regenerated synthesis back to brief
  await db
    .update(executiveBriefs)
    .set({
      synthesis: canonicalSynthesis as any,
      updatedAt: new Date()
    })
    .where(eq(executiveBriefs.id, brief.id));

  // Update brief object for renderer
  brief.synthesis = canonicalSynthesis;

  console.log(`[PDF_CANON] briefId=${brief.id} synthesis regenerated and persisted`);
} else {
  console.log(`[PDF_CANON] briefId=${brief.id} using existing synthesis (has content+meta)`);
}

// Validate canonical synthesis
validateExecutiveBriefSynthesisOrThrow(canonicalSynthesis, {
  tenantId: tenant.id,
  briefId: brief.id,
  briefMode: brief.briefMode,
  targetMode
});
```

### File: `backend/src/services/executiveBriefValidation.service.ts`

**Line 227:** Added context parameter
```typescript
export function validateExecutiveBriefSynthesisOrThrow(
    synthesis: ExecutiveBriefSynthesis,
    context?: { tenantId?: string; briefId?: string; briefMode?: string; targetMode?: string }
): void
```

**Lines 389-401:** Added violation logging
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

---

## Observability

### Logs Added

**When synthesis is missing required fields:**
```
[PDF_CANON] briefId=... synthesis missing required fields, regenerating...
[PDF_CANON] briefId=... synthesis regenerated and persisted
```

**When synthesis is valid:**
```
[PDF_CANON] briefId=... using existing synthesis (has content+meta)
```

**If contract violations occur:**
```
[ExecutiveBriefContract][VIOLATIONS] {
  "tenantId": "...",
  "briefId": "...",
  "mode": "EXECUTIVE_SYNTHESIS",
  "targetMode": "EXECUTIVE_SYNTHESIS",
  "violations": [...]
}
```

---

## Behavior

### Before Fix

1. User clicks "Regenerate PDF"
2. Code reconstructs legacy synthesis (missing `content`/`meta`)
3. Validation fails with `CONTRACT_VIOLATION`
4. **500 error**

### After Fix

1. User clicks "Regenerate PDF"
2. Code checks if `brief.synthesis` has `content` + `meta`
3. **If missing:** Regenerates synthesis via `executeSynthesisPipeline()`
4. Persists canonical synthesis to brief
5. Validates canonical synthesis ✅
6. Renders PDF ✅
7. **200 success**

---

## Verification Steps

### Manual Test

1. **Restart backend:**
   ```bash
   cd backend
   pnpm dev
   ```

2. **Test with Shakey's:**
   - Open SuperAdmin: `http://localhost:5173/superadmin`
   - Navigate to Shakey's
   - Click "REGENERATE"
   - Click "Regenerate PDF"
   - **Expected:** 200 success (not 500)
   - **Expected logs:**
     ```
     [PDF_STALE] ... => regenerate=true
     [PDF_CANON] briefId=... synthesis missing required fields, regenerating...
     [PDF_CANON] briefId=... synthesis regenerated and persisted
     ```
   - Click "Download PDF"
   - **Expected:** PDF downloads with current date

### Expected Outcome

- ✅ No `CONTRACT_VIOLATION` errors
- ✅ PDF regenerates successfully
- ✅ New artifact created with `createdAt` = today
- ✅ Downloaded PDF shows "Generated: 2/03/2026"

---

## Files Modified

1. `backend/src/services/executiveBriefDelivery.ts` (canonical synthesis resolution)
2. `backend/src/services/executiveBriefValidation.service.ts` (violation logging)

**Total:** 2 files modified

---

## Acceptance Criteria

### ✅ Implemented
- [x] Canonical synthesis resolution added
- [x] Regenerates synthesis if missing `content`/`meta`
- [x] Persists regenerated synthesis to brief
- [x] Validates canonical synthesis before rendering
- [x] Violation logging added for debugging
- [x] Stale artifact detection works (from previous ticket)

### ⏳ Pending Manual Verification
- [ ] Restart backend
- [ ] Test with Shakey's
- [ ] Verify 200 success (not 500)
- [ ] Verify logs show `[PDF_CANON]` messages
- [ ] Verify no `[ExecutiveBriefContract][VIOLATIONS]`
- [ ] Verify PDF downloads successfully
- [ ] Verify "Generated:" shows current date

---

## Next Steps

**User must:**
1. Restart backend
2. Test with Shakey's following verification steps above
3. Confirm PDF regeneration succeeds
4. Confirm logs show canonical synthesis resolution
5. Confirm no contract violations

---

**Ready for manual verification!** 🎯
