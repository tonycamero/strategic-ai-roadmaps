# EXEC-BRIEF-PDF-ARTIFACT-CONSISTENCY-022 - IMPLEMENTATION COMPLETE

## Summary

**Fixed the PDF timestamp inconsistency bug where "Generated:" showed old dates even after regeneration.**

### Root Cause (Confirmed)

**H2 from hypothesis was correct:** Renderer used `new Date()` at render time, baking timestamps into PDF files. Old PDFs retained old timestamps forever, even when correctly selected as "latest artifact."

---

## Changes Implemented

### 1. ✅ Canonical Artifact Selector Created

**File:** `backend/src/services/pdf/executiveBriefArtifactSelector.ts`

- Single source of truth for all artifact selection
- Deterministic ordering: `ORDER BY createdAt DESC, id DESC`
- Observability logging: `[PDF_SELECT] path=... artifactId=... artifactCreatedAt=...`
- Future-ready for synthesisHash matching

### 2. ✅ All Call Sites Refactored

**Updated 3 locations to use canonical selector:**

#### `executiveBrief.controller.ts` - Line 99 (getExecutiveBrief)
```typescript
const { selectLatestPdfArtifact } = await import('../services/pdf/executiveBriefArtifactSelector');
const artifact = await selectLatestPdfArtifact({
    tenantId,
    briefId: brief.id
}, 'get_brief_hasPdf');
```

#### `executiveBrief.controller.ts` - Line 1021 (downloadExecutiveBrief)
```typescript
const { selectLatestPdfArtifact } = await import('../services/pdf/executiveBriefArtifactSelector');
const artifact = await selectLatestPdfArtifact({
    tenantId
}, 'download');
```

#### `executiveBriefDelivery.ts` - Line 206 (generateAndDeliverPrivateBriefPDF)
```typescript
const { selectLatestPdfArtifact } = await import('./pdf/executiveBriefArtifactSelector');
const existingArtifact = await selectLatestPdfArtifact({
    tenantId: tenant.id,
    briefId: brief.id
}, 'generate');
```

### 3. ✅ Renderer Updated to Accept Artifact Timestamp

**File:** `backend/src/services/pdf/executiveBriefRenderer.ts`

**Signature:**
```typescript
export async function renderPrivateLeadershipBriefToPDF(
  brief: any,
  tenantName: string,
  briefMode: "DIAGNOSTIC_RAW" | "EXECUTIVE_SYNTHESIS" = "EXECUTIVE_SYNTHESIS",
  artifactCreatedAt?: Date  // NEW: Timestamp for "Generated:" field
): Promise<Buffer>
```

**"Generated:" field (Line 102):**
```typescript
.text((artifactCreatedAt || new Date()).toISOString().split('T')[0], valueX, startY + 40);
```

### 4. ✅ Timestamp Plumbing Fixed

**File:** `backend/src/services/executiveBriefDelivery.ts`

**Critical fix - Define timestamp for NEW artifact (not old one):**

```typescript
// EXEC-BRIEF-PDF-ARTIFACT-CONSISTENCY-022: Define timestamp for NEW artifact
const artifactCreatedAt = new Date();

// Render PDF with the timestamp it will be persisted with
pdfBuffer = await renderPrivateLeadershipBriefToPDF(brief, tenant.name, targetMode, artifactCreatedAt);

// Persist with same timestamp
const fileName = formatFileName(tenant.name, artifactCreatedAt);
artifact = await persistPDFArtifact({
  executiveBriefId: brief.id,
  tenantId: tenant.id,
  pdfBuffer,
  fileName,
});
```

### 5. ✅ Filename Function Updated

**File:** `backend/src/services/executiveBriefDelivery.ts` - Line 84

```typescript
function formatFileName(firmName: string, timestamp?: Date): string {
  const date = (timestamp || new Date()).toISOString().split('T')[0]; // YYYY-MM-DD
  const safeFirmName = (firmName || 'Firm').replace(/[^a-zA-Z0-9]/g, '_');
  return `${safeFirmName}_Executive_Brief_${date}.pdf`;
}
```

---

## Frontend Endpoints (Verified Correct)

**"Generate PDF" Button:**
```
POST /api/superadmin/firms/${tenantId}/executive-brief/generate-pdf
```
- Calls: `generateExecutiveBriefPDF()` → `generateAndDeliverPrivateBriefPDF()`
- ✅ Now uses canonical selector
- ✅ Now passes `artifactCreatedAt` to renderer

