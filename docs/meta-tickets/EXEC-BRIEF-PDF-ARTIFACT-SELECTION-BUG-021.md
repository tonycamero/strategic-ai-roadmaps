# EXEC-BRIEF PDF ARTIFACT SELECTION BUG - FORENSIC REPORT

## EXECUTIVE SUMMARY

**Bug:** Some tenants download backdated/divergent PDFs after regeneration.

**Root Cause:** `generateAndDeliverPrivateBriefPDF()` service function selects artifacts with `.limit(1)` **without** `.orderBy()`, returning an arbitrary (likely oldest) artifact when multiple exist.

**Impact:** After regenerating PDF, users download the OLD PDF instead of the newly generated one.

**Fix:** Add `.orderBy(desc(executiveBriefArtifacts.createdAt))` to artifact selection query in generation service.

---

## PHASE 0: STATIC AUTOPSY

### Endpoints Involved

| Endpoint | Method | Controller Function | File |
|----------|--------|---------------------|------|
| `/firms/:tenantId/executive-brief/generate-pdf` | POST | `generateExecutiveBriefPDF` | `backend/src/controllers/executiveBrief.controller.ts:973` |
| `/firms/:tenantId/executive-brief/download` | GET | `downloadExecutiveBrief` | `backend/src/controllers/executiveBrief.controller.ts:1016` |
| `/firms/:tenantId/executive-brief` | GET | `getExecutiveBrief` | `backend/src/controllers/executiveBrief.controller.ts:66` |

### Service Functions

| Function | File | Purpose |
|----------|------|---------|
| `generateAndDeliverPrivateBriefPDF` | `backend/src/services/executiveBriefDelivery.ts:195` | Renders PDF, persists artifact, optionally emails |
| `renderPrivateLeadershipBriefToPDF` | `backend/src/services/pdf/executiveBriefRenderer.ts` | PDF renderer entrypoint |

### DB Tables

#### `executive_brief_artifacts`
**File:** `backend/src/db/schema.ts:213-235`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid | Primary key |
| `executiveBriefId` | uuid | FK to executive_briefs |
| `tenantId` | uuid | FK to tenants |
| `artifactType` | varchar(50) | `'PRIVATE_LEADERSHIP_PDF'` |
| `fileName` | text | Display name |
| `filePath` | text | Local/S3 path |
| `fileSize` | integer | Bytes |
| `checksum` | text | SHA-256 hash |
| `isImmutable` | boolean | Always true |
| `metadata` | jsonb | Delivery tracking |
| `generatedAt` | timestamp | Generation time |
| `createdAt` | timestamp | DB insert time |

---

## CALL GRAPH: Generate PDF → Download PDF

```
USER clicks "Generate PDF"
  ↓
POST /firms/:tenantId/executive-brief/generate-pdf
  ↓
generateExecutiveBriefPDF() [controller]
  ↓
generateAndDeliverPrivateBriefPDF(brief, tenant, shouldEmail=false) [service]
  ↓
  ├─ SELECT artifact WHERE briefId + tenantId + type LIMIT 1  ← BUG: NO orderBy!
  ├─ IF no artifact OR mode mismatch:
  │    ├─ renderPrivateLeadershipBriefToPDF() → pdfBuffer
  │    └─ persistPDFArtifact() → INSERT new artifact row
  └─ ELSE: use existing artifact

USER clicks "Download PDF"
  ↓
GET /firms/:tenantId/executive-brief/download
  ↓
downloadExecutiveBrief() [controller]
  ↓
SELECT artifact WHERE tenantId + type 
  ORDER BY createdAt DESC LIMIT 1  ← CORRECT! Returns latest
  ↓
Stream PDF file from artifact.filePath
```

---

## ROOT CAUSE ANALYSIS

### Bug Location

**File:** `backend/src/services/executiveBriefDelivery.ts`  
**Lines:** 207-217

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
    .limit(1);  // ← BUG: No .orderBy()!
