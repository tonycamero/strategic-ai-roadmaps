# MODAL WIRING - EXACT INSTRUCTIONS
## Complete Integration Guide

**File**: `frontend/src/superadmin/pages/SuperAdminControlPlaneFirmDetailPage.tsx`

---

## STEP 1: Add Modal State (Line ~110)

**After line 110** (`const [showROIPanel, setShowROIPanel] = useState(false);`), **ADD**:

```typescript
    
    // Phase 6E: Modal-based Review
    const [isExecBriefModalOpen, setIsExecBriefModalOpen] = useState(false);
    const [isDiagnosticModalOpen, setIsDiagnosticModalOpen] = useState(false);
```

---

## STEP 2: Update BriefCompleteCard (Line ~609)

**FIND** (around line 609):
```typescript
<BriefCompleteCard
    status={status}
    onView={() => setShowBrief(true)}
/>
```

**REPLACE WITH**:
```typescript
<BriefCompleteCard
    status={status}
    onView={() => setIsExecBriefModalOpen(true)}
/>
```

---

## STEP 3: Remove Inline Brief Expansion (Lines ~607-665)

**FIND** the entire block that looks like:
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
{(() => {
    const status = tenant.executiveBriefStatus;
    const isComplete = status && ['APPROVED', 'ACKNOWLEDGED', 'WAIVED'].includes(status);

    if (isComplete) {
        return (
            <BriefCompleteCard
                status={status}
                onView={() => setIsExecBriefModalOpen(true)}
            />
        );
    }

    return null; // Or keep draft state rendering if needed
})()}
```

---

## STEP 4: Add Diagnostic Review Card (After Diagnostic Milestone)

**FIND** the Diagnostic milestone card (around line 655-665), **AFTER IT**, **ADD**:

```typescript
                        {/* 3.5 Diagnostic Review (when available) */}
                        {data?.diagnostic && (
                            <div className="bg-slate-900 border border-emerald-500/20 rounded-xl p-6 flex items-center justify-between shadow-lg shadow-emerald-900/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-emerald-900/20 border border-emerald-500/30 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-sm font-bold text-slate-200">Diagnostic Outputs</h3>
                                            <span className="px-2 py-0.5 bg-emerald-900/30 border border-emerald-500/40 rounded text-[10px] uppercase font-bold text-emerald-400 tracking-widest">
                                                GENERATED
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500">Outputs available. Review in modal.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsDiagnosticModalOpen(true)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-lg transition-colors border border-slate-700"
                                >
                                    Review Diagnostic
                                </button>
                            </div>
                        )}
```

---

## STEP 5: Render Modals (End of Component, Before Closing Tags)

**FIND** the very end of the component JSX (around line 900+), **BEFORE** the final closing tags, **ADD**:

```typescript
            {/* Review Modals */}
            <ExecutiveBriefModal
                isOpen={isExecBriefModalOpen}
                onClose={() => setIsExecBriefModalOpen(false)}
                briefData={{
                    status: tenant.executiveBriefStatus || 'DRAFT',
                    content: tenant.executiveBriefContent,
                    createdAt: tenant.executiveBriefCreatedAt,
                    approvedAt: tenant.executiveBriefApprovedAt
                }}
            />

            <DiagnosticReviewModal
                isOpen={isDiagnosticModalOpen}
                onClose={() => setIsDiagnosticModalOpen(false)}
                diagnosticData={{
                    status: 'GENERATED',
                    createdAt: data?.diagnostic?.createdAt,
                    outputs: {
                        sop01DiagnosticMarkdown: data?.diagnostic?.outputs?.sop01DiagnosticMarkdown,
                        sop01AiLeverageMarkdown: data?.diagnostic?.outputs?.sop01AiLeverageMarkdown,
                        sop01RoadmapSkeletonMarkdown: data?.diagnostic?.outputs?.sop01RoadmapSkeletonMarkdown
                    }
                }}
            />
```

---

## STEP 6: Optional Cleanup

**FIND** (line ~104):
```typescript
const [showBrief, setShowBrief] = useState(false);
```

**DELETE** this line (it's no longer used)

---

## VERIFICATION CHECKLIST

After making all changes:

1. ✅ Modal state variables added
2. ✅ BriefCompleteCard opens modal
3. ✅ Inline brief expansion removed
4. ✅ Diagnostic review card added
5. ✅ Both modals rendered at end
6. ✅ No TypeScript errors
7. ✅ Test: Click "Review Exec Brief" → Modal opens
8. ✅ Test: Click "Review Diagnostic" → Modal opens
9. ✅ Test: Close buttons work
10. ✅ Execution spine remains visible

---

**IMPORTS ARE ALREADY ADDED** ✅
- `ExecutiveBriefModal` imported
- `DiagnosticReviewModal` imported

**COMPONENTS ARE ALREADY CREATED** ✅
- `ExecutiveBriefModal.tsx` exists
- `DiagnosticReviewModal.tsx` exists
- `BriefCompleteCard.tsx` updated

---

**READY TO WIRE** - Follow steps 1-6 above in order.
