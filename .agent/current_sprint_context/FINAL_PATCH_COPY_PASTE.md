# FINAL PATCH - COPY/PASTE READY
## All Remaining Changes for SuperAdminControlPlaneFirmDetailPage.tsx

---

## CHANGE 1: Add Import (Line ~17)

**AFTER**:
```typescript
import { BriefCompleteCard } from '../components/BriefCompleteCard';
```

**ADD THIS LINE**:
```typescript
import { DiagnosticCompleteCard } from '../components/DiagnosticCompleteCard';
```

---

## CHANGE 2: Add Diagnostic Review Card (Line ~640)

**FIND** the section after the Diagnostic milestone (look for "Diagnostic" card), **AFTER IT**, **ADD**:

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

## CHANGE 3: Mount Modals at End (Line ~890)

**FIND** the very end of the component JSX (before the final `</div>` or `</>`), **ADD**:

```typescript

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
```

---

## VERIFICATION AFTER CHANGES

Run these checks:
1. ✅ No TypeScript errors
2. ✅ Page loads without console errors
3. ✅ Click "Review Exec Brief" → modal opens
4. ✅ Click "Review Diagnostic" → modal opens
5. ✅ Both modals close properly
6. ✅ No inline ExecutiveBriefPanel in DOM

---

## IF YOU SEE ERRORS

**"Cannot find DiagnosticCompleteCard"**:
- Verify the file exists at `frontend/src/superadmin/components/DiagnosticCompleteCard.tsx`
- Check the import path is correct

**"tenant.lastDiagnosticId is undefined"**:
- Replace with `data?.diagnostic` or whatever field indicates diagnostic exists

**"executiveBriefContent does not exist on type"**:
- The `(tenant as any)` cast handles this - it's null-safe

---

**READY TO APPLY** - Make these 3 changes in order.
