# EXEC-BRIEF-UI-ACCEPTANCE-005: Frontend Implementation Guide

**Status**: Backend Complete - Ready for Frontend Implementation  
**Priority**: HIGH - Blocking UI Acceptance  
**Estimated Time**: 2-3 hours

---

## 🎯 Objective

Fix the global "BLOCKED: BACKEND ERROR" issue when Executive Brief actions fail. Make errors **local** to the brief panel/modal, not page-killing.

---

## ✅ Backend Complete (What You Have)

1. **Request ID Middleware** - Every request now gets `x-request-id` header
2. **Structured Error Payloads** - All brief errors return consistent shape:
   ```typescript
   {
     error: "EXEC_BRIEF_INSUFFICIENT_SIGNAL",
     code: "INSUFFICIENT_SIGNAL",
     stage: "ASSERTION_SYNTHESIS",
     message: "Insufficient signal to regenerate Executive Brief. Need at least 3 valid assertions.",
     requestId: "abc123-def456",
     tenantId: "tenant_xyz",
     briefId: "brief_123",
     details: { assertionCount: 2, minRequired: 3 }
   }
   ```
3. **HTTP 422 for INSUFFICIENT_SIGNAL** - Not 400, so you can distinguish operator issues from system faults

---

## 🔧 Frontend Work Required

### **Step 1: Update Global Error Gate** (15 min)

**File**: `frontend/src/pages/superadmin/SuperAdminControlPlaneFirmDetailPage.tsx` (or wherever the global error gate lives)

**Current Problem**: Any 4xx/5xx from brief actions triggers page-level "BLOCKED: BACKEND ERROR"

**Fix**:
```typescript
// BEFORE (current - blocks everything)
if (error.status >= 400) {
  setGlobalBlocked(true);
}

// AFTER (only block on bootstrap/critical failures)
const isCriticalFailure = (error) => {
  // Only block page if we can't load core data
  if (error.endpoint?.includes('/truth-probe') || error.endpoint?.includes('/execution')) {
    return true; // Can't render page without this
  }
  if (error.status === 401 || error.status === 403) {
    return true; // Auth failure
  }
  if (!error.code || error.code === 'UNKNOWN_ERROR') {
    return true; // Unstructured error (system fault)
  }
  return false; // All other errors are local/recoverable
};

if (isCriticalFailure(error)) {
  setGlobalBlocked(true);
} else {
  // Handle locally in the component that made the request
}
```

---

### **Step 2: Create Error Parser Utility** (10 min)

**File**: `frontend/src/utils/briefErrorParser.ts` (NEW)

```typescript
export interface BriefErrorPayload {
  error: string;
  code: string;
  stage?: string;
  message: string;
  requestId?: string;
  tenantId?: string;
  briefId?: string;
  violations?: Array<{
    path: string;
    rule: string;
    message: string;
    severity: string;
  }>;
  details?: Record<string, any>;
}

export function parseBriefError(
  response: Response | Error | any
): BriefErrorPayload {
  // Try to extract structured payload
  if (response?.data && typeof response.data === 'object') {
    const data = response.data;
    if (data.code && data.message) {
      return {
        error: data.error || 'EXEC_BRIEF_ERROR',
        code: data.code,
        stage: data.stage,
        message: data.message,
        requestId: data.requestId || response.headers?.['x-request-id'],
        tenantId: data.tenantId,
        briefId: data.briefId,
        violations: data.violations,
        details: data.details
      };
    }
  }

  // Fallback for unstructured errors
  return {
    error: 'EXEC_BRIEF_UNKNOWN_ERROR',
    code: 'UNKNOWN_ERROR',
    message: response?.message || 'Executive Brief action failed',
    requestId: response?.headers?.['x-request-id']
  };
}
```

---

### **Step 3: Add Inline Error UI to Brief Panel/Modal** (45 min)

**Files**: 
- `frontend/src/components/ExecutiveBriefPanel.tsx`
- `frontend/src/components/ExecutiveBriefModal.tsx`

**Add State**:
```typescript
const [lastActionError, setLastActionError] = useState<BriefErrorPayload | null>(null);
const [lastAction, setLastAction] = useState<'generate' | 'regen' | 'download' | 'deliver' | null>(null);
```

