# Production Verification Checklist - Canonical Ticket System

**Status**: ⚠️ REQUIRES USER DECISION  
**Date**: 2026-01-19

---

## ✅ Completed Steps

### 1. Controller Error Handling - FIXED
- ✅ Updated `ticketGeneration.controller.ts`
- ✅ Returns **400** for `INVENTORY_MISMATCH` (invalid canonical IDs)
- ✅ Returns **409** for other gating errors (workflow violations)
- ✅ Includes error code in response for better debugging

### 2. Legacy Path Audit - COMPLETE
- ✅ Found 4 callsites of deprecated `ingestDiagnostic()`
- ✅ 3 in production code (temp_controller, diagnosticRerun)
- ✅ 1 in test script (low risk)
- ✅ All callsites documented in `CANONICAL_VERIFICATION_REPORT.md`

### 3. Verification Tools Created
- ✅ `backend/scripts/verify_canonical_tickets.ts` - Full canonical verification
- ✅ `backend/scripts/check_canonical_db.sh` - Quick database check
- ✅ Both scripts ready to run

---

## ⏳ Pending User Actions

### Action 1: Run Database Verification

**Option A: Full Verification (Recommended)**
```bash
cd ~/code/Strategic_AI_Roadmaps
npx tsx backend/scripts/verify_canonical_tickets.ts
```

**Option B: Quick Check**
```bash
cd ~/code/Strategic_AI_Roadmaps/backend
bash scripts/check_canonical_db.sh
```

**What to look for**:
- Tickets with `inventoryId = NULL` (custom tickets)
- Tickets with `inventoryId LIKE 'INV-DERIVED-%'` (legacy fake IDs)
- Tickets with invalid `inventoryId` (orphaned references)

---

### Action 2: Decide on Legacy Path Strategy

**Found 3 active callsites** generating non-canonical tickets:

1. `backend/src/controllers/temp_controller.ts:1695`
2. `backend/src/controllers/temp_controller.ts:2450`
3. `backend/src/controllers/diagnosticRerun.controller.ts:157`

**Choose one**:

#### Option A: Hard Block (Safest)
Replace calls with:
```typescript
throw new Error('CANONICAL_REQUIRED: Use generateTicketsFromDiscovery() instead');
```
- ✅ Prevents non-canonical tickets immediately
- ❌ May break existing flows

#### Option B: Retrofit (Best Long-term)
Update each callsite to use canonical path:
```typescript
// Instead of: ingestDiagnostic(normalized, outputs)
// Use: generateTicketsFromDiscovery(discoverySynthesis)
```
- ✅ Maintains functionality
- ✅ Enforces canonical
- ❌ Requires more work

#### Option C: Monitor & Migrate (Conservative)
- Keep current implementation
- Monitor deprecation warnings
- Plan migration timeline
- ✅ No immediate breakage
- ❌ Allows non-canonical tickets to continue

---

### Action 3: Clean Up Database (If Needed)

**If verification finds non-canonical tickets**:

```sql
-- Option 1: Delete non-canonical tickets
DELETE FROM sop_tickets 
WHERE inventory_id IS NULL 
   OR inventory_id LIKE 'INV-DERIVED-%';

-- Option 2: Mark as custom (if you want to keep them)
UPDATE sop_tickets 
SET ticket_type = 'CUSTOM'
WHERE inventory_id IS NULL;

-- Option 3: Migrate to canonical (requires manual mapping)
-- Map each ticket to a canonical inventoryId
```

---

## 📊 Current System State

### Canonical Path (ENFORCED)
- ✅ `generateTicketsFromDiscovery()` - Validates all canonical IDs
- ✅ Throws `INVENTORY_MISMATCH` on unknown IDs
- ✅ Returns 400 error to client
- ✅ Requires Discovery Synthesis with ≥12 items

### Legacy Path (DEPRECATED)
- ⚠️ `ingestDiagnostic()` - Generates fake `INV-DERIVED-*` IDs
- ⚠️ Still called from 3 production locations
- ⚠️ Logs deprecation warning on every call
- ⚠️ Violates canonical ticket system

---

## 🎯 Recommended Next Steps

**Immediate (Do Now)**:
```bash
# 1. Check database state
bash backend/scripts/check_canonical_db.sh

# 2. Review output and decide on legacy path strategy
# (See Action 2 above)

# 3. If blocking legacy path, update callsites
# (See CANONICAL_VERIFICATION_REPORT.md for locations)
```

**Short-term (This Week)**:
- Run full verification: `npx tsx backend/scripts/verify_canonical_tickets.ts`
- Clean up non-canonical tickets in database
- Update or remove legacy callsites

**Long-term (Next Sprint)**:
- Remove `ingestDiagnostic()` function entirely
- Add database constraints for canonical enforcement
- Implement canonical ticket analytics

---

## 📝 Files Modified This Session

### Backend Services
1. `backend/src/services/ticketGeneration.service.ts` - Canonical enforcement
2. `backend/src/services/diagnosticIngestion.service.ts` - Deprecation warnings
3. `backend/src/controllers/ticketGeneration.controller.ts` - Error handling

### Scripts & Tools
4. `backend/scripts/verify_canonical_tickets.ts` - Verification tool
5. `backend/scripts/check_canonical_db.sh` - Quick DB check

### Documentation
6. `.agent/current_sprint_context/CR-FIX-CANONICAL-TICKET-SELECTION-RETROFIT-1_SUMMARY.md`
7. `.agent/current_sprint_context/CANONICAL_VERIFICATION_REPORT.md`
8. `.agent/current_sprint_context/PRODUCTION_VERIFICATION_CHECKLIST.md` (this file)

### Frontend (UX Polish)
9. `frontend/src/superadmin/pages/SuperAdminControlPlaneFirmDetailPage.tsx` - Compact UI
10. `frontend/src/superadmin/components/BriefCompleteCard.tsx` - Collapsed brief

---

## 🚦 Status Summary

| Item | Status | Action Required |
|------|--------|-----------------|
| Canonical enforcement | ✅ COMPLETE | None |
| Error handling (400/409) | ✅ COMPLETE | None |
| Verification scripts | ✅ COMPLETE | Run them |
| Legacy path audit | ✅ COMPLETE | Decide strategy |
| Database state | ⏳ PENDING | Run verification |
| Legacy callsite cleanup | ⏳ PENDING | User decision |
| UX polish (collapsed UI) | ✅ COMPLETE | Visual testing |

---

**NEXT: Run `bash backend/scripts/check_canonical_db.sh` and share output**

