# Executive Brief: Existing Contract Discovery

**Status**: DISCOVERY ARTIFACT
**Generated At**: Jan 30, 2026

This document contains verbatim excerpts of all artifacts defining or implying the "Executive Brief" contract within the repository. It includes design specs, code contracts, implementation logic, and UI copy.

---

## 1. Design Documentation

### `docs/ticket_2_executive_brief_ux_contract.md`
*Status: DESIGN ONLY — NO IMPLEMENTATION*

**Surface Identity**
> **Purpose:**  
> Provide strategic, leadership-level insights to the executive sponsor that are:
> - Separate from execution diagnostics
> - Not shareable with delegates
> - Required for informed decision-making before finalization
>
> **Non-Purpose:**  
> This is NOT:
> - A diagnostic summary
> - A roadmap preview
> - An execution artifact
> - A shareable report
(Lines 25-36)

**Visibility Rules**
> **Who Can See:**
> - Executive sponsor ONLY
>
> **Who CANNOT See:**
> - Delegates
> - External users
(Lines 44-49)

> **Enforcement Method:**
> - Surface does not exist in delegate view
> - Not disabled
> - Not grayed out
> - Not hinted at via empty states or placeholders
> - Completely invisible
(Lines 52-57)

**Lifecycle States**
> The Executive Brief has **FOUR** lifecycle states:
> 1. **Not Created**
> 2. **Created (Unreviewed)**
> 3. **Reviewed / Acknowledged**
> 4. **Explicitly Waived**
(Lines 85-87, 108, 133, 159)

**Gating Logic**
> The Executive Brief gates the following downstream actions:
> 1. **Diagnostic Finalization**
> 2. **Roadmap Generation**
(Lines 208-211)

**Interaction Constraints**
> **Constraint 1: Read-Only After Review**
> Once acknowledged or waived, the Brief is read-only.
(Lines 255-258)

> **Constraint 2: No Export**
> The Brief cannot be exported as PDF, CSV, or any other format.
(Lines 265-268)

> **Constraint 3: No Email or Async Sharing**
> The Brief cannot be emailed, shared via link, or delivered asynchronously.
(Lines 275-278)

> **Constraint 4: No Delegate Access (Even with Link)**
> Even if a delegate obtains a direct link or URL, the system must deny access.
(Lines 285-288)

### `docs/design_sprint_summary.md`
*Status: CANONICAL / DESIGN-LOCKED*

> **Deliverable 2: Executive Brief UX Contract**
> **Document:** [ticket_2_executive_brief_ux_contract.md](...)
(Lines 62-64)

> 1. **Role-Based Visibility Enforcement**
>    - Backend must enforce Zone 3 invisibility for delegates
>    - Frontend must not render Zone 3 for delegates
(Lines 132-134)

> 4. **Prevention of Export and Sharing**
>    - Executive Brief cannot be exported, emailed, or shared
(Lines 205-206)

### `docs/contracts/ui_mapping_v2.md`

> #### 2. Executive Brief
> - [ ] **Badge**: `DRAFT` | `GENERATED` | `REVIEWED`
> - [ ] **Primary Action**: "Review Brief" (Opens Modal)
> - [ ] **Secondary Action**: "Mark Consultation Complete" (Visible if `generated`, sets `reviewed=true`)
(Lines 14-17)

> #### 3. HIDDEN (NEVER SHOW) [In Tenant Portal]
> - [ ] Executive Brief
(Lines 66-67)

---

## 2. Code Contracts (Shared)

### `shared/src/executiveBrief.contract.ts`

**Visibility Rules**
> ```typescript
> export const VISIBILITY_RULES = {
>     SYSTEM: {
>         excludeIds: ['constraint-landscape']
>     },
>     PRIVATE: {
>         excludeIds: []
>     }
> };
> ```
(Lines 8-15)

**Section Titles**
> ```typescript
> export function getSectionTitle(id: string): string {
>     switch (id) {
>         case 'executive-summary': return "Executive Summary (For Reference Only)";
>         case 'operating-reality': return "Leadership Perception vs Operational Reality";
>         case 'alignment-signals': return "Trust & Signal Flow";
>         case 'risk-signals': return "Executive Risk Language";
>         case 'readiness-signals': return "Implementation Readiness";
>         case 'constraint-landscape': return "Awareness Gaps (Unseen or Normalized)";
>         case 'blind-spot-risks': return "Decision Latency & Risk";
>         default: return "Untitled Section";
>     }
> }
> ```
(Lines 28-39)

---

## 3. Backend Implementation

### `backend/src/services/executiveBriefDelivery.ts`

**Delivery Mechanism (Conflicts with Design Doc)**
> ```typescript
> /**
>  * Executive Brief Delivery Service
>  * 
>  * Manages the generation, persistence, and email delivery of the Executive Brief PDF.
>  * This is the ONLY way a tenant receives the brief (no UI access).
>  */
> ```
(Lines 12-16)

**Config**
> ```typescript
> // Default to true now that implementation is complete
> const ENABLE_EXEC_BRIEF_PDF_DELIVERY = true;
> ```
(Lines 61-62)

**Email Body Content**
> ```typescript
>   const emailBody = `
>         <div style="font-family: sans-serif; max-width: 600px;">
>             <h2>Executive Brief: Operational Reality & Constraints</h2>
>             <p>Attached is your confidential Executive Brief.</p>
>             
>             <p>This document synthesizes the operational perspectives collected during the intake phase. 
>             It represents an interpretive lens on your current Constraint Landscape and potential Blind Spot Risks.</p>
>             
>             <p><strong>Note:</strong> This is a point-in-time leadership artifact used to anchor the upcoming 
>             Strategic Roadmap generation. It serves as our shared reference for the diagnostic phase.</p>
> 
>             <p>Please review before our next strategy session.</p>
>         </div>
>     `;
> ```
(Lines 145-158)

### `backend/src/services/pdf/executiveBriefRenderer.ts`

**PDF Structure**
> ```typescript
>       // -- HEADER --
>       doc
>         .fillColor('#000000')
>         .font('Helvetica-Bold')
>         .fontSize(24)
>         .text('Executive Brief', { align: 'center' });
> 
>       doc
>         .text(`Leadership Perspective for ${tenantName}`, { align: 'center' });
> ```
(Lines 27-39)

> ```typescript
>       // -- EXECUTIVE SUMMARY --
>       if (synthesis.executiveSummary) {
>         addSection(doc, 'Executive Summary', synthesis.executiveSummary);
>       }
> 
>       // -- CONSTRAINT LANDSCAPE --
>       if (synthesis.constraintLandscape) {
>         doc.addPage();
>         addSection(doc, 'Constraint Landscape', synthesis.constraintLandscape);
>       }
> ```
(Lines 54-62)
*(Note: Matches fields in `executiveBrief.contract.ts`)*

---

## 4. Frontend Implementation

### `frontend/src/superadmin/components/BriefCompleteCard.tsx`

**UI Copy**
> ```typescript
>                     <div className="flex items-center gap-3 mb-1">
>                         <h3 className="text-sm font-bold text-slate-200">Executive Brief</h3>
>                         <span className="...">
>                             {status.replace(/_/g, ' ')}
>                         </span>
>                     </div>
>                     <p className="text-xs text-slate-500">Complete. Review in modal.</p>
> ```
(Lines 18-24)

> ```typescript
>             <button
>                 onClick={onReview}
>                 className="..."
>             >
>                 Review Exec Brief
>             </button>
> ```
(Lines 27-32)
