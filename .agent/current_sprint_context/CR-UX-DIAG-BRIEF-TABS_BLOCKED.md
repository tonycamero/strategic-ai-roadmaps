# CR-UX-DIAG-BRIEF-TABS - Implementation Plan
## Payload-Driven Tabs for Executive Brief & Diagnostic

**Date**: 2026-01-19  
**Type**: UX Enhancement (Data-Driven Tabs)  
**Priority**: P0  
**Status**: Planning

---

## CURRENT STATE ANALYSIS

### Executive Brief
**Current Payload** (from `SuperAdminControlPlaneFirmDetailPage.tsx` line 722-726):
```typescript
data={{
    status: tenant.executiveBriefStatus,
    content: (tenant as any).executiveBriefContent ?? null,
    createdAt: (tenant as any).executiveBriefCreatedAt ?? null,
    approvedAt: (tenant as any).executiveBriefApprovedAt ?? null
}}
```

**Problem**: `executiveBriefContent` is cast as `any` - this field doesn't exist in the API response.

**Reality Check Needed**:
1. Does the backend return `executiveBriefContent`?
2. If not, where is it stored?
3. What is the actual structure?

### Diagnostic
**Current Payload** (from `DiagnosticReviewModal.tsx` line 9-13):
```typescript
outputs?: {
    sop01DiagnosticMarkdown?: string;
    sop01AiLeverageMarkdown?: string;
    sop01RoadmapSkeletonMarkdown?: string;
}
```

**Problem**: `data.diagnostic` is passed but its structure is unknown.

**Reality Check Needed**:
1. What does `data.diagnostic` actually contain?
2. Where is it fetched from?
3. What are the EXACT field names?

---

## BLOCKER: MISSING DATA

**The modals are wired but have NO DATA to display.**

### What's Missing:
1. **Executive Brief Content**: Not in `getFirmDetail` or `getFirmDetailV2` response
2. **Diagnostic Outputs**: Not in `getFirmDetail` or `getFirmDetailV2` response

### What Needs to Happen:
1. **Find where this data lives** (backend tables/endpoints)
2. **Either**:
   - Add fields to existing `getFirmDetail` response, OR
   - Create separate fetch calls in the modal components

---

## RECOMMENDED APPROACH

### Option A: Fetch in Modal (Lazy Load)
**Pros**:
- No changes to existing API
- Data only loaded when modal opens
- Smaller initial page load

**Cons**:
- Extra network requests
- Loading states in modals

### Option B: Include in Page Load
**Pros**:
- All data available immediately
- No loading states in modals

**Cons**:
- Larger initial payload
- Backend API changes required

---

## NEXT STEPS (BLOCKED)

1. **FIND THE DATA**:
   - Search backend for `executive_briefs` table
   - Search backend for diagnostic outputs storage
   - Identify exact field names

2. **VERIFY PAYLOAD STRUCTURE**:
   - Run actual API call
   - Inspect response
   - Document real structure

3. **IMPLEMENT TABS** (only after data is confirmed):
   - Executive Brief: Dynamic tabs from `Object.keys(briefData)`
   - Diagnostic: Fixed tabs from known fields

---

## CANNOT PROCEED WITHOUT:

1. ✅ Knowing where executive brief content is stored
2. ✅ Knowing where diagnostic outputs are stored
3. ✅ Actual payload structures (not assumed)
4. ✅ Confirmation of field names

---

**STATUS**: BLOCKED - Need to locate actual data sources before implementing tabs.

**RECOMMENDATION**: User should provide:
1. Sample executive brief API response
2. Sample diagnostic API response
3. Confirmation of where this data lives in the backend
