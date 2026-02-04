# STALE ARTIFACT INVALIDATION PATCH - EXEC-BRIEF-PDF-ARTIFACT-CONSISTENCY-022

## Problem

After clicking "REGENERATE" (which updates `brief.updatedAt`), clicking "Regenerate PDF" would stream the OLD artifact instead of generating a NEW one. This caused:
- Downloaded PDFs showing old "Generated:" dates
- Filename dates not matching regeneration date
- Logs showing `artifactCreatedAt=2026-01-30` even after Feb 3 regeneration

## Root Cause

`generateAndDeliverPrivateBriefPDF()` had no staleness check. It would:
1. Find existing artifact (created Jan 30)
2. Check if mode matches (`EXECUTIVE_SYNTHESIS` == `EXECUTIVE_SYNTHESIS`) ✅
3. Stream existing artifact ❌ **BUG: Ignored that brief was regenerated**

## Solution

Implemented **stale artifact invalidation** in `backend/src/services/executiveBriefDelivery.ts`:

```typescript
// STALE ARTIFACT INVALIDATION (EXEC-BRIEF-PDF-ARTIFACT-CONSISTENCY-022)
// If brief was regenerated AFTER artifact was created, artifact is stale
const briefStamp = brief.updatedAt || brief.generatedAt || new Date(0);
const artifactStamp = existingArtifact?.createdAt || new Date(0);
const isStale = existingArtifact && artifactStamp < briefStamp;

if (isStale) {
  console.log(
    `[PDF_STALE] briefUpdatedAt=${briefStamp.toISOString()} ` +
    `artifactCreatedAt=${artifactStamp.toISOString()} => regenerate=true`
  );
}

// If enforced OR no artifact OR stale artifact, we MUST regenerate
if (isEnforced || !existingArtifact || isStale) {
  // ... regenerate PDF
}
```

### Logic

**Stale artifact** = `artifact.createdAt < brief.updatedAt`

**When stale:**
- Force regeneration
- Create NEW artifact row with `createdAt = new Date()`
- Render PDF with NEW timestamp
- Log `[PDF_STALE] ... => regenerate=true`

**When fresh:**
- Stream existing artifact
- Log `[PDF_FRESH] ... => regenerate=false (streaming existing)`

## Changes Made

### File: `backend/src/services/executiveBriefDelivery.ts`

**Lines 217-231:** Added stale artifact detection
```typescript
const briefStamp = brief.updatedAt || brief.generatedAt || new Date(0);
const artifactStamp = existingArtifact?.createdAt || new Date(0);
const isStale = existingArtifact && artifactStamp < briefStamp;
```

**Line 231:** Updated regeneration condition
```typescript
// Before:
if (isEnforced || !existingArtifact) {

// After:
if (isEnforced || !existingArtifact || isStale) {
```

**Lines 307-310:** Added fresh artifact log
```typescript
console.log(
  `[PDF_FRESH] briefUpdatedAt=${briefStamp.toISOString()} ` +
  `artifactCreatedAt=${artifactStamp.toISOString()} => regenerate=false (streaming existing)`
);
```

### File: `backend/src/services/__tests__/staleArtifactInvalidation.test.ts` (NEW)

Created regression test with 2 scenarios:
1. **Stale artifact:** `artifact.createdAt (Jan 30) < brief.updatedAt (Feb 3)` → regenerate
2. **Fresh artifact:** `artifact.createdAt (Feb 3) >= brief.updatedAt (Jan 30)` → stream existing

## Observability

### Logs Added

**When artifact is stale:**
```
[PDF_STALE] briefUpdatedAt=2026-02-03T22:00:00.000Z artifactCreatedAt=2026-01-30T00:50:00.000Z => regenerate=true
```

**When artifact is fresh:**
```
[PDF_FRESH] briefUpdatedAt=2026-01-30T00:50:00.000Z artifactCreatedAt=2026-02-03T22:00:00.000Z => regenerate=false (streaming existing)
```

## Verification Steps

