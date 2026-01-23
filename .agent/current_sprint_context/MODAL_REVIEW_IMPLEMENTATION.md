# Modal-Based Review Implementation
## P0: Execution Brief & Diagnostic Review

**Date**: 2026-01-19  
**Objective**: Replace inline expansion with modal-based review for both Executive Brief and Diagnostic outputs

---

## ✅ Completed

### 1. Created ExecutiveBriefModal Component
**File**: `frontend/src/superadmin/components/ExecutiveBriefModal.tsx`

**Features**:
- Modal overlay with backdrop blur
- Max width: `max-w-4xl`
- Max height: `max-h-[80vh]` with internal scroll
- Header: Title + Status pill + Close button
- Body: Brief content with prose styling
- Footer: Timestamp + Close button
- Clean dark theme styling

### 2. Created DiagnosticReviewModal Component
**File**: `frontend/src/superadmin/components/DiagnosticReviewModal.tsx`

**Features**:
- Larger modal: `max-w-5xl`
- Max height: `max-h-[80vh]` with internal scroll
- Multiple sections:
  - Diagnostic Analysis
  - AI Leverage Opportunities
  - Roadmap Skeleton
- Section dividers for clarity
- Filters out empty sections automatically

### 3. Updated BriefCompleteCard
**File**: `frontend/src/superadmin/components/BriefCompleteCard.tsx`

**Changes**:
- ✅ Updated hint text: "Complete. Review in modal."
- ✅ Updated button text: "Review Exec Brief" (removed expand icon)
- ✅ Simplified button styling (removed flex/gap)

---

## ⏳ Remaining Work

### 1. Wire Modals into Main Page
**File**: `frontend/src/superadmin/pages/SuperAdminControlPlaneFirmDetailPage.tsx`

**Required Changes**:

#### A. Add Imports
```typescript
import { ExecutiveBriefModal } from '../components/ExecutiveBriefModal';
import { DiagnosticReviewModal } from '../components/DiagnosticReviewModal';
```

#### B. Add Modal State
```typescript
const [isExecBriefModalOpen, setIsExecBriefModalOpen] = useState(false);
const [isDiagnosticModalOpen, setIsDiagnosticModalOpen] = useState(false);
```

#### C. Remove Inline Expansion Logic
- Remove `showBrief` state
- Remove all "Hide Brief ×" logic
- Remove inline `ExecutiveBriefPanel` rendering

#### D. Update BriefCompleteCard Usage
```typescript
<BriefCompleteCard
    status={status}
    onView={() => setIsExecBriefModalOpen(true)}  // Open modal instead
/>
```

#### E. Add Diagnostic Summary Card
Create a new collapsed card similar to `BriefCompleteCard`:
```typescript
<div className="bg-slate-900 border border-emerald-500/20 rounded-xl p-6 flex items-center justify-between">
    <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-emerald-900/20 border border-emerald-500/30 flex items-center justify-center">
            ✓
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
```

#### F. Render Modals
```typescript
{/* Modals */}
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

## Data Requirements

### Executive Brief Data
Already available in `tenant` object:
- `executiveBriefStatus`
- `executiveBriefContent`
- `executiveBriefCreatedAt`
- `executiveBriefApprovedAt`

### Diagnostic Data
Need to verify what's available in `data` object:
- Check if `data.diagnostic` exists
- Check if `data.diagnostic.outputs` contains markdown fields
- May need to fetch from existing endpoint if not already loaded

**Possible endpoints** (verify which exists):
- `/api/superadmin/firms/:tenantId/diagnostic`
- `/api/superadmin/diagnostics/:tenantId`
- Already embedded in `/api/superadmin/firms/:tenantId` response

---

## UX Flow (Target)

### Before (Current):
1. Brief Complete Card → "View Executive Brief" → **Inline expansion** (steals vertical space)
2. Diagnostic → No review option

### After (Target):
1. Brief Complete Card → "Review Exec Brief" → **Modal opens** (no vertical impact)
2. Diagnostic Summary Card → "Review Diagnostic" → **Modal opens** (no vertical impact)

**Result**: Execution spine remains visible at all times

---

## Design Principles (Locked In)

✅ **No inline expansion anywhere**  
✅ **Both review actions must be modal-based**  
✅ **No new backend endpoints** (use existing firm detail/snapshot data)  
✅ **Match minimal styling to current dark theme**  
✅ **Tight spacing; internal scroll**  

---

## Next Steps

1. **Wire modals into main page** (see "Remaining Work" above)
2. **Verify diagnostic data availability** in existing API responses
3. **Test modal open/close behavior**
4. **Remove all inline expansion logic**
5. **Verify execution spine remains visible**

---

**STATUS**: Modals created ✅ | Integration pending ⏳