```

### Why This Causes Divergent Downloads

**Scenario:**
1. User generates PDF → Artifact A created (`createdAt: 2026-01-01`)
2. User regenerates PDF → Artifact B created (`createdAt: 2026-02-03`)
3. User clicks "Generate PDF" again:
   - Service queries: `SELECT * FROM artifacts WHERE ... LIMIT 1`
   - **Without `ORDER BY`, Postgres returns arbitrary row (often first inserted)**
   - Returns Artifact A (old)
   - Checks: "Artifact exists, skip generation"
   - **No new artifact created!**
4. User clicks "Download PDF":
   - Controller queries: `SELECT * FROM artifacts WHERE ... ORDER BY createdAt DESC LIMIT 1`
   - Returns Artifact B (latest)
   - **Downloads latest PDF ✓**

**BUT if user regenerates again:**
1. Service still finds Artifact A (arbitrary)
2. Skips generation
3. Download still gets Artifact B
4. **User sees old PDF!**

### Why Download Works Correctly

**File:** `backend/src/controllers/executiveBrief.controller.ts`  
**Lines:** 1029-1033

```typescript
const [artifact] = await db
    .select()
    .from(executiveBriefArtifacts)
    .where(and(
        eq(executiveBriefArtifacts.tenantId, tenantId),
        eq(executiveBriefArtifacts.artifactType, 'PRIVATE_LEADERSHIP_PDF')
    ))
    .orderBy(desc(executiveBriefArtifacts.createdAt))  // ← CORRECT!
    .limit(1);
```

**Download endpoint correctly orders by `createdAt DESC`**, so it always returns the latest artifact.

### Why Some Tenants Affected More

**Hypothesis:** Tenants with multiple regenerations accumulate multiple artifact rows. The service's arbitrary selection becomes increasingly unpredictable.

**Northshore (works):** Likely has only 1 artifact row, so `.limit(1)` always returns the same (only) row.

**Prairie/Shakey's/Cascade (fail):** Likely have 2+ artifact rows from multiple regenerations, so `.limit(1)` returns arbitrary (often oldest) row.

---

## ROOT CAUSE CLASSIFICATION

**Answer: B) Generate creates new artifact rows, but generation service selects "first" match**

- Generate PDF service checks for existing artifact with `.limit(1)` (no order)
- Returns arbitrary artifact (often oldest due to Postgres default ordering)
- If artifact exists, skips generation
- Download endpoint correctly selects latest with `ORDER BY createdAt DESC`
- **Result:** Generation skipped, download gets latest, but "latest" is stale

---

## MINIMAL FIX

### Option 1: Add ORDER BY to Generation Service (Recommended)

**File:** `backend/src/services/executiveBriefDelivery.ts`  
**Line:** 217 (after `.where()`)

**Add:**
```typescript
.orderBy(desc(executiveBriefArtifacts.createdAt))
```

**Full Fixed Query:**
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
    .orderBy(desc(executiveBriefArtifacts.createdAt))  // ← FIX
    .limit(1);
```

**Rationale:**
- Ensures service always checks latest artifact
- If latest artifact matches current mode, reuses it
- If mode mismatch, regenerates correctly
- Minimal change, no schema modification

### Option 2: Delete Old Artifacts on Regenerate (More Aggressive)

**Add after line 280 (after `persistPDFArtifact()`):**
```typescript
// Delete old artifacts to prevent accumulation
await db
    .delete(executiveBriefArtifacts)
    .where(and(
        eq(executiveBriefArtifacts.executiveBriefId, brief.id),
        eq(executiveBriefArtifacts.tenantId, tenant.id),
        eq(executiveBriefArtifacts.artifactType, 'PRIVATE_LEADERSHIP_PDF'),
        ne(executiveBriefArtifacts.id, artifact.id)  // Keep only the new one
    ));
```

**Rationale:**
- Prevents artifact accumulation
- Ensures only 1 artifact exists per brief
- More aggressive cleanup
- Requires import of `ne` from drizzle-orm

**Recommendation:** **Option 1** (add ORDER BY) - simpler, safer, preserves audit trail.

---

## IMPORT REQUIRED

Ensure `desc` is imported at top of file:

**File:** `backend/src/services/executiveBriefDelivery.ts`  
**Line:** 5

**Current:**
```typescript
import { eq, and } from 'drizzle-orm';
```

**Fixed:**
```typescript
import { eq, and, desc } from 'drizzle-orm';
```

---

## LOGGING ENHANCEMENT

Add logging to prove which artifact is selected:

