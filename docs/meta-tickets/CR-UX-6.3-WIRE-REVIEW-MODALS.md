# META-TICKET: CR-UX-6.3

**ID**: CR-UX-6.3

**TITLE**: Wire "Review Exec Brief" + "Review Diagnostic" Modals (Data Fetch + Render + Close)

**PRIORITY**: P0

**STATUS**: ✅ RESOLVED - Both modals fully wired with tabs, fresh data fetching, and refresh on close

**OWNER**: AG (Junior Dev)

**RESOLUTION**: Implemented tabbed review modals for Executive Brief (5 synthesis sections) and Diagnostic (4 output sections). Both modals fetch fresh data from dedicated backend endpoints, display loading/error states, and trigger `refreshData()` on close.

**REPO**: Strategic_AI_Roadmaps

**SURFACE**: SuperAdmin → Execute → Firm Detail → Executive Brief card + Diagnostic card

---

## CONTEXT

- UI shows two CTA buttons:
  - "Review Exec Brief" (Executive Brief stage card)
  - "Review Diagnostic" (Diagnostic stage card)
- Buttons exist but modals are not reliably wired to real backend data + consistent close/refresh behavior
- Goal: Clicking either button opens a modal that renders the canonical artifact payload for that tenant (and/or latest diagnostic), with fail-closed UX and refresh after close where needed

---

## SCOPE (IN)

A) **Exec Brief modal**: open/close state + fetch data + render structured sections + show status + approve/waive controls (if already implemented)

B) **Diagnostic modal**: open/close state + fetch artifacts for `latestDiagnostic` + render outputs (overview, ai opps, roadmap skeleton, discovery questions) + show status + lock/publish controls visibility (read-only unless superadmin)

C) Ensure both modals work off UUIDs (`tenantId` + `latestDiagnostic.id`)

D) Ensure `refreshData()` runs after close AND after any state-changing actions inside modal

E) Zero `window.prompt` / `window.alert` inside modals; use in-modal UI

---

## SCOPE (OUT)

- No redesign of the entire page layout
- No ticket moderation modal wiring (separate ticket)
- No PDF export (future)
- No full markdown renderer overhaul (use existing)

---

## ACCEPTANCE CRITERIA (DEFINITION OF DONE)

1. ✅ Clicking "Review Exec Brief" opens a modal with:
   - Tenant name + brief status (DRAFT/REVIEWED/APPROVED/etc)
   - Rendered brief content sections (from backend)
   - Close button that returns to page without breaking scroll/state

2. ✅ Clicking "Review Diagnostic" opens a modal with:
   - Diagnostic status (generated/locked/published)
   - Rendered diagnostic artifacts (at least the 4 SOP outputs)
   - Handles "no data" gracefully (clear message)

3. ✅ Modal data comes from backend (not from cached UI-only state), and uses:
   - `tenantId` for brief
   - diagnostic UUID for diagnostic artifacts

4. ✅ Any action taken inside modal (Approve, Lock, Publish, Regen if present) triggers:
   - backend call succeeds
   - modal updates OR closes + `refreshData()`

5. ✅ No console errors, no 500s, no undefined access crashes

6. ✅ AuthorityGuard: only superadmin/executive roles can see privileged actions; delegate sees read-only

---

## FILES (TARGET)

- `frontend/src/superadmin/pages/SuperAdminControlPlaneFirmDetailPage.tsx`
- `frontend/src/superadmin/components/ExecutiveBriefModal.tsx` (or create)
- `frontend/src/superadmin/components/DiagnosticReviewModal.tsx` (or create)
- `frontend/src/superadmin/api.ts`
- Backend routes/controllers ONLY if missing endpoints (prefer to use existing)

---

## DISCOVERY (DO THIS FIRST — 10 min)

### Tasks

1. Locate the existing buttons:
   - In FirmDetailPage find "Review Exec Brief" button on Exec Brief card
   - Find "Review Diagnostic" button on Diagnostic card

2. Search for existing modal components (may already exist):
   - Search for `ExecutiveBrief` in `frontend/src/superadmin`
   - Search for `Review Diagnostic` in `frontend/src/superadmin`
   - Search for `Modal` in `frontend/src/superadmin/components`

### Discovery Results

*To be filled in during discovery phase*

---

## FRONTEND IMPLEMENTATION PLAN

### 1) Create/Confirm Modal Primitives

- If shadcn/ui is available, use Dialog; otherwise use existing modal component pattern
- Ensure:
  - controlled `open` prop
  - `onOpenChange` closes
  - overlay + escape close
  - focus trap not mandatory but preferred

### 2) Exec Brief Modal Wiring

