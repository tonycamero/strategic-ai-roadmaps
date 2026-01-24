# Canonical Ticket System - Production Verification Report

**Date**: 2026-01-19  
**Status**: ⚠️ LEGACY PATHS DETECTED - REQUIRES DECISION

---

## 🔍 Step 1: Legacy Path Callsites Found

The deprecated `ingestDiagnostic()` function (generates fake `INV-DERIVED-*` IDs) is still called from **4 locations**:

### Active Callsites:

1. **`backend/src/controllers/temp_controller.ts:1695`**
   ```typescript
   ingestionResult = await ingestDiagnostic(normalized, outputs);
   ```
   - **Context**: Legacy diagnostic ingestion flow
   - **Risk**: HIGH - Generates non-canonical tickets

2. **`backend/src/controllers/temp_controller.ts:2450`**
   ```typescript
   const result = await ingestDiagnostic(
   ```
   - **Context**: Another legacy flow in temp_controller
   - **Risk**: HIGH - Generates non-canonical tickets

3. **`backend/src/controllers/diagnosticRerun.controller.ts:157`**
   ```typescript
   ingestionResult = await ingestDiagnostic(normalized, outputs);
   ```
   - **Context**: Diagnostic rerun functionality
   - **Risk**: HIGH - Generates non-canonical tickets

4. **`backend/src/scripts/testHayesDiagnostic.ts:32`**
   ```typescript
   const result = await ingestDiagnostic(diagnosticMap);
   ```
   - **Context**: Test script only
   - **Risk**: LOW - Test/dev only

---

## ⚠️ DECISION REQUIRED

You have **3 options** for each callsite:

### Option A: Hard Block (Recommended for Production Safety)
Replace `ingestDiagnostic()` calls with a throw:
```typescript
throw new Error(
  'CANONICAL_REQUIRED: ingestDiagnostic() is deprecated. ' +
  'Use generateTicketsFromDiscovery() with Discovery Synthesis instead.'
);
```

**Pros**: Prevents non-canonical ticket generation immediately  
**Cons**: Breaks any flows still using this path

### Option B: Retrofit to Canonical Path
Update each callsite to:
1. Create/fetch Discovery Synthesis
2. Call `generateTicketsFromDiscovery()` instead

**Pros**: Maintains functionality while enforcing canonical  
**Cons**: Requires more work, may need Discovery Synthesis creation

### Option C: Allow Temporarily with Warning
Keep current implementation but:
- Ensure deprecation warnings are logged
- Set deadline for removal
- Monitor usage in production

**Pros**: No immediate breakage  
**Cons**: Allows non-canonical tickets to continue being created

---

## ✅ Step 2: Controller Error Handling - FIXED

Updated `ticketGeneration.controller.ts` to return proper HTTP status codes:

```typescript
// INVENTORY_MISMATCH = 400 (invalid canonical IDs)
// Other gating errors = 409 (workflow violations)
const statusCode = error.code === 'INVENTORY_MISMATCH' ? 400 : 409;
return res.status(statusCode).json({ 
    error: error.code || 'TICKET_GENERATION_ERROR',
    message: error.message 
});
```

**Error Code Mapping**:
- `INVENTORY_MISMATCH` → **400 Bad Request** (invalid canonical IDs)
- `DISCOVERY_REQUIRED` → **409 Conflict** (workflow gate)
- `DISCOVERY_NOT_APPROVED` → **409 Conflict** (workflow gate)
- `INSUFFICIENT_SELECTION` → **409 Conflict** (workflow gate)
- `DIAGNOSTIC_NOT_FOUND` → **409 Conflict** (workflow gate)
- `NO_VALID_TICKETS` → **409 Conflict** (workflow gate)

---

## 📊 Step 3: Database Verification - PENDING

**Action Required**: Run the canonical verification script:

```bash
cd /path/to/Strategic_AI_Roadmaps
npx tsx backend/scripts/verify_canonical_tickets.ts
```

**What it checks**:
- ✅ Canonical inventory integrity (no duplicates, valid dependencies)
- ✅ All tenant tickets reference valid canonical IDs
- ✅ Detects custom tickets (no inventoryId)
- ✅ Detects invalid tickets (unknown inventoryId)
- ✅ Verifies title/description match canonical templates

**Expected Issues**:
- Tickets with `INV-DERIVED-*` IDs (from legacy path)
- Tickets with no `inventoryId` (custom tickets)
- Tickets with invalid `inventoryId` (orphaned references)

---

## 🎯 Recommended Action Plan

### Immediate (P0):
1. **Run verification script** to identify existing non-canonical tickets
2. **Decide on legacy path strategy** (Block, Retrofit, or Allow)
3. **Update callsites** based on decision

### Short-term (P1):
1. **Migrate or delete** non-canonical tickets found in database
2. **Add database constraint** (optional): `CHECK (inventoryId IS NOT NULL OR ticketType = 'CUSTOM')`
3. **Monitor production** for deprecation warnings

### Long-term (P2):
1. **Remove `ingestDiagnostic()` entirely** once all flows migrated
2. **Add canonical version tracking** to tickets
3. **Implement canonical ticket analytics** dashboard

---

## 🚨 Risk Assessment

### Current State:
- ✅ **Canonical path enforced**: `generateTicketsFromDiscovery()` validates all IDs
- ✅ **Error handling correct**: 400 for invalid IDs, 409 for workflow gates
- ⚠️ **Legacy path active**: 3 production callsites still generate non-canonical tickets
- ⚠️ **Database state unknown**: May contain non-canonical tickets from past runs

### Mitigation:
- Deprecation warnings logged on every `ingestDiagnostic()` call
- Verification script available to detect issues
- Clear documentation of canonical vs non-canonical paths

---

## 📝 Next Steps

**Choose one path forward**:

### Path 1: Aggressive (Recommended)
```bash
# 1. Run verification
npx tsx backend/scripts/verify_canonical_tickets.ts

# 2. Hard block legacy path
# Edit: temp_controller.ts, diagnosticRerun.controller.ts
# Replace ingestDiagnostic() calls with throw

# 3. Clean up database
# Delete or migrate non-canonical tickets
```

### Path 2: Conservative
```bash
# 1. Run verification
npx tsx backend/scripts/verify_canonical_tickets.ts

# 2. Monitor usage
# Add metrics/logging to track ingestDiagnostic() calls

# 3. Plan migration
# Schedule retrofit of legacy flows to canonical path
```

---

**END OF VERIFICATION REPORT**
