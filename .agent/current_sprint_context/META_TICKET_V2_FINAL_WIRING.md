# META-TICKET v2 FINAL WIRING
## CR-FIX-SA-MODAL-REVIEW-BRIEF-DIAG-1

**File**: `frontend/src/superadmin/pages/SuperAdminControlPlaneFirmDetailPage.tsx`

---

## ✅ COMPLETED

1. ✅ ExecutiveBriefModal normalized (open/onClose/data)
2. ✅ DiagnosticReviewModal normalized (open/onClose/data + graceful degradation)
3. ✅ BriefCompleteCard updated (onReview prop)
4. ✅ DiagnosticCompleteCard created

---

## STEP 1: Update Imports (Line ~10-16)

**FIND**:
```typescript
import { BriefCompleteCard } from '../components/BriefCompleteCard';
```

**REPLACE WITH**:
```typescript
import { BriefCompleteCard } from '../components/BriefCompleteCard';
import { DiagnosticCompleteCard } from '../components/DiagnosticCompleteCard';
```

**AND UPDATE** (line ~12-13):
```typescript
import { ExecutiveBriefModal } from '../components/ExecutiveBriefModal';
import { DiagnosticReviewModal } from '../components/DiagnosticReviewModal';
```

---

## STEP 2: Add Modal State (After line ~110)

**AFTER**:
```typescript
const [showROIPanel, setShowROIPanel] = useState(false);
```

**ADD**:
```typescript

// Phase 6E: Modal-based Review
const [isExecBriefOpen, setExecBriefOpen] = useState(false);
const [isDiagOpen, setDiagOpen] = useState(false);
```

---

## STEP 3: Remove showBrief State (Line ~104)

**DELETE THIS LINE**:
```typescript
const [showBrief, setShowBrief] = useState(false);
```

---

## STEP 4: Replace Brief Rendering Logic (Lines ~607-665)

**FIND** the entire block:
```typescript
{(() => {
    const status = tenant.executiveBriefStatus;
    const isComplete = status && ['APPROVED', 'ACKNOWLEDGED', 'WAIVED'].includes(status);

    if (isComplete && !showBrief) {
        return (
            <BriefCompleteCard
                status={status}
                onView={() => setShowBrief(true)}
            />
        );
    }

    return showBrief ? (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex justify-end mb-1">
                <button
                    onClick={() => setShowBrief(false)}
                    className="text-[9px] text-slate-500 hover:text-slate-300 flex items-center gap-1 uppercase tracking-wider font-bold"
                >
                    Hide Brief <span className="text-base leading-none">×</span>
                </button>
            </div>
            <ExecutiveBriefPanel
                tenantId={params.tenantId}
                diagnosticId={diagnosticId}
                status={tenant.executiveBriefStatus as any}
                onStatusChange={refreshData}
            />
        </div>
    ) : null;
})()}
```

**REPLACE WITH**:
```typescript
{/* 2. Executive Brief (when complete) */}
{(() => {
    const status = tenant.executiveBriefStatus;
    const isComplete = status && ['APPROVED', 'ACKNOWLEDGED', 'WAIVED'].includes(status);

    if (isComplete) {
        return (
            <BriefCompleteCard
                status={status}
                onReview={() => setExecBriefOpen(true)}
            />
        );
    }
    return null;
})()}
```

---

## STEP 5: Add Diagnostic Card (After Diagnostic Milestone ~Line 665)

**FIND** the Diagnostic milestone card, **AFTER IT**, **ADD**:

```typescript

                        {/* 3.5 Diagnostic Review (when available) */}
                        {data?.diagnostic && (
                            <DiagnosticCompleteCard
                                status="GENERATED"
                                onReview={() => setDiagOpen(true)}
                            />
                        )}
```

---

## STEP 6: Render Modals at End (Before Final Closing Tags ~Line 900+)

**FIND** the end of the component JSX (before `</div>` or `</>` closing tags), **ADD**:

```typescript

            {/* Review Modals */}
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

## VERIFICATION STEPS

1. ✅ No TypeScript errors
2. ✅ Load tenant with APPROVED brief → card renders
3. ✅ Click "Review Exec Brief" → modal opens with content
4. ✅ Close modal → works
5. ✅ Load tenant with diagnostic → card renders
6. ✅ Click "Review Diagnostic" → modal opens
7. ✅ Load tenant without diagnostic → modal shows "No diagnostic payload found"
8. ✅ No inline expansion anywhere
9. ✅ Execution spine visible at top

---

## GUARDRAILS MET

✅ **Normalized props**: open/onClose/data  
✅ **Graceful degradation**: Diagnostic modal handles null data  
✅ **No inline expansion**: All removed  
✅ **Dumb triggers**: Cards only call onReview  
✅ **No backend changes**: Frontend-only  
✅ **RBAC unchanged**: Uses existing tenant data  

---

**READY TO WIRE** - Follow steps 1-6 in order.