**After line 217, add:**
```typescript
if (existingArtifact) {
    console.log(`[PDF] Found existing artifact: id=${existingArtifact.id} createdAt=${existingArtifact.createdAt} mode=${persistedMode}`);
} else {
    console.log(`[PDF] No existing artifact found for brief ${brief.id}`);
}
```

---

## VERIFICATION PROCEDURE

### Before Fix (Reproduce Bug)

1. Navigate to SuperAdmin → Firm Detail (Prairie Peak or Shakey's)
2. Generate Executive Brief
3. Generate PDF (Artifact A created)
4. Click "Download PDF" → Note timestamp in filename
5. Click "REGENERATE" (synthesis regenerated)
6. Click "Generate PDF" again (should create Artifact B)
7. Click "Download PDF" → **BUG: Downloads Artifact A (old timestamp)**

### After Fix (Verify)

1. Apply patch (add `.orderBy(desc(...))`)
2. Restart backend
3. Navigate to SuperAdmin → Firm Detail (Prairie Peak)
4. Generate Executive Brief
5. Generate PDF (Artifact A created)
6. Download PDF → Note timestamp T1
7. REGENERATE synthesis
8. Generate PDF (Artifact B created)
9. Download PDF → **FIX: Downloads Artifact B (new timestamp T2 > T1)** ✅

### SQL Verification

```sql
-- Check artifact count per tenant
SELECT 
    tenantId,
    COUNT(*) as artifact_count,
    MIN(createdAt) as oldest,
    MAX(createdAt) as newest
FROM executive_brief_artifacts
WHERE artifactType = 'PRIVATE_LEADERSHIP_PDF'
GROUP BY tenantId
ORDER BY artifact_count DESC;

-- Check specific tenant artifacts
SELECT 
    id,
    executiveBriefId,
    fileName,
    createdAt,
    metadata->>'deliveryStatus' as status
FROM executive_brief_artifacts
WHERE tenantId = '<tenant-id>'
  AND artifactType = 'PRIVATE_LEADERSHIP_PDF'
ORDER BY createdAt DESC;
```

---

## FILES MODIFIED SUMMARY

**Modified:**
- `backend/src/services/executiveBriefDelivery.ts`:
  - Line 5: Add `desc` to imports
  - Line 217: Add `.orderBy(desc(executiveBriefArtifacts.createdAt))`
  - Line 218: Add logging for selected artifact

**Total Changes:** 3 lines modified

---

## REPRO SCRIPT

```bash
# 1. Generate initial PDF
curl -X POST http://localhost:3001/api/superadmin/firms/<TENANT_ID>/executive-brief/generate-pdf \
  -H "Authorization: Bearer <TOKEN>"

# 2. Download and note timestamp
curl -X GET http://localhost:3001/api/superadmin/firms/<TENANT_ID>/executive-brief/download \
  -H "Authorization: Bearer <TOKEN>" \
  --output brief_v1.pdf

# 3. Regenerate synthesis
curl -X POST http://localhost:3001/api/superadmin/firms/<TENANT_ID>/executive-brief/generate?force=true \
  -H "Authorization: Bearer <TOKEN>"

# 4. Generate PDF again
curl -X POST http://localhost:3001/api/superadmin/firms/<TENANT_ID>/executive-brief/generate-pdf \
  -H "Authorization: Bearer <TOKEN>"

# 5. Download again
curl -X GET http://localhost:3001/api/superadmin/firms/<TENANT_ID>/executive-brief/download \
  -H "Authorization: Bearer <TOKEN>" \
  --output brief_v2.pdf

# 6. Compare checksums
sha256sum brief_v1.pdf brief_v2.pdf

# BEFORE FIX: Checksums match (same file)
# AFTER FIX: Checksums differ (new file)
```

---

## CONCLUSION

The bug is a **missing ORDER BY clause** in the artifact selection query within `generateAndDeliverPrivateBriefPDF()`. 

The download endpoint works correctly because it includes `ORDER BY createdAt DESC`, but the generation service doesn't, causing it to find and reuse an arbitrary (often oldest) artifact instead of checking the latest one.

**Fix:** Add `.orderBy(desc(executiveBriefArtifacts.createdAt))` to line 217 of `executiveBriefDelivery.ts`.
