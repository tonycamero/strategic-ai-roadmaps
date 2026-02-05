# META-TICKET v2
TITLE: Executive Brief PDF — Leadership Context v1 + page-break hardening
BRANCH: feat/pdf-leadership-context-v1-pagebreak-hardening
OWNER: Tony Camero
SYSTEMS: backend (pdf renderer + mirror narrative)

## GOAL
- Insert canonical Leadership Context v1 before Executive Summary (PDF + UI where applicable).
- Eliminate hanging/blank pages by adding deterministic pagination guardrails.
- Ensure v2.4 bans “cross-functional” and removes forced openers from PDF output.

## SCOPE
1. **COPY**: Replace Leadership Context block with canonical Leadership Context v1.
2. **PDF**: Add widow/orphan protection + remove trailing/accidental page breaks.
3. **PDF**: Add pagination instrumentation to identify the exact block causing blank pages.
4. **MIRROR**: Ensure banned jargon (“cross-functional”, “go-to-market”, etc.) is handled via LLM sentence repair tier, not deterministic mapping.
5. **QA**: Add regression tests for (a) no forced opener phrases (b) no banned jargon terms (c) PDF page count doesn’t inflate for short briefs.

## FILES TO EDIT (Targeting existing services structure)
- `backend/src/services/pdf/copy/leadershipContext.ts` (New file)
- `backend/src/services/pdf/executiveBriefRenderer.ts`
- `backend/src/services/executiveBrief/mirrorNarrative/enforcement.service.ts`
- `backend/src/services/__tests__/mirrorEnforcement.test.ts`
- `backend/src/services/pdf/__tests__/pagination.test.ts` (New file)

## IMPLEMENTATION DETAILS (from Patches)

### PATCH 1 — Leadership Context v1 canonical copy
`backend/src/services/pdf/copy/leadershipContext.ts`
```typescript
export const LEADERSHIP_CONTEXT_V1 = `
This brief reflects how the business is operating in practice, not how it appears in plans, tools, or reporting. It is grounded in intake from leadership and operating roles, and focuses on how work actually moves through the organization: where decisions are still manual, where coordination depends on experience, and where attention is being consumed day to day.

This is not a performance evaluation and it is not a set of recommendations. It is a synthesized mirror of operating reality, designed to establish shared clarity before judgment or prioritization. Some observations will feel familiar. Others may name patterns that are usually carried tacitly rather than stated directly.

Read the sections as one system, not as standalone verdicts. The value of the brief is alignment on what is true now, so the next decisions are grounded in a common understanding of how the business is actually functioning.
`.trim();
```

### PATCH 2 — Render order: Leadership Context precedes Executive Summary
`backend/src/services/pdf/executiveBriefRenderer.ts`
- Order: Leadership Context v1 -> Executive Summary.

### PATCH 3 — Pagination hardening: eliminate trailing/blank pages
- Implement `normalizeParagraphs`.
- Implement `keepWithNext`.

### PATCH 4 — Widow/orphan protection on headings + first paragraph
- Apply to `renderBlockHeading` equivalent.

### PATCH 5 — Mirror Narrative: ban hyphenated single tokens via LLM sentence repair tier
`backend/src/services/executiveBrief/mirrorNarrative/enforcement.service.ts`
- Remove "cross-functional" from `SAFE_JARGON_PHRASES`.
- Add `BANNED_JARGON_TERMS`.
- Ensure sentence repair handles these.

## ACCEPTANCE CRITERIA
- Leadership Context v1 appears immediately before Executive Summary in PDF.
- No occurrence of “On the shop floor” / “On the floor” in generated briefs.
- No blank trailing page on briefs.
- Pagination logs available.

## RUNBOOK
1. Regenerate brief for tenant ec32ea41-d056-462d-8321-c2876c9af263 with mirror enabled.
2. Generate PDF via /executive-brief/generate-pdf.
3. Validate artifacts.
4. Commit + PR.
