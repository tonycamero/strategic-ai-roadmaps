# COMPLETE MODAL WIRING - FINAL PATCH
## Using Anchor-Relative Patching

**All components are ready. Just add these 3 code blocks.**

---

## PATCH 1: Add Import (Line 17-18)

**FIND**:
```typescript
import { BriefCompleteCard } from '../components/BriefCompleteCard';
// @ANCHOR:SA_FIRM_DETAIL_IMPORTS_END
```

**REPLACE WITH**:
```typescript
import { BriefCompleteCard } from '../components/BriefCompleteCard';
import { DiagnosticCompleteCard } from '../components/DiagnosticCompleteCard';
// @ANCHOR:SA_FIRM_DETAIL_IMPORTS_END
```

---

## PATCH 2: Add Diagnostic Review Card (Line ~672)

**FIND**:
```typescript
                        )}

                        {/* 4. Roadmap Readiness (when available) */}
```

**REPLACE WITH**:
```typescript
                        )}
                        {/* @ANCHOR:SA_FIRM_DETAIL_DIAGNOSTIC_REVIEW_SLOT */}

                        {/* 3.5 Diagnostic Review (when available) */}
                        {tenant.lastDiagnosticId && (
                            <DiagnosticCompleteCard
                                status="GENERATED"
                                onReview={() => setDiagOpen(true)}
                            />
                        )}

                        {/* 4. Roadmap Readiness (when available) */}
```

---

## PATCH 3: Mount Modals (Line 891)

**FIND**:
```typescript
            )}
            {/* @ANCHOR:SA_FIRM_DETAIL_MODAL_MOUNT */}
        </div>
```

**REPLACE WITH**:
```typescript
            )}
            {/* @ANCHOR:SA_FIRM_DETAIL_MODAL_MOUNT */}

            {/* Review Modals (ONLY paradigm) */}
            <ExecutiveBriefModal
                open={isExecBriefOpen}
                onClose={() => setExecBriefOpen(false)}
                data={{
                    status: tenant.executiveBriefStatus,
                    content: (tenant as any).executiveBriefContent ?? null,
                    createdAt: (tenant as any).executiveBriefCreatedAt ?? null,
                    approvedAt: (tenant as any).executiveBriefApprovedAt ?? null
                }}
                status={tenant.executiveBriefStatus}
            />

            <DiagnosticReviewModal
                open={isDiagOpen}
                onClose={() => setDiagOpen(false)}
                data={data?.diagnostic || null}
                status={data?.diagnostic?.status || 'GENERATED'}
            />
        </div>
```

---

## VERIFICATION AFTER PATCHING

1. **No TypeScript errors**
2. **Page loads without console errors**
3. **Click "Review Exec Brief"** → Modal opens
4. **Click "Review Diagnostic"** → Modal opens
5. **Both modals close properly**
6. **No inline ExecutiveBriefPanel in DOM**

---

## WHAT'S ALREADY DONE ✅

1. ✅ ExecutiveBriefModal component (normalized props)
2. ✅ DiagnosticReviewModal component (graceful degradation)
3. ✅ BriefCompleteCard component (dumb trigger)
4. ✅ DiagnosticCompleteCard component (dumb trigger)
5. ✅ Modal state added (`isExecBriefOpen`, `isDiagOpen`)
6. ✅ Inline expansion removed (no `showBrief`, no `ExecutiveBriefPanel`)
7. ✅ BriefCompleteCard wired to `setExecBriefOpen(true)`
8. ✅ 3/4 anchors inserted

---

## WHAT THESE 3 PATCHES DO

**Patch 1**: Imports the DiagnosticCompleteCard component  
**Patch 2**: Adds the diagnostic review trigger card + anchor  
**Patch 3**: Mounts both modals at the end of the component

---

**READY TO APPLY** - 3 simple copy/paste edits to complete the wiring.

**RESULT**: Modal-only review, no inline expansion, execution spine visible without scrolling.
