# AG EXECUTION TICKET

## ID
EXEC-BRIEF-GOVERNANCE-REALIGN-004

## TITLE
Unify Executive Brief Approval, Regeneration, and Delivery Under a Single Governance Model

## OBJECTIVE
Fix the current state drift between **Approval**, **Regeneration**, and **Delivery** of Executive Briefs by enforcing a single, coherent governance model.

After this ticket:
- Regeneration (including `force=true`) will not silently invalidate approval
- Email and download delivery will correctly honor approved briefs
- UI state (APPROVED / DELIVERED) will match backend enforcement
- Executive Briefs will no longer enter contradictory or ambiguous lifecycle states

---

## PROBLEM STATEMENT

The system currently exhibits **governance fragmentation**:

1. **Approval is artifact-instance scoped**, not logically scoped  
   - Approval appears to be tied to a specific `executive_briefs` row or render instance
   - Regeneration creates a new synthesis path that breaks approval checks

2. **Delivery checks the wrong authority**
   - Email delivery enforces `APPROVED` at the artifact level
   - UI derives approval from historical data or audit events
   - Result: UI shows APPROVED / DELIVERED, backend rejects delivery

3. **Regeneration introduces an implicit third state**
   - `force=true` regeneration does not:
     - Reattach approval
     - Explicitly invalidate approval
   - This creates a “Schrödinger brief”: approved but undeliverable

4. **RAW vs EXECUTIVE mode leakage**
   - DIAGNOSTIC_RAW content is rendered inside EXECUTIVE delivery surfaces
   - Approval and delivery logic is blind to `briefMode`

---

## DESIGN PRINCIPLE (MANDATORY)

> **Approval is a governance event over a logical brief, not a render instance.**

PDFs, regenerations, and delivery artifacts are **representations**, not authorities.

---

## REQUIRED CHANGES

### 1. Canonicalize Executive Brief Governance Model

Define the following invariants:

- Approval applies to:
  - `(tenant_id, brief_type = EXECUTIVE_BRIEF)`
  - NOT to a specific PDF file or render timestamp
- Regeneration does **not** invalidate approval unless explicitly flagged

### 2. Backend: Approval Authority Resolution

Update approval checks in **all delivery paths** to use:

**Source of truth (in order):**
1. Latest `EXECUTIVE_BRIEF_APPROVED` audit event for tenant
2. Fallback: `approvedAt` on the brief record (legacy support)

Delivery MUST NOT fail solely because:
- The brief was regenerated
- The file was re-rendered
- The briefMode changed from RAW → EXECUTIVE_SYNTHESIS

### 3. Backend: Regeneration Semantics

Update `generateExecutiveBrief` behavior:

- `force=true` (SuperAdmin only):
  - Regenerates synthesis
  - Preserves approval by default
  - Updates `lastGeneratedAt`
  - MUST NOT clear approval state

Optional (future-proofing):
- If regen materially changes inputs, mark:
  - `approvalStale = true`
  - But do NOT block delivery unless enforced explicitly

### 4. Backend: Delivery Guard Fix

In:
- `generateAndDeliverPrivateBriefPDF`
- `downloadExecutiveBrief`

Replace current guard logic:

❌ `if brief.status !== APPROVED → block`

✅ New rule:
- Allow delivery if:
  - Approval event exists for logical brief
- Block delivery ONLY if:
  - Approval was explicitly revoked
  - Or brief governance state is INVALID

### 5. UI State Alignment

Ensure UI badges reflect **governance truth**, not render state:

- APPROVED → driven by approval authority
- DELIVERED → driven by delivery audit event
- REGEN does NOT change either badge

If approval is stale or missing:
- Surface explicit banner:
  > “Approval required before delivery”

No silent failures.

### 6. Mode Awareness (Critical Safety Fix)

- Executive Brief UI must respect `briefMode`
- DIAGNOSTIC_RAW content must not appear under EXECUTIVE delivery framing
- If RAW content exists:
  - Either block delivery
  - Or auto-regenerate EXECUTIVE_SYNTHESIS transiently (SA only)

---

## FILES EXPECTED TO CHANGE

- `backend/src/controllers/executiveBrief.controller.ts`
- `backend/src/services/executiveBriefDelivery.ts`
- `backend/src/services/narrativeAssembly.service.ts` (approval awareness only)
- `backend/src/db/schema.ts` (if approval flags are normalized)
- `frontend/src/components/SuperAdmin/...` (badge + banner alignment)

---

## ACCEPTANCE CRITERIA

- ✅ Regen (`force=true`) does NOT break delivery
- ✅ Approved briefs can always be emailed and downloaded
- ✅ UI and backend agree on APPROVED vs DELIVERED
- ✅ No RAW narrative is delivered as an Executive artifact
- ✅ No “Brief must be APPROVED” errors when approval exists

---

## NON-GOALS

- No redesign of Diagnostic or Roadmap flows
- No PDF visual changes
- No removal of governance gates — only realignment

---

## RISK LEVEL
Medium — governance logic refactor. Must be fail-closed where ambiguous.

---

## AUTHORITY
SuperAdmin only. No tenant-facing changes.

---

## STATUS
READY FOR EXECUTION
