# META-TICKET v2: META-SAR-HOMEPAGE-RENDER-001

## Goal
Rewrite and render the **StrategicAI.app homepage** according to the provided **Render Intent Spec (V2)**, replacing the existing public marketing surface while preserving all platform and application invariants.

This ticket governs **presentation-layer implementation only**.

---

## Critical Constraints (Non-Negotiable)

- MUST treat the provided Render Intent Spec (V2) as **authoritative layout + copy guidance**.
- MUST NOT invent new sections, personas, CTAs, or narratives beyond the spec.
- MUST NOT modify backend, auth, intake, database, or application logic.
- MUST NOT refactor shared packages, services, or domain logic.
- MUST NOT upgrade dependencies or change build tooling.
- MUST NOT delete large blocks of unrelated code; changes must be **surgical and scoped**.

- MUST store THIS META-TICKET in:
  - `docs/meta-tickets/META-SAR-HOMEPAGE-RENDER-001.md`

- MUST open a PR for review (no direct merges).

---

## Scope (Explicit)

**IN SCOPE**
- Homepage layout and structure
- Homepage copy implementation
- Navigation / footer updates required to support homepage CTAs
- Metadata (title, description, OG tags) for homepage only
- Styling adjustments required to render sections as specified

**OUT OF SCOPE**
- Other marketing pages (unless explicitly required for link integrity)
- Application routes (/app, /login, /intake, etc.)
- Content strategy, copywriting, or positioning changes
- A/B testing, SEO optimization, or conversion experiments

---

## Authoritative Input
- “StrategicAI.app Homepage — Render Intent Spec (V2)” (provided verbatim)

This spec defines:
- Section order
- Section purpose
- Headings and copy (exact or near-exact)
- CTA labels and hierarchy
- Intended visual emphasis

Deviation requires explicit approval.

---

## Execution Plan

### Phase A — Read-Only Alignment
- Confirm current homepage route and file(s).
- Confirm how CTAs map to existing routes (e.g. Launch App, Demo, Apply).
- Document any unavoidable mismatches in PR description **before coding**.

### Phase B — Homepage Implementation
Implement the following sections in order, matching the Render Intent Spec:

1. Hero Section
2. Problem Section
3. Platform Section
4. Audience Section
5. System Snapshot
6. Outcome Section
7. Final CTA Block
8. “What This Is / Isn’t” Section

- Preserve semantic hierarchy (H1/H2/H3).
- Ensure CTA labels match spec exactly.
- Ensure no TonyCamero personal branding appears.

### Phase C — Invariant Verification
- Confirm build passes.
- Confirm no protected routes are exposed.
- Confirm application routes still function.
- Confirm no shared/domain logic was touched.

---

## Deliverables

1. Updated homepage rendered per Render Intent Spec (V2)
2. Clean PR including:
   - Summary of changes
   - Confirmation of invariants preserved
   - List of CTAs and their target routes
3. Screenshots or checklist confirming section completion

---

## Acceptance Criteria

- Homepage visually and structurally reflects Render Intent Spec (V2)
- Copy matches spec intent without embellishment
- Platform functionality unchanged
- No scope creep beyond homepage
- META-TICKET persisted to `docs/meta-tickets/`

---

## Stop Conditions

- If implementing the spec requires backend changes, routing refactors, or domain-logic edits:
  - STOP
  - REPORT the conflict
  - DO NOT proceed

---

## Rollback Plan

- Revert PR
- Restore previous homepage
- No domain or deployment changes required
