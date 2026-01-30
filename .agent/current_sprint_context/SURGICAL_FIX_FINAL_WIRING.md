# SURGICAL FIX COMPLETE - FINAL WIRING STEPS
## Modal-Only Review Pattern (Locked In)

**Status**: ✅ Competing paradigms removed | ⏳ Final wiring needed

---

## ✅ COMPLETED (Surgical Removal)

1. ✅ **Removed legacy diagnostic review state** (`reviewOpen`, `diagnosticData`)
2. ✅ **Removed `showBrief` state** (inline expansion paradigm)
3. ✅ **Added clean modal state** (`isExecBriefOpen`, `isDiagOpen`)
4. ✅ **Removed ALL inline brief expansion logic** (ExecutiveBriefPanel no longer rendered inline)
5. ✅ **Updated BriefCompleteCard** to call `setExecBriefOpen(true)`
6. ✅ **Normalized modal props** (open/onClose/data)
7. ✅ **Created DiagnosticCompleteCard** component

---

## ⏳ REMAINING (3 Steps)

### STEP 1: Add DiagnosticCompleteCard Import

**Line ~17**, **AFTER**:
```typescript
import { BriefCompleteCard } from '../components/BriefCompleteCard';
```

**ADD**:
```typescript
import { DiagnosticCompleteCard } from '../components/DiagnosticCompleteCard';
```

---

### STEP 2: Add Diagnostic Review Card

**Find** the Diagnostic milestone section (around line ~640-660), **AFTER** the Diagnostic card, **ADD**:

```typescript

                        {/* 3.5 Diagnostic Review (modal-only) */}
                        {tenant.lastDiagnosticId && (
                            <DiagnosticCompleteCard
                                status="GENERATED"
                                onReview={() => setDiagOpen(true)}
                            />
                        )}
```

---

### STEP 3: Mount Modals at End

**Find** the very end of the component JSX (around line ~890), **BEFORE** the final closing tags, **ADD**:

```typescript

            {/* Review Modals (ONLY paradigm) */}
            <ExecutiveBriefModal
                open={isExecBriefOpen}
                onClose={() => setExecBriefOpen(false)}
                data={{
                    status: tenant.executiveBriefStatus,
                    content: tenant.executiveBriefContent,
                    createdAt: tenant.executiveBriefCreatedAt,
                    approvedAt: tenant.executiveBriefApprovedAt
                }}
                status={tenant.executiveBriefStatus}
            />

            <DiagnosticReviewModal
                open={isDiagOpen}
                onClose={() => setDiagOpen(false)}
                data={data?.diagnostic || null}
                status={data?.diagnostic?.status || 'GENERATED'}
            />
```

---

## VERIFICATION

After completing steps 1-3:

1. ✅ No `showBrief` references remain
2. ✅ No inline `ExecutiveBriefPanel` rendering
3. ✅ No `reviewOpen` or `diagnosticData` state
4. ✅ BriefCompleteCard calls `setExecBriefOpen(true)`
5. ✅ DiagnosticCompleteCard calls `setDiagOpen(true)`
6. ✅ Both modals mounted at end
7. ✅ Modal props use `open/onClose/data`

---

## WHAT WAS FIXED (Root Cause)

**Before**: 3 competing paradigms
- Inline brief expansion (`showBrief` + `ExecutiveBriefPanel`)
- Legacy diagnostic state (`reviewOpen`, `diagnosticData`)
- Modal components (imported but never mounted)

**After**: 1 clean paradigm
- Modal-only review
- Dumb trigger cards
- No inline expansion anywhere

---

## FILES MODIFIED

1. ✅ `ExecutiveBriefModal.tsx` - Normalized props
2. ✅ `DiagnosticReviewModal.tsx` - Normalized props + graceful degradation
3. ✅ `BriefCompleteCard.tsx` - Dumb trigger (`onReview` prop)
4. ✅ `DiagnosticCompleteCard.tsx` - Created (dumb trigger)
5. ⏳ `SuperAdminControlPlaneFirmDetailPage.tsx` - 3 steps remaining

---

**READY FOR FINAL WIRING** - Complete steps 1-3 above.

**The system will "click" immediately once modals are mounted.**