### 1. Run Regression Test

```bash
cd backend
pnpm vitest run src/services/__tests__/staleArtifactInvalidation.test.ts
```

**Expected:** Both tests pass
- Stale artifact → regenerate=true
- Fresh artifact → regenerate=false

### 2. Manual Test with Shakey's

**Sequence:**
1. Restart backend (load new code)
2. Navigate to Shakey's in SuperAdmin
3. Click "REGENERATE" (updates `brief.updatedAt` to Feb 3, 2026)
4. Click "Regenerate PDF"
5. Check logs for `[PDF_STALE]` message
6. Click "Download PDF"
7. Open PDF and verify "Generated: 2/03/2026"
8. Verify filename: `Shakey_s_Restaurant_Executive_Brief_2026-02-03.pdf`

**Expected Logs:**
```
[PDF_SELECT] path=generate tenantId=... briefId=... artifactId=... artifactCreatedAt=2026-01-30...
[PDF_STALE] briefUpdatedAt=2026-02-03T... artifactCreatedAt=2026-01-30T... => regenerate=true
[PDF] Mode mismatch or missing artifact. Regenerating in EXECUTIVE_SYNTHESIS...
```

**After regeneration:**
```
[PDF_SELECT] path=download tenantId=... artifactId=NEW_ID artifactCreatedAt=2026-02-03T...
[PDF_FRESH] briefUpdatedAt=2026-02-03T... artifactCreatedAt=2026-02-03T... => regenerate=false (streaming existing)
```

## Acceptance Criteria

### ✅ Implemented
- [x] Stale artifact detection added (`artifact.createdAt < brief.updatedAt`)
- [x] Force regeneration when artifact is stale
- [x] Logs prove decision (`[PDF_STALE]` / `[PDF_FRESH]`)
- [x] Regression test added
- [x] No schema migrations required
- [x] Works with in-place brief updates (same briefId)

### ⏳ Pending Verification
- [ ] Test passes locally
- [ ] Manual test with Shakey's confirms new PDF generated
- [ ] Logs show `[PDF_STALE]` on first regen after REGENERATE
- [ ] Logs show `[PDF_FRESH]` on subsequent downloads
- [ ] PDF shows "Generated: 2/03/2026"
- [ ] Filename shows `2026-02-03`

## Impact

**Before fix:**
- REGENERATE → Regenerate PDF → Download PDF
- Result: Old PDF (Jan 30) streamed
- Logs: `action=stream_existing`

**After fix:**
- REGENERATE → Regenerate PDF → Download PDF
- Result: NEW PDF (Feb 3) generated
- Logs: `[PDF_STALE] ... => regenerate=true`

**Subsequent downloads:**
- Download PDF (without REGENERATE)
- Result: Latest PDF (Feb 3) streamed
- Logs: `[PDF_FRESH] ... => regenerate=false`

## Files Modified

1. `backend/src/services/executiveBriefDelivery.ts` (stale detection logic)
2. `backend/src/services/__tests__/staleArtifactInvalidation.test.ts` (NEW regression test)

**Total:** 1 file modified, 1 file created

## Commands to Run

### Run Test
```bash
cd backend
pnpm vitest run src/services/__tests__/staleArtifactInvalidation.test.ts
```

### Restart Backend
```bash
# Kill existing backend process
# Restart with:
cd backend
pnpm dev
```

### Manual Verification
1. Open SuperAdmin: `http://localhost:5173/superadmin`
2. Navigate to Shakey's
3. Click "REGENERATE"
4. Click "Regenerate PDF"
5. Click "Download PDF"
6. Open PDF and check "Generated:" date
7. Check backend logs for `[PDF_STALE]` and `[PDF_FRESH]`

---

## Summary

**What changed:** Added staleness check comparing `artifact.createdAt` vs `brief.updatedAt`

**Why:** Prevent old artifacts from being streamed after brief regeneration

**Result:** REGENERATE → Regenerate PDF now always generates a NEW PDF with current timestamp
