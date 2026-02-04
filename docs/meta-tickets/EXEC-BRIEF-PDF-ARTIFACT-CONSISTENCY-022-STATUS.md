# EXEC-BRIEF-PDF-ARTIFACT-CONSISTENCY-022 - IMPLEMENTATION STATUS

## Shakey's PDF Path

**Latest PDF for Shakey's:**
```
/home/tonycamero/code/Strategic_AI_Roadmaps/backend/uploads/executive-briefs/26e5feb8-eeb1-403c-b9a9-c2125fa9cac2/d38e1bab-9e99-4728-b1e5-cbb9909418ce/Shakey_s_Restaurant_Executive_Brief_2026-01-30.pdf
```

**File Details:**
- Size: 5.7 KB
- Last Modified: Jan 30 00:50
- Filename shows: `2026-01-30` (brief creation date, not artifact creation date)

**Problem Confirmed:** PDF shows "Generated: 1/30/2026" because renderer uses `new Date()` at render time, not artifact timestamp.

---

## COMPLETED WORK

### ✅ 1. Canonical Selector Helper Created

**File:** `backend/src/services/pdf/executiveBriefArtifactSelector.ts`

**Features:**
- Single source of truth for artifact selection
- Deterministic ordering: `ORDER BY createdAt DESC, id DESC`
- Observability logging with `[PDF_SELECT]` prefix
- Future-ready for synthesisHash matching
- TypeScript interfaces for type safety

**Key Function:**
```typescript
export async function selectLatestPdfArtifact(
  params: ArtifactSelectorParams,
  logContext: string
): Promise<SelectedArtifact | null>
```

### ✅ 2. Renderer Updated to Accept Artifact Timestamp

**File:** `backend/src/services/pdf/executiveBriefRenderer.ts`

**Changes:**
- Added `artifactCreatedAt?: Date` parameter to `renderPrivateLeadershipBriefToPDF()`
- Updated "Generated:" line to use `artifactCreatedAt || new Date()`
- Added inline comment referencing ticket

**Before:**
```typescript
.text(new Date().toISOString().split('T')[0], valueX, startY + 40);
```

**After:**
```typescript
// EXEC-BRIEF-PDF-ARTIFACT-CONSISTENCY-022: Use artifact timestamp, not current time
.text((artifactCreatedAt || new Date()).toISOString().split('T')[0], valueX, startY + 40);
```

---

## REMAINING WORK

### 🔄 3. Update Call Sites to Use Canonical Selector

**Need to refactor 3 locations:**

#### Location 1: `executiveBrief.controller.ts` Line 102 (getExecutiveBrief - hasPdf check)
**Current:**
```typescript
const [artifact] = await db
    .select()
    .from(executiveBriefArtifacts)
    .where(and(
        eq(executiveBriefArtifacts.executiveBriefId, brief.id),
        eq(executiveBriefArtifacts.artifactType, 'PRIVATE_LEADERSHIP_PDF')
    ))
    .limit(1);
```

**Should be:**
```typescript
import { selectLatestPdfArtifact } from '../services/pdf/executiveBriefArtifactSelector';

const artifact = await selectLatestPdfArtifact({
    tenantId,
    briefId: brief.id
}, 'get_brief_hasPdf');
```

#### Location 2: `executiveBrief.controller.ts` Line 1027 (downloadExecutiveBrief)
**Current:**
```typescript
const [artifact] = await db
    .select()
    .from(executiveBriefArtifacts)
    .where(and(
        eq(executiveBriefArtifacts.tenantId, tenantId),
        eq(executiveBriefArtifacts.artifactType, 'PRIVATE_LEADERSHIP_PDF')
    ))
    .orderBy(desc(executiveBriefArtifacts.createdAt))
    .limit(1);
```

**Should be:**
```typescript
const artifact = await selectLatestPdfArtifact({
    tenantId
}, 'download');
```

#### Location 3: `executiveBriefDelivery.ts` Line 209 (generateAndDeliverPrivateBriefPDF)
**Current:**
```typescript
const [existingArtifact] = await db
    .select()
    .from(executiveBriefArtifacts)
    .where(
      and(
        eq(executiveBriefArtifacts.executiveBriefId, brief.id),
        eq(executiveBriefArtifacts.tenantId, tenant.id),
        eq(executiveBriefArtifacts.artifactType, 'PRIVATE_LEADERSHIP_PDF')
      )
    )
    .orderBy(desc(executiveBriefArtifacts.createdAt))
    .limit(1);
```

**Should be:**
```typescript
const existingArtifact = await selectLatestPdfArtifact({
    tenantId: tenant.id,
    briefId: brief.id
}, 'generate');
```

### 🔄 4. Pass Artifact Timestamp to Renderer

**Need to update renderer calls in:**

#### `executiveBriefDelivery.ts` Line 270
**Current:**
```typescript
pdfBuffer = await renderPrivateLeadershipBriefToPDF(brief, tenant.name, targetMode);
```

**Should be:**
```typescript
pdfBuffer = await renderPrivateLeadershipBriefToPDF(
    brief, 
    tenant.name, 
    targetMode,
    existingArtifact?.createdAt || new Date()  // Use artifact timestamp
);
```

#### `executiveBrief.controller.ts` (download endpoint - if it regenerates)
Need to check if download endpoint calls renderer and pass artifact timestamp.

### 🔄 5. Frontend Endpoint Verification

**Need to verify:**
- Frontend "Download PDF" button calls correct endpoint
- Check if it's using legacy route or correct artifact download route
- File: `frontend/src/superadmin/components/ExecutiveBriefModal.tsx` or similar

### 🔄 6. Add Tests

**Required tests:**
1. Unit test for `selectLatestPdfArtifact()` with multiple artifacts
2. Integration test verifying download + email select same artifact
3. Regression test for PDF "Generated:" date matching artifact.createdAt

---

## ACCEPTANCE CRITERIA

### ✅ Completed
- [x] Canonical selector helper created
- [x] Renderer accepts artifact timestamp parameter
- [x] Renderer uses artifact timestamp for "Generated:" field

### ⏳ In Progress
- [ ] All call sites use canonical selector
- [ ] Renderer calls pass artifact timestamp
- [ ] Frontend endpoint verified
- [ ] Tests added
- [ ] Observability logs verified

### 🎯 Success Metrics
After completion:
1. Download PDF and Email PDF are byte-identical (or have identical "Generated:" date)
2. PDF "Generated:" date matches latest artifact.createdAt, not brief.createdAt
3. Logs show same artifactId selected by download + email paths
4. After REGEN + Regenerate PDF, new PDF shows updated "Generated:" date

---

## NEXT STEPS

1. **Refactor call sites** to use `selectLatestPdfArtifact()`
2. **Pass artifact timestamp** to renderer in all code paths
3. **Verify frontend** download endpoint
4. **Add tests** for artifact selection and timestamp rendering
5. **Test end-to-end** with Shakey's tenant

---

## LINT ERRORS

All current lint errors are IDE-only (missing @types/node). They do not affect runtime execution and can be ignored or fixed later by installing type definitions.

---

## FILES CREATED/MODIFIED

**Created:**
- `backend/src/services/pdf/executiveBriefArtifactSelector.ts` (new canonical selector)

**Modified:**
- `backend/src/services/pdf/executiveBriefRenderer.ts` (added artifactCreatedAt parameter)

**Pending Modification:**
- `backend/src/controllers/executiveBrief.controller.ts` (3 call sites)
- `backend/src/services/executiveBriefDelivery.ts` (1 call site + renderer call)
