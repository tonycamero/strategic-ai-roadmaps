# META-TICKET — SUPERADMIN IMPLEMENTATION BOUNDARIES (NON-NEGOTIABLE)

**Classification:** CANONICAL / IMPLEMENTATION-GOVERNING

This ticket governs ALL implementation work related to SuperAdmin, Firm Detail, and Executive Authority surfaces.

READ THIS FIRST. NO EXCEPTIONS.

---

## HARD ARCHITECTURAL CONSTRAINT

SuperAdmin is a **CONTROL PLANE**, not an extension of existing admin UI.

Therefore:

* All SuperAdmin surfaces MUST be implemented as **GREENFIELD page containers**
* Existing admin pages MUST NOT be refactored, extended, or reused as base surfaces
* Blended refactors are explicitly **FORBIDDEN**

If a surface touches:
- Executive Authority
- Irreversible actions
- Final outputs
- Gating logic
- Executive Brief visibility

→ it **MUST** be a fresh page.

---

## WHAT "FRESH PAGE" MEANS

A fresh page means:
- New page container
- New layout contract
- New visibility logic
- New interaction affordances

A fresh page does **NOT** require:
- New routing system
- New design system
- New stack
- New component library

**Shared components MAY be reused ONLY if:**
- They are stateless
- They do not imply authority
- They do not expose hidden actions
- They do not contain conditional privilege logic

**Any component that assumes parity between users is DISALLOWED.**

---

## WHAT MUST BE RECTIFIED IN PLACE

The following are explicitly **IN-SCOPE for rectification** (not rebuild):

- Delegate-facing intake review
- Diagnostic previews
- Task moderation
- Status views
- Historical logs
- Non-authoritative admin dashboards

These may be tightened to respect UX Principles but **MUST NOT gain new authority**.

---

## EXECUTIVE BRIEF — SPECIAL CONSTRAINT

The Executive Leadership–Only Brief:

- **MUST** be implemented as an isolated surface
- **MUST NOT** reuse Diagnostic or Roadmap containers
- **MUST NOT** be visible, linkable, or inferable by delegates
- **MUST** respect the 4 lifecycle states defined in the UX Contract
- **MAY** be a no-op or placeholder initially (no generation logic required)

**LACK OF FUNCTIONALITY IS ACCEPTABLE.**  
**VIOLATION OF ISOLATION IS NOT.**

---

## DESIGN AUTHORITY

The following documents are **CANONICAL and DESIGN-LOCKED**:

1. [SuperAdmin UX Principles](file:///\\wsl$\Ubuntu\home\tonycamero\code\Strategic_AI_Roadmaps\docs\superadmin_ux_principles.md) (delegation-safe)
2. [Firm Detail Page UX Design](file:///\\wsl$\Ubuntu\home\tonycamero\code\Strategic_AI_Roadmaps\docs\ticket_1_firm_detail_ux_design.md)
3. [Executive Leadership–Only Brief UX Contract](file:///\\wsl$\Ubuntu\home\tonycamero\code\Strategic_AI_Roadmaps\docs\ticket_2_executive_brief_ux_contract.md)
4. [Design Sprint Summary](file:///\\wsl$\Ubuntu\home\tonycamero\code\Strategic_AI_Roadmaps\docs\design_sprint_summary.md)

Implementation **MUST translate** these documents.  
Reinterpretation, simplification, or "improvement" is **NOT permitted**.

---

## FAILURE CONDITIONS (AUTO-REJECT)

This ticket **MUST be rejected** if:

- Existing admin pages are reused for SuperAdmin
- Delegate users can see Executive Authority affordances
- Authority separation is enforced only via warnings or copy
- Irreversible actions feel reversible
- Executive Brief logic is collapsed into Diagnostics or Roadmaps
- Any code is written that contradicts the UX Principles

---

## SUCCESS CRITERIA

Success is defined as:

- SuperAdmin surfaces implemented as distinct control-plane pages
- Executive Authority structurally invisible to delegates
- Gating enforced by structure, not messaging
- UX invariants preserved without exception

**If there is uncertainty:**
- **STOP** and ask
- **DO NOT ASSUME**
- **DO NOT "MAKE IT WORK"**

---

## ENFORCEMENT

Any AG ticket or implementation PR that violates these boundaries will be:
- Rejected immediately
- Flagged as architectural violation
- Returned for complete redesign (not patch)

This META-TICKET supersedes convenience, velocity, and "pragmatism."

---

*END META-TICKET*