**"Download PDF" Button:**
```
GET /api/superadmin/firms/${tenantId}/executive-brief/download
```
- Calls: `downloadExecutiveBrief()`
- ✅ Now uses canonical selector
- ✅ Streams latest artifact file

---

## Observability Added

**Console logs now show:**

```
[PDF_SELECT] path=generate tenantId=... briefId=... artifactId=... artifactCreatedAt=2026-02-03T21:48:20.000Z synthesisHashMatch=N/A
[PDF_SELECT] path=download tenantId=... artifactId=... artifactCreatedAt=2026-02-03T21:48:20.000Z
[PDF_SELECT] path=get_brief_hasPdf tenantId=... briefId=... artifactId=... artifactCreatedAt=2026-02-03T21:48:20.000Z
```

---

## Critical Understanding

### Why Old PDFs Show Old Dates

**Old PDFs (generated before fix):**
- Rendered with `new Date()` at generation time (e.g., Jan 30)
- Timestamp **baked into PDF file bytes**
- File stored on disk with old timestamp inside
- Even when correctly selected as "latest artifact," the file content is unchanged
- **Will forever show "Generated: 1/30/2026"**

**New PDFs (generated after fix):**
- Rendered with `artifactCreatedAt` parameter
- Timestamp matches artifact creation time
- Filename date matches "Generated:" date
- **Will show correct date (e.g., "Generated: 2/03/2026")**

### To See the Fix Work

**MUST regenerate PDF at least once after deploying this fix:**

1. Restart backend
2. Navigate to Shakey's (or any tenant)
3. Click "REGENERATE" (regenerates synthesis)
4. Click "Regenerate PDF" (creates NEW PDF with NEW timestamp)
5. Download PDF
6. **Verify:** PDF shows "Generated: 2/03/2026" (today's date)
7. **Verify:** Filename shows `Shakey_s_Restaurant_Executive_Brief_2026-02-03.pdf`

---

## Acceptance Criteria

### ✅ Completed
- [x] Canonical selector helper created
- [x] All 3 call sites refactored to use selector
- [x] Renderer accepts `artifactCreatedAt` parameter
- [x] Renderer uses `artifactCreatedAt` for "Generated:" field
- [x] Generation path defines `artifactCreatedAt = new Date()` for NEW artifact
- [x] Generation path passes `artifactCreatedAt` to renderer
- [x] Filename uses `artifactCreatedAt`
- [x] Observability logging added

### ⏳ Pending (Manual Verification)
- [ ] Restart backend
- [ ] Regenerate PDF for Shakey's
- [ ] Verify "Generated:" shows today's date (Feb 3, 2026)
- [ ] Verify filename shows today's date
- [ ] Verify logs show same artifactId for download + generate

### 🎯 Success Metrics (After Regeneration)
1. **PDF "Generated:" date** = Artifact `createdAt` = Today's date
2. **Filename date** = "Generated:" date
3. **Download + Email** select same artifact (same ID in logs)
4. **Old PDFs** retain old dates (expected behavior - files are immutable)

---

## Files Created/Modified

**Created:**
- `backend/src/services/pdf/executiveBriefArtifactSelector.ts` (canonical selector)

**Modified:**
- `backend/src/controllers/executiveBrief.controller.ts` (2 call sites refactored)
- `backend/src/services/executiveBriefDelivery.ts` (1 call site + timestamp plumbing)
- `backend/src/services/pdf/executiveBriefRenderer.ts` (signature + timestamp usage)

**Total:** 4 files modified, 1 file created

---

## Lint Errors

All lint errors are IDE-only (missing `@types/node`). They do not affect runtime execution.

---

## Next Steps

1. **Restart backend** to load new code
2. **Test with Shakey's:**
   - Regenerate synthesis
   - Regenerate PDF
   - Download PDF
   - Verify "Generated: 2/03/2026"
3. **Verify logs** show consistent artifact selection
4. **Document** in ticket that old PDFs will retain old dates (expected)

---

## Shakey's Current PDF Path

```
/home/tonycamero/code/Strategic_AI_Roadmaps/backend/uploads/executive-briefs/26e5feb8-eeb1-403c-b9a9-c2125fa9cac2/d38e1bab-9e99-4728-b1e5-cbb9909418ce/Shakey_s_Restaurant_Executive_Brief_2026-01-30.pdf
```

**This file will always show "Generated: 1/30/2026"** because it was rendered on that date with the old code. After regenerating PDF, a NEW file will be created with today's date.
