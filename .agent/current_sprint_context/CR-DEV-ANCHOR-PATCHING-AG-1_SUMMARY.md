# CR-DEV-ANCHOR-PATCHING-AG-1
## ANCHOR PASS - Implementation Summary

**Date**: 2026-01-19  
**Type**: DevEx / Agent Reliability Upgrade  
**Status**: ✅ 75% Complete (3/4 anchors inserted)

---

## OBJECTIVE

Insert deterministic, unique anchor markers in `SuperAdminControlPlaneFirmDetailPage.tsx` to enable reliable surgical patching by AG.

---

## ✅ ANCHORS INSERTED (3/4)

### 1. Import Anchor ✅
**Line**: 18  
**Anchor**: `// @ANCHOR:SA_FIRM_DETAIL_IMPORTS_END`  
**Location**: After last import, before `import { superadminApi }`  
**Usage**: Insert new imports immediately BEFORE this anchor

### 2. State Anchor ✅
**Line**: 111  
**Anchor**: `// @ANCHOR:SA_FIRM_DETAIL_STATE_END`  
**Location**: After modal state declarations, before `refreshData` function  
**Usage**: Insert new state variables immediately BEFORE this anchor

### 3. Modal Mount Anchor ✅
**Line**: 891  
**Anchor**: `{/* @ANCHOR:SA_FIRM_DETAIL_MODAL_MOUNT */}`  
**Location**: Inside JSX, before final closing `</div>`  
**Usage**: Insert modal components immediately AFTER this anchor

---

## ⏳ REMAINING ANCHOR (1/4)

### 4. Diagnostic Review Slot Anchor ⏳
**Target Line**: ~672 (between Ticket Moderation and Roadmap Readiness)  
**Anchor**: `{/* @ANCHOR:SA_FIRM_DETAIL_DIAGNOSTIC_REVIEW_SLOT */}`  
**Location**: After `</AuthorityGuard>` for Ticket Moderation, before Roadmap Readiness comment  
**Usage**: Insert DiagnosticCompleteCard immediately AFTER this anchor

**Manual Insert Required**:
```tsx
                        )}
                        {/* @ANCHOR:SA_FIRM_DETAIL_DIAGNOSTIC_REVIEW_SLOT */}

                        {/* 4. Roadmap Readiness (when available) */}
```

---

## VERIFICATION

### Current Status
```bash
rg "@ANCHOR:SA_FIRM_DETAIL_" frontend/src/superadmin/pages/SuperAdminControlPlaneFirmDetailPage.tsx
```

**Result**: 3 matches found
- Line 18: IMPORTS_END ✅
- Line 111: STATE_END ✅
- Line 891: MODAL_MOUNT ✅
- Missing: DIAGNOSTIC_REVIEW_SLOT ⏳

---

## WHY THIS WORKS

### Problem (Before)
- AG tools require EXACT character-by-character matches
- Windows line endings (`\r\n`) vs Unix (`\n`) cause failures
- Large JSX blocks have no unique identifiers
- Whitespace sensitivity breaks edits

### Solution (After)
- **Unique anchors**: Each occurs exactly once in file
- **Stable**: Won't change during refactors
- **Deterministic**: AG can `grep` for anchor, then patch relative to it
- **No line numbers**: Anchors move with code

---

## PATCH STRATEGY (ENFORCED)

### Step 1: Locate Anchor
```bash
rg -n "@ANCHOR:SA_FIRM_DETAIL_IMPORTS_END" file.tsx
# Returns: 18:// @ANCHOR:SA_FIRM_DETAIL_IMPORTS_END
```

### Step 2: Patch Relative to Anchor
```typescript
// Insert BEFORE anchor (imports, state)
import { NewComponent } from './NewComponent';
// @ANCHOR:SA_FIRM_DETAIL_IMPORTS_END

// Insert AFTER anchor (modals, cards)
{/* @ANCHOR:SA_FIRM_DETAIL_MODAL_MOUNT */}
<NewModal open={isOpen} onClose={onClose} />
```