**State in FirmDetailPage**:
```typescript
const [execBriefOpen, setExecBriefOpen] = useState(false)
const [execBriefData, setExecBriefData] = useState<ExecBriefPayload | null>(null)
const [execBriefLoading, setExecBriefLoading] = useState(false)
const [execBriefError, setExecBriefError] = useState<string | null>(null)
```

**Fetch function**:
```typescript
async function loadExecBrief() {
  setExecBriefLoading(true); 
  setExecBriefError(null);
  const payload = await superadminApi.getExecutiveBrief(params.tenantId);
  setExecBriefData(payload);
  setExecBriefLoading(false);
}
```

**Open handler**:
```typescript
onClick: () => {
  setExecBriefOpen(true);
  await loadExecBrief();
}
```

**Close handler**:
```typescript
setExecBriefOpen(false);
// optionally clear data
await refreshData(); // so stage badges update if approval occurred
```

**Render**:
- Status pill
- Sections:
  - use existing structure from backend (likely stored artifact / executive_brief table / sop_output)
  - If markdown string, render in `<pre className="whitespace-pre-wrap">` for now (safe)
  - If JSON sections, render cards per section

**Actions** (if implemented in backend):
- Approve Exec Brief → `superadminApi.approveExecutiveBrief(tenantId)`
- Waive → `superadminApi.waiveExecutiveBrief(tenantId)`
- After action: `await loadExecBrief(); await refreshData();`

### 3) Diagnostic Review Modal Wiring

**State in FirmDetailPage**:
```typescript
const [diagOpen, setDiagOpen] = useState(false)
const [diagData, setDiagData] = useState<DiagnosticArtifacts | null>(null)
const [diagLoading, setDiagLoading] = useState(false)
const [diagError, setDiagError] = useState<string | null>(null)
```

**Fetch function**:
```typescript
// Requires diagnostic UUID:
const diagId = data?.latestDiagnostic?.id
async loadDiagnostic(diagId) { 
  ... await superadminApi.getDiagnosticArtifacts(diagId) ... 
}
```

**Open handler**:
- If no `latestDiagnostic.id`: show modal with "No diagnostic generated yet"
- else open + fetch

**Render**:
- status pill: `data.latestDiagnostic.status`
- Artifacts:
  - Overview
  - AI Opportunities
  - Roadmap Skeleton
  - Discovery Questions
- If backend returns `sop_output` docs keyed by type, render each in collapsible sections
- Use pre-wrap markdown rendering for now

**Actions**:
- If diag status === 'generated': show Lock button (calls `lockDiagnostic`)
- If 'locked': show Publish button
- If 'published': show Regen (optional per current logic)
- After action: reload diag + `refreshData()`

### 4) API Layer

Add/confirm these functions exist in `frontend/src/superadmin/api.ts`:
- `getExecutiveBrief(tenantId)`
- `approveExecutiveBrief(tenantId)` (optional if backend has)
- `waiveExecutiveBrief(tenantId)` (optional)
- `getDiagnosticArtifacts(diagnosticId)` OR `getDiagnosticById(diagnosticId)` that includes artifacts
- If backend only supports tenant-based lookup, add endpoint or adjust to use `tenantId` + `lastDiagnosticId`
- Ensure routes match backend prefixes: `/api/superadmin/...`

---

## BACKEND (ONLY IF NEEDED)

If missing endpoints, add minimal read-only endpoints:
- `GET /api/superadmin/firms/:tenantId/executive-brief`
- `GET /api/superadmin/diagnostics/:diagnosticId/artifacts`

These should return already-persisted artifacts (do not regenerate).

---

## TEST PLAN

**Tenant**: `883a5307-6354-49ad-b8e3-765ff64dc1af`

1. Click Review Exec Brief → modal opens with content + status
2. Close → returns cleanly
3. Click Review Diagnostic → modal opens and shows outputs
4. Lock inside modal (confirm) → status updates + Discovery gate readiness changes only after publish
5. Publish inside modal → Discovery gate becomes READY
6. No console errors

---

## DELIVERABLES

- Working modals wired to real backend data
- PR title: "CR-UX-6.3 Wire Review Modals (Brief + Diagnostic)"
- PR body includes a short test checklist + screenshots

---

## NOTES / GOTCHAS

- Your payload currently includes `tenantSummary.executiveBriefStatus` and `latestDiagnostic`, but NOT the brief body or diagnostic artifacts. That's expected: we fetch those separately.
- Keep rendering simple: pre-wrap markdown is acceptable for v0.5; we can upgrade to a markdown renderer later.

---

**Date Created**: 2026-01-20
**Date Resolved**: TBD
