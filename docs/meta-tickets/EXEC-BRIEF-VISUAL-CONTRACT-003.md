# EXECUTION-TICKET: EXEC-BRIEF-VISUAL-CONTRACT-003

## 1. Metadata
- **ID**: EXEC-BRIEF-VISUAL-CONTRACT-003
- **Title**: Establish Canonical CEO-Grade Executive Brief Visual Contract (EXECUTIVE_SYNTHESIS)
- **Status**: IN_PROGRESS
- **Priority**: MEDIUM

## 2. Objective
Make the Executive Brief PDF (EXECUTIVE_SYNTHESIS) read and scan like a high-level delivery artifact for CEOs/Presidents/Founders:
- immediate orientation
- compressed decision signals
- scannable hierarchy
- consistent “executive language” and layout grammar
- deterministic section order
- minimal page count target (≤4 pages)

## 3. Scope
- **Allowed**:
  - Modify the executive synthesis PDF renderer and its layout primitives only.
  - Modify how NarrativeContext fields are mapped into the PDF.
  - Add/adjust headings, ordering, spacing, typography scale, visual separators, and executive signaling.
  - Add one “Executive Signal Summary” block.
- **Forbidden**:
  - No changes to intake, readiness, diagnostics, or auth invariants.
  - No changes to narrative assembly logic.
  - No new DB fields, migrations, or schema changes.
  - No UI changes in portal.
  - No external assets or font imports.

## 4. Canonical Section Order (LOCKED)
1) **HEADER**: “Executive Leadership Brief”, Tenant Name, Date, “CONFIDENTIAL”.
2) **ORIENTATION**: What This Is / Is Not (bullets).
3) **EXECUTIVE SIGNAL SUMMARY**: Constraint Consensus, Execution Risk, Org Clarity, Primary Bottleneck Theme.
4) **EXECUTIVE SYNTHESIS**: Interpretive paragraphs/bullets (1-page max).
5) **TOP RISKS**: Max 5, “Risk → Consequence → Early Signal”.
6) **LEVERAGE MOVES**: Max 5, “Move → Why it works → First action this week”.
7) **FOOTER**: “End of Brief”, page numbers, confidentiality.

## 5. Visual Contract (LOCKED)
- Generous margins, intentional whitespace.
- Clear heading hierarchy.
- Monochrome base with one accent line/band.
- Paginated with header/footer.

## 6. Acceptance Criteria
- PDFs for different firms share identical layout grammar.
- CEO-grade delivery artifacts, scannable in <90 seconds.
- No regressions in email delivery or download endpoints.
- Runs in Netlify serverless environment.