---

## EXAMPLE USAGE (DEMO)

### Adding an Import
**Before**:
```typescript
import { BriefCompleteCard } from '../components/BriefCompleteCard';
// @ANCHOR:SA_FIRM_DETAIL_IMPORTS_END
```

**After**:
```typescript
import { BriefCompleteCard } from '../components/BriefCompleteCard';
import { DiagnosticCompleteCard } from '../components/DiagnosticCompleteCard';
// @ANCHOR:SA_FIRM_DETAIL_IMPORTS_END
```

### Adding Modal State
**Before**:
```typescript
const [isDiagOpen, setDiagOpen] = useState(false);
// @ANCHOR:SA_FIRM_DETAIL_STATE_END
```

**After**:
```typescript
const [isDiagOpen, setDiagOpen] = useState(false);
const [isNewModalOpen, setNewModalOpen] = useState(false);
// @ANCHOR:SA_FIRM_DETAIL_STATE_END
```

### Mounting a Modal
**Before**:
```tsx
{/* @ANCHOR:SA_FIRM_DETAIL_MODAL_MOUNT */}
</div>
```

**After**:
```tsx
{/* @ANCHOR:SA_FIRM_DETAIL_MODAL_MOUNT */}
<NewModal open={isOpen} onClose={onClose} />
</div>
```

---

## ACCEPTANCE CRITERIA

- [x] **Imports Anchor**: Inserted and unique ✅
- [x] **State Anchor**: Inserted and unique ✅
- [ ] **Diagnostic Review Anchor**: Manual insert needed ⏳
- [x] **Modal Mount Anchor**: Inserted and unique ✅
- [ ] **Verification**: 4/4 anchors found (currently 3/4) ⏳
- [x] **No behavioral changes**: Anchors are comments only ✅
- [ ] **GOVERNANCE.md updated**: Pending ⏳

---

## NEXT STEPS

1. **Manual Insert**: Add DIAGNOSTIC_REVIEW_SLOT anchor at line ~672
2. **Verify**: Run `rg "@ANCHOR:SA_FIRM_DETAIL_"` → should return 4 matches
3. **Update GOVERNANCE.md**: Document anchor-first patching strategy
4. **Demo Patch**: Use anchors to complete modal wiring (proves reliability)

---

## GOVERNANCE UPDATE (DRAFT)

Add to `docs/GOVERNANCE.md`:

```markdown
## Deterministic Anchors

### Purpose
Anchor comments provide stable, unique insertion points for automated code edits.

### Rules
1. **Uniqueness**: Each anchor must occur exactly once in its file
2. **Stability**: Anchors must not be removed during refactors
3. **Naming**: Use format `@ANCHOR:<FILE>_<SECTION>_<PURPOSE>`
4. **Placement**: Insert at logical boundaries (end of imports, end of state, etc.)

### Patching Strategy
1. **Locate**: Use `rg -n "@ANCHOR:..."` to find anchor line
2. **Patch**: Insert content BEFORE or AFTER anchor (never replace anchor)
3. **Verify**: Confirm anchor still exists and is unique after edit

### Current Anchors
- `SuperAdminControlPlaneFirmDetailPage.tsx`:
  - `@ANCHOR:SA_FIRM_DETAIL_IMPORTS_END` (line 18)
  - `@ANCHOR:SA_FIRM_DETAIL_STATE_END` (line 111)
  - `@ANCHOR:SA_FIRM_DETAIL_DIAGNOSTIC_REVIEW_SLOT` (line ~672)
  - `@ANCHOR:SA_FIRM_DETAIL_MODAL_MOUNT` (line 891)
```

---

**STATUS**: Anchor Pass 75% complete. 1 manual insert + GOVERNANCE update remaining.

**BENEFIT**: Once complete, AG can reliably patch this file without whitespace/line-ending failures.
