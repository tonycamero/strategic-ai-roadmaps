# Modal Review Implementation - Status Update
## Phase 6E: Modal-Based Review

**Date**: 2026-01-19  
**Status**: ⏳ IN PROGRESS

---

## ✅ Completed

### 1. Modal Components Created
- ✅ `ExecutiveBriefModal.tsx` - Ready to use
- ✅ `DiagnosticReviewModal.tsx` - Ready to use
- ✅ `BriefCompleteCard.tsx` - Updated button text

### 2. Imports Added
- ✅ `ExecutiveBriefModal` imported into main page
- ✅ `DiagnosticReviewModal` imported into main page

---

## ⏳ Remaining Work

### Step 1: Add Modal State (NEXT)
In `SuperAdminControlPlaneFirmDetailPage.tsx` around line 103-110:

**Remove**:
```typescript
const [showBrief, setShowBrief] = useState(false);
```

**Add**:
```typescript
// Phase 6E: Modal-based Review  
const [isExecBriefModalOpen, setIsExecBriefModalOpen] = useState(false);
const [isDiagnosticModalOpen, setIsDiagnosticModalOpen] = useState(false);
```

### Step 2: Update BriefCompleteCard Usage
Find where `BriefCompleteCard` is rendered (around line 609-620) and update:

**Change**:
```typescript
onView={() => setShowBrief(true)}
```

**To**:
```typescript
onView={() => setIsExecBriefModalOpen(true)}
```

### Step 3: Remove Inline Brief Expansion Logic
Find and remove the conditional logic that shows/hides the brief inline (around lines 607-665).

**Remove entire block** that looks like:
```typescript
if (isComplete && !showBrief) {
    return <BriefCompleteCard ... />
}
return <ExecutiveBriefPanel ... />
```

**Replace with**:
```typescript
{isComplete ? (
    <BriefCompleteCard
        status={status}
        onView={() => setIsExecBriefModalOpen(true)}
    />
) : (
    // Keep draft state rendering if needed
)}
```

### Step 4: Add Diagnostic Summary Card
After the Diagnostic milestone in the execution spine, add:

```typescript
{/* Diagnostic Review Card */}
{data?.diagnostic && (
    <div className="bg-slate-900 border border-emerald-500/20 rounded-xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-900/20 border border-emerald-500/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-sm font-bold text-slate-200">Diagnostic</h3>
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

### Step 5: Render Modals at End of Component
At the very end of the component JSX (before closing tags), add:

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

## Data Verification Needed

Check what diagnostic data is available in the `data` object:
- `data.diagnostic.createdAt`
- `data.diagnostic.outputs.sop01DiagnosticMarkdown`
- `data.diagnostic.outputs.sop01AiLeverageMarkdown`
- `data.diagnostic.outputs.sop01RoadmapSkeletonMarkdown`

If these fields don't exist, adjust the modal data mapping accordingly.

---

## Testing Checklist

After implementation:
1. ✅ Click "Review Exec Brief" → Modal opens
2. ✅ Modal displays brief content
3. ✅ Close button works
4. ✅ Click "Review Diagnostic" → Modal opens
5. ✅ Modal displays diagnostic sections
6. ✅ Close button works
7. ✅ No inline expansion occurs
8. ✅ Execution spine remains visible

---

**NEXT ACTION**: Manually add modal state and wire up the modals in the main page component.
