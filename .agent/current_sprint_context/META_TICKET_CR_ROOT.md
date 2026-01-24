META-TICKET CR-ROOT — SUPERADMIN CONTROL PLANE & EXECUTIVE BRIEF IMPLEMENTATION

STATUS: ACTIVE
AUTHORITY: EXECUTIVE-SPONSORED
SCOPE LOCK: HARD

PURPOSE
This sprint series is focused on completing a production-ready SuperAdmin Control Plane that supports:
1) Lead-Defined Intake Roles
2) Executive-Only Briefing
3) Delegation-Safe Operations
4) Live Enterprise Onboarding (e.g., Ninkasi)

This is NOT an AI agent sprint.
This is NOT a discovery sprint.
This is NOT a speculative architecture exercise.

This is an IMPLEMENTATION sprint for already-designed systems.

---

PRIMARY OBJECTIVES

By the end of this sprint series, the system must support:

A) Lead-Defined Intake Roles Model
- The firm lead (Executive Sponsor) defines roles to be invited
- Roles are defined semantically (not hardcoded titles)
- Each role receives a scoped intake experience
- Lead perception vs participant reality is captured
- Intake data flows into diagnostics without collapsing authority

B) Executive Brief Mechanics
- Executive-Only surface (structurally invisible to delegates)
- Clear lifecycle states:
  NOT CREATED → DRAFT → READY FOR REVIEW → ACKNOWLEDGED / WAIVED
- Gating:
  - Diagnostics and Roadmaps are blocked until Executive Brief is resolved
- Executive Brief content is private and non-shareable
- Executive Brief is NOT a report — it is an authority artifact

C) SuperAdmin Control Plane UX (Delegation-Safe)
- Clear separation between:
  - Control Plane (authority-aware)
  - Legacy Admin (operational)
- AuthorityGuard enforced at:
  - Route level
  - Component render level
  - Data exposure level
- No executive-only signals leak to delegates
- Status surfaces always imply:
  Owner + Next Action

---

CANONICAL DESIGN SOURCES (LOCKED)

All implementation MUST align with these existing artifacts:

- SuperAdmin UX Principles (delegation-safe)
- Lead-Defined Intake Roles Model
- Executive Brief UX & Lifecycle Contract
- Control Plane Firm Detail (3-Zone model)
- Authority Layer (Role → AuthorityCategory)

If an implementation decision conflicts with any of the above:
→ STOP
→ ASK
→ DO NOT INTERPRET OR SIMPLIFY

---

HARD CONSTRAINTS (NON-NEGOTIABLE)

1. NO AGENT CODING
   - No provisioning
   - No execution
   - No task proposal systems
   - No thread logic

2. NO SCOPE EXPANSION
   - Do not “improve” product direction
   - Do not generalize systems beyond current need
   - Do not introduce new abstractions unless required by spec

3. NO LEGACY BREAKAGE
   - Existing admin pages must remain functional
   - Control Plane coexists, does not replace (yet)

4. AUTHORITY FIRST
   - Delegates prepare
   - Executives decide
   - System must fail closed on ambiguity

---

IN-SCOPE IMPLEMENTATION AREAS

- Control Plane shell & navigation
- Control Plane Firms List
- Control Plane Firm Detail v2
- Lead-Defined Intake Role configuration UX
- Intake invitation + tracking UX
- Executive Brief authoring, review, and gating mechanics
- Status surfaces and readiness indicators
- SuperAdmin UX polish for real-world enterprise use

---

OUT OF SCOPE

- AI agents or assistants
- Automated task execution
- Agent output systems
- Optimization or refactors not required for above
- Multi-tenant redesigns
- Public or end-user UX

---

SUCCESS CRITERIA

This sprint is successful when:
- A real enterprise can be onboarded end-to-end
- Executive authority is unmistakable
- Delegates cannot overstep
- Intake reflects reality, not assumptions
- Executive Brief governs downstream actions
- The system feels calm, deliberate, and trustworthy

This META-TICKET governs ALL tickets in this sprint series.

END META-TICKET CR-ROOT
