---
ID: META-EXEC-BRIEF-PDF-DELIVERY-001
TITLE: Executive Brief PDF Delivery as Sole Tenant Surface
OWNER: AG (Junior Dev – Obedience First)
AUTHORITY: SuperAdmin / Strategy
SCOPE: Backend + Internal UI only (NO tenant UI exposure)
---

OBJECTIVE
Implement a canonical, production-safe delivery mechanism for Executive Briefs where:
- The tenant NEVER sees the brief in-app
- The Executive Brief is delivered ONLY as a PDF
- Delivery occurs explicitly after internal approval
- Email delivery is the authoritative tenant-facing moment

NON-GOALS (HARD CONSTRAINTS)
- Do NOT expose Executive Brief routes, pages, or data to tenant portal
- Do NOT auto-send on approval
- Do NOT claim content is verbatim from intakes
- Do NOT add new strategy logic or rewrite brief language
- Do NOT change intake, synthesis, or diagnostic logic

CANONICAL FLOW (MUST MATCH)
1. Executive Brief generated (existing)
2. Executive Brief reviewed internally (existing)
3. Executive Brief APPROVED (existing)
4. Explicit action: “Deliver Executive Brief”
5. PDF rendered
6. Email sent to Tenant Owner with PDF attached
7. Delivery event recorded
8. Diagnostic stage unlocked

STATE MODEL (REQUIRED)
Introduce or enforce:
- executive_briefs.status = APPROVED | DELIVERED
- executive_briefs.delivered_at (timestamp)
- executive_briefs.delivered_to (email)

DELIVERY IS A STATE TRANSITION, NOT A DOWNLOAD

BACKEND TASKS
1. PDF Renderer
   - Implement fresh PDF renderer (pdfkit OR puppeteer)
   - Input: ExecutiveBrief aggregate (summary, constraint landscape, blind spots)
   - Output: Buffer / stream
   - Brand-safe formatting (title, sections, role attributions)
   - No tenant links embedded

2. executiveBriefDelivery.service.ts
   - Remove hard-coded throw:
     `PDF rendering disabled: no renderer available`
   - Wire renderer into:
     `renderPrivateLeadershipBriefToPDF()`
   - Guard: status must be APPROVED
   - On success: return PDF buffer

3. Delivery Endpoint (Internal Only)
   - POST /api/internal/executive-briefs/:id/deliver
   - Auth: SuperAdmin / Strategy only
   - Actions:
     a. Generate PDF
     b. Send email via Resend (PDF attachment)
     c. Persist delivery metadata
     d. Transition status → DELIVERED
     e. Emit audit log

4. Email Assembly
   - Recipient: Tenant Owner ONLY
   - Subject: “Executive Brief – Leadership Perspective”
   - Body language must:
     - Describe document as interpretive leadership lens
     - NOT claim verbatim inputs
     - NOT expose internal mechanics
   - Attachment: Executive_Brief_<Tenant>_<Date>.pdf

FRONTEND (INTERNAL UI ONLY)
1. Add button to Executive Brief panel:
   - Label: “Deliver Executive Brief”
   - Visible ONLY when status = APPROVED
2. Delivery Modal:
   - Copy:
     “This document contains interpretive leadership insights intended for executive review.
      Once delivered, it becomes the reference point for diagnostic and discovery.”
   - Actions:
     - Confirm & Send
     - Cancel
3. Disable button after delivery (status = DELIVERED)

TENANT EXPERIENCE (ENFORCED)
- Tenant has ZERO visibility to Executive Brief in portal
- Tenant receives PDF via email only
- No links back to app
- No preview, no drafts, no inline UI

DIAGNOSTIC GATING
- Diagnostic generation is blocked until:
  executive_briefs.status === DELIVERED

FILES TO TOUCH (EXPECTED)
- backend/src/services/executiveBriefDelivery.service.ts
- backend/src/services/pdf/*
- backend/src/routes/internal.routes.ts (or equivalent)
- backend/src/controllers/executiveBrief.controller.ts
- frontend/src/superadmin/components/ExecutiveBriefPanel.tsx
- frontend/src/superadmin/modals/DeliverExecutiveBriefModal.tsx

ACCEPTANCE CRITERIA
- Tenant cannot access brief via UI or API
- PDF renders successfully
- Email sends with correct attachment
- Delivery is explicit, logged, and idempotent
- Diagnostic unlocks ONLY after delivery
- No crashes if feature flag enabled

FAIL CONDITIONS
- Tenant can view brief in app
- Auto-send on approval
- Missing PDF renderer
- Email claims “verbatim input”
- Delivery not persisted

END STATE
Executive Brief is a controlled, authoritative artifact delivered intentionally as a PDF and used as the sole tenant-facing reference entering Diagnostic.
