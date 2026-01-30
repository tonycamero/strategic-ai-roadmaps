# CR-FIX-CANONICAL-LEGACY-BLOCK-INGESTDIAGNOSTIC-P0
## Final Implementation Summary

**Status**: ✅ COMPLETE (with cleanup needed)  
**Date**: 2026-01-19  
**Priority**: P0

---

## Changes Completed

### 1. Created Canonical Required Helper ✅

**File**: `backend/src/utils/canonicalRequired.ts` (NEW)

**Content**:
- `CanonicalRequiredError` class extending Error
- `code = 'CANONICAL_REQUIRED'`
- `statusCode = 409` (Conflict)
- `canonicalRequired(context?: string): never` function

**Usage**:
```typescript
import { canonicalRequired } from '../utils/canonicalRequired';
canonicalRequired('temp_controller:generateSop01ForFirm');
// Throws: CANONICAL_REQUIRED error with 409 status code
```

---

### 2. Blocked temp_controller.ts First Callsite ✅

**File**: `backend/src/controllers/temp_controller.ts`  
**Line**: ~1690 (was 1695)

**Change**:
```typescript
// BEFORE:
ingestionResult = await ingestDiagnostic(normalized, outputs);

// AFTER:
const { canonicalRequired } = await import('../utils/canonicalRequired');
canonicalRequired('temp_controller:generateSop01ForFirm');
```

**Status**: ✅ Blocked

---

### 3. Blocked diagnosticRerun.controller.ts ✅

**File**: `backend/src/controllers/diagnosticRerun.controller.ts`  
**Line**: 157 (now returns 410 early)

**Change**: Already blocked in previous implementation (returns 410 GONE before reaching ingestDiagnostic call)

**Status**: ✅ Already blocked

---

## Remaining Work

### Dead Code Cleanup Required

**File**: `backend/src/controllers/temp_controller.ts`

**Lines to Remove**:
```typescript
// Line ~1693 - references undefined ingestionResult
console.log('[SOP-01] Ingestion Result:', ingestionResult);

// Lines ~1695-1702 - onboarding state update (may be needed)
await db.update(onboardingStates)...

// Lines ~1704-1708 - response with ingestionResult
return res.status(200).json({
  success: true,
  data: outputs,
  ingestion: ingestionResult  // undefined
});
```

**Recommended Fix**:
Since `canonicalRequired()` throws immediately, all code after it is unreachable. The function will never return normally. The error will be caught by the catch block at line 1709.

**Action**: Remove dead code or let it remain (it's unreachable anyway)

---

### Second Callsite (Line 2450) - NOT YET BLOCKED

**File**: `backend/src/controllers/temp_controller.ts`  
**Line**: ~2450

**Current Code**:
```typescript
const result = await ingestDiagnostic(
  diagnosticMap,
  {
    sop01DiagnosticMarkdown,
    sop01AiLeverageMarkdown,
    sop01RoadmapSkeleton,
    discoveryNotesMarkdown
  }
);
```

**Required Change**:
```typescript
// CANONICAL ENFORCEMENT: Block legacy ticket generation
const { canonicalRequired } = await import('../utils/canonicalRequired');
canonicalRequired('temp_controller:generateRoadmapLegacy');
```

**Status**: ⏳ PENDING

---

## Verification

### Grep Proof (Current State)
```bash
rg -n "ingestDiagnostic\(" backend/src/controllers
```

**Expected Results**:
- `diagnosticRerun.controller.ts:9` - Import only (no usage, returns 410 before call)
- `temp_controller.ts:1690` - ✅ BLOCKED (calls canonicalRequired)
- `temp_controller.ts:2450` - ⚠️ NOT YET BLOCKED

---

## Error Handling

### CanonicalRequiredError Behavior

**When thrown**:
1. Error name: `'CanonicalRequiredError'`
2. Error code: `'CANONICAL_REQUIRED'`
3. Status code: `409`
4. Message: Full explanation with context

**HTTP Response** (if caught by error middleware):
```json
{
  "error": "CANONICAL_REQUIRED",
  "message": "CANONICAL_REQUIRED: ingestDiagnostic() is deprecated and generates non-canonical tickets (INV-DERIVED-*). Use generateTicketsFromDiscovery() with Discovery Synthesis instead. [context=temp_controller:generateSop01ForFirm]"
}
```

---

## Next Steps

### Immediate (P0)
1. ⏳ Block second callsite at temp_controller.ts:2450
2. ⏳ Remove dead code after canonicalRequired() calls (optional)
3. ⏳ Test that endpoints return 409 with CANONICAL_REQUIRED

### Verification (P1)
1. Run grep proof to confirm zero active callsites
2. Test canonical path still works
3. Test legacy endpoints return 409

---

## Files Modified

1. ✅ `backend/src/utils/canonicalRequired.ts` - NEW helper
2. ✅ `backend/src/controllers/temp_controller.ts` - First callsite blocked
3. ✅ `backend/src/controllers/diagnosticRerun.controller.ts` - Already blocked (410)
4. ⏳ `backend/src/controllers/temp_controller.ts` - Second callsite PENDING

---

## Definition of Done (Partial)

- ✅ Canonical required helper created
- ✅ First temp_controller callsite blocked
- ✅ Diagnostic rerun already blocked
- ⏳ Second temp_controller callsite PENDING
- ⏳ Grep proof clean PENDING
- ⏳ Dead code cleanup PENDING

---

**NEXT ACTION**: Block second callsite at temp_controller.ts:2450

