# META-TICKET: EXEC-BRIEF-REGEN-STATUS-RESET-018

## TITLE
Fix Executive Brief Regenerate to Reset DELIVERED Status

## STATUS
IMPLEMENTED

## OBJECTIVE
Ensure that clicking "REGENERATE" on a DELIVERED Executive Brief resets the status to DRAFT, allowing the "Generate PDF" button to reappear and enabling PDF regeneration with the new synthesis.

## PROBLEM
After delivering an Executive Brief (status = 'DELIVERED'), clicking "REGENERATE" would regenerate the synthesis but preserve the DELIVERED status. This caused:
- ❌ "Generate PDF" button remained hidden (gated by `!isDelivered`)
- ❌ Users couldn't regenerate the PDF after Re-Gen
- ❌ Workflow broken: Re-Gen → no way to create updated PDF

## ROOT CAUSE
**File:** `backend/src/controllers/executiveBrief.controller.ts`  
**Line 425 (before fix):**
```typescript
status: existingBrief?.status === 'APPROVED' ? 'APPROVED' : (existingBrief?.status || 'DRAFT'),
```

This logic preserved **all** existing statuses (including DELIVERED), not just APPROVED.

## SOLUTION
Changed line 425 to reset DELIVERED status to DRAFT while preserving APPROVED status:

```typescript
status: existingBrief?.status === 'APPROVED' ? 'APPROVED' : 'DRAFT',
```

## AUTHORITY GATES PRESERVED

### ✅ APPROVED Status (Governance)
- **Before:** APPROVED → APPROVED (preserved)
- **After:** APPROVED → APPROVED (preserved)
- **Impact:** No change - approval governance intact

### ✅ DELIVERED Status (Immutability)
- **Before:** DELIVERED → DELIVERED (incorrectly preserved)
- **After:** DELIVERED → DRAFT (correctly reset)
- **Impact:** Allows PDF regeneration after Re-Gen

### ✅ DRAFT Status
- **Before:** DRAFT → DRAFT
- **After:** DRAFT → DRAFT
- **Impact:** No change

## WORKFLOW RESTORED

**Before Fix:**
1. Generate Executive Brief → status = DRAFT
2. Generate PDF → hasPdf = true
3. Deliver → status = DELIVERED
4. Click "REGENERATE" → status = DELIVERED (stuck!)
5. "Generate PDF" button hidden ❌
6. Cannot regenerate PDF ❌

**After Fix:**
1. Generate Executive Brief → status = DRAFT
2. Generate PDF → hasPdf = true
3. Deliver → status = DELIVERED
4. Click "REGENERATE" → status = DRAFT ✅
5. "Generate PDF" button visible ✅
6. Can regenerate PDF ✅

## IMPLEMENTATION

### File Modified
**backend/src/controllers/executiveBrief.controller.ts**

### Change
```diff
- status: existingBrief?.status === 'APPROVED' ? 'APPROVED' : (existingBrief?.status || 'DRAFT'),
+ // Reset DELIVERED to DRAFT to allow PDF regeneration
+ status: existingBrief?.status === 'APPROVED' ? 'APPROVED' : 'DRAFT',
```

## TESTING

### Manual Verification
1. Generate Executive Brief
2. Generate PDF
3. Deliver Brief (status → DELIVERED)
4. Verify "Generate PDF" button hidden
5. Click "REGENERATE"
6. **Verify status badge changes from "DELIVERED" to "DRAFT"**
7. **Verify "Generate PDF" button reappears**
8. Click "Generate PDF"
9. Verify PDF downloads with new synthesis

### Acceptance Criteria
- ✅ REGENERATE resets DELIVERED → DRAFT
- ✅ REGENERATE preserves APPROVED → APPROVED
- ✅ "Generate PDF" button visible after Re-Gen
- ✅ PDF can be regenerated with new synthesis
- ✅ No disruption to approval governance

## CONSTRAINTS HONORED
- ✅ No changes to approval authority gates
- ✅ No changes to delivery logic
- ✅ No changes to frontend UI logic
- ✅ Surgical backend-only fix
- ✅ Preserves existing governance (APPROVED state)

## RELATED TICKETS
- EXEC-BRIEF-PDF-RESTORE-REGEN-017 (Frontend button visibility)
- EXEC-BRIEF-PDF-PROFESSIONAL-PASS-016F (PDF renderer)
- EXEC-BRIEF-GOVERNANCE-REALIGN-004 (Referenced in code comment)

## NOTES
- This fix only affects the REGENERATE path (when `isForced = true`)
- Initial generation path unchanged (always creates DRAFT)
- APPROVED briefs remain APPROVED after regeneration (governance preserved)
- DELIVERED briefs reset to DRAFT (allows PDF regeneration)

## FILES CHANGED SUMMARY

**Modified:**
- `backend/src/controllers/executiveBrief.controller.ts`:
  - Line 424-425: Updated status preservation logic
  - Added comment explaining DELIVERED reset behavior

**Total Changes:** 2 lines modified