**Update Action Handlers**:
```typescript
const handleRegenerate = async () => {
  setLastActionError(null);
  setLastAction('regen');
  
  try {
    const response = await apiPost(`/api/superadmin/firms/${tenantId}/executive-brief/generate?force=true`);
    // Success - refresh brief data
    await refreshBriefData();
  } catch (error) {
    const briefError = parseBriefError(error);
    setLastActionError(briefError);
    // DO NOT close modal
    // DO NOT trigger global error gate
  }
};
```

**Add Error Banner Component**:
```tsx
{lastActionError && (
  <div className="brief-action-error-banner">
    <div className="error-header">
      <span className="error-icon">⚠️</span>
      <h4>Executive Brief action failed</h4>
    </div>
    
    <div className="error-body">
      <p><strong>{lastActionError.code}</strong>: {lastActionError.message}</p>
      
      {lastActionError.details && (
        <div className="error-details">
          {lastActionError.code === 'INSUFFICIENT_SIGNAL' && (
            <p>
              Only {lastActionError.details.assertionCount} valid assertions found. 
              Minimum required is {lastActionError.details.minRequired}.
            </p>
          )}
        </div>
      )}
      
      {lastActionError.violations && lastActionError.violations.length > 0 && (
        <div className="violations">
          <p><strong>Violations:</strong></p>
          <ul>
            {lastActionError.violations.slice(0, 3).map((v, i) => (
              <li key={i}>
                <code>{v.path}</code>: {v.message}
              </li>
            ))}
          </ul>
          {lastActionError.violations.length > 3 && (
            <button onClick={() => setShowAllViolations(true)}>
              View all {lastActionError.violations.length} violations
            </button>
          )}
        </div>
      )}
    </div>
    
    <div className="error-footer">
      {lastActionError.requestId && (
        <span className="request-id">
          Request ID: <code>{lastActionError.requestId}</code>
        </span>
      )}
      <button onClick={() => setLastActionError(null)}>Dismiss</button>
    </div>
  </div>
)}
```

---

### **Step 4: Optional - Preflight Guard** (20 min)

**Goal**: Disable Regen button when you know it will fail

**If you have signal readiness data**:
```typescript
const canRegenerate = useMemo(() => {
  if (!truthProbe?.briefReadiness) return true; // Unknown, allow attempt
  return truthProbe.briefReadiness.ready;
}, [truthProbe]);

<button 
  onClick={handleRegenerate}
  disabled={!canRegenerate}
  title={!canRegenerate ? 
    "Insufficient signal to regenerate: need at least 3 valid assertions" : 
    "Regenerate Executive Brief"
  }
>
  Regenerate
</button>
```

**If you don't have readiness data**: Skip this step. The inline error handling is sufficient.

---

## 🧪 Manual Acceptance Test (10 min)

Use **Shakey's tenant** (the one that fails with `assertionCount=2`):

1. ✅ Load Execute page → page renders
2. ✅ Click Regen → confirm prompt
3. ✅ API returns 422 INSUFFICIENT_SIGNAL
4. ✅ **Page stays rendered** (no global block)
5. ✅ Brief panel shows inline error banner
6. ✅ Banner shows: code, message, assertionCount, requestId
7. ✅ Modal stays open (can still review existing brief if present)
8. ✅ Can dismiss error and try again

---

## 📋 Definition of Done

- [ ] Global error gate exempts brief action failures (422/400)
- [ ] `parseBriefError()` helper created
- [ ] Exec Brief panel/modal shows inline error banner
- [ ] Violations display (top 3 + "view all")
- [ ] Modal stays open on error
- [ ] Manual acceptance test passes on Shakey's tenant
- [ ] No "BLOCKED: BACKEND ERROR" on INSUFFICIENT_SIGNAL

---

## 🚀 What's Next After This

Once 005 frontend is complete:
1. **Test on 3 real tenants** (Shakey's + 2 others)
2. **Commit & deploy** to production
3. **Move to ticket 006** (Workflow Spine) to establish multi-artifact foundation

---

## 💡 Key Points

- **Backend is ready** - All error payloads are structured and include requestId
- **This is a UI-only fix** - No backend changes needed
- **Fail-closed is preserved** - No partial briefs, just better error UX
- **Operator can recover** - Page stays usable, they can add intake and retry

---

**Questions?** Check the backend implementation in:
- `backend/src/utils/briefErrorResponse.ts` - Error payload structure
- `backend/src/controllers/executiveBrief.controller.ts` - INSUFFICIENT_SIGNAL handling (lines 335-365)
- `docs/meta-tickets/EXEC-BRIEF-UI-ACCEPTANCE-005.md` - Full ticket spec
