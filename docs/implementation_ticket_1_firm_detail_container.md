# IMPLEMENTATION TICKET 1 — SUPERADMIN FIRM DETAIL (GREENFIELD CONTAINER)

**Parent:** META-TICKET — SUPERADMIN IMPLEMENTATION BOUNDARIES (NON-NEGOTIABLE)

**Status:** READY FOR IMPLEMENTATION

---

## OBJECTIVE

Implement the GREENFIELD SuperAdmin Firm Detail page container and its 3-zone layout exactly as defined in the approved design artifacts, with correct role-based visibility and structural gating placeholders.

**This ticket is about page STRUCTURE + VISIBILITY only.**  
**NOT feature completeness.**

---

## HARD CONSTRAINTS (NO EXCEPTIONS)

- **MUST** be a fresh page container (no refactor of existing admin pages)
- **MUST NOT** introduce new routing framework or design system
- **MUST NOT** implement Executive Brief generation logic
- **MUST NOT** implement Roadmap/Diagnostic generation logic beyond UI gating placeholders
- **MUST** enforce delegate invisibility at render-level (do not rely on CSS hidden)

---

## CANONICAL SOURCES (DESIGN-LOCKED)

Implement exactly per:
1. [SuperAdmin UX Principles](file:///\\wsl$\Ubuntu\home\tonycamero\code\Strategic_AI_Roadmaps\docs\superadmin_ux_principles.md) (delegation-safe)
2. [Firm Detail Page UX Design](file:///\\wsl$\Ubuntu\home\tonycamero\code\Strategic_AI_Roadmaps\docs\ticket_1_firm_detail_ux_design.md) — three-zone structure
3. [Executive Brief UX Contract](file:///\\wsl$\Ubuntu\home\tonycamero\code\Strategic_AI_Roadmaps\docs\ticket_2_executive_brief_ux_contract.md) — future surface + gating
4. [Design Sprint Summary](file:///\\wsl$\Ubuntu\home\tonycamero\code\Strategic_AI_Roadmaps\docs\design_sprint_summary.md)

**If anything conflicts: STOP and ask. Do not reinterpret.**

---

## SCOPE

### A) Create New Page Container: SuperAdmin > Firm Detail

- New route/path for SuperAdmin firm detail
- Minimal shell compatible with current app layout

### B) Implement 3-Zone Layout (Structural)

**Zone 1: Shared Information Zone** (visible to delegates + exec)
- Firm name and metadata
- Intake status
- Ticket moderation status
- Data completeness indicators
- Historical activity log (excludes exec-only actions)

**Zone 2: Delegate Action Zone** (visible to delegates + exec)
- Ticket moderation controls
- Intake review tools
- Readiness flagging mechanism
- Draft notes or annotations

**Zone 3: Executive Authority Zone** (EXEC ONLY; invisible to delegates)
- Executive Brief surface (placeholder)
- Diagnostic finalization trigger (placeholder)
- Roadmap generation trigger (placeholder)
- Strategic framing controls (placeholder)

### C) Implement Role-Based Visibility (Structural)

- **Executive users** see Zones 1–3
- **Delegate users** see Zones 1–2 ONLY
- Delegates must NOT see:
  - Zone 3 content
  - Empty placeholders for Zone 3
  - Disabled controls implying Zone 3 exists
  - Any links/routes/affordances into Zone 3

### D) Reserve Executive Brief Surface (Non-Functional Placeholder Allowed)

- For EXEC users only, include "Executive Brief" surface entry point per design
- Must be clearly marked internally as **FUTURE / NON-FUNCTIONAL**
- Delegate users must not see any indication the Executive Brief exists

### E) Implement Gating Placeholders (No Business Logic)

- For EXEC users, enforce UI-level gating states per design:
  - "Exec Brief Pending Review" blocks Diagnostic/Roadmap actions
  - "Exec Brief Acknowledged/Waived" unblocks (UI only)
- OK to use mock state or hardcoded flags initially
- Must be structured so backend wiring can be added later without redesign

---

## OUT OF SCOPE (EXPLICIT)

- Executive Brief content generation
- Diagnostic generation logic
- Roadmap generation logic
- Any data model changes not strictly required for visibility/gating plumbing
- Any redesign beyond what the design artifacts specify

---

## ACCEPTANCE CRITERIA (PASS/FAIL)

1. **GREENFIELD:** Firm Detail page is a new SuperAdmin surface, not a refactor
2. **3-ZONE:** Layout exists with clear zone boundaries as designed
3. **INVISIBILITY:** When logged in as Delegate:
   - Executive Authority Zone is not rendered at all (no DOM, no route, no tab)
   - No UI elements suggest executive-only actions exist
4. **EXEC VIEW:** When logged in as Executive:
   - Executive Authority Zone renders
   - Executive Brief surface is visible (even if non-functional)
   - Gating placeholder states are visible and enforce action blocking (UI-level)
5. **UX PRINCIPLES:** No violations of:
   - Authority visibility
   - Irreversibility felt
   - Delegation prepares, exec decides
   - Execution vs leadership signals never collapse

---

## TEST PLAN (MINIMUM)

- Screenshot proof: Exec vs Delegate view of same firm
- Confirm Zone 3 not present in Delegate DOM (not just hidden)
- Confirm gating blocks action affordances for Exec until acknowledged/waived (UI-level)

---

## NOTES

Executive Brief functions do NOT exist yet. This ticket must not assume otherwise.

**Placeholder behavior is acceptable.**  
**Boundary violations are not.**

---

*END TICKET*
