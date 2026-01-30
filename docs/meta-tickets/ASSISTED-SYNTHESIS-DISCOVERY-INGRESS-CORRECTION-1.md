# META-TICKET: ASSISTED-SYNTHESIS-DISCOVERY-INGRESS-CORRECTION-1

**STATUS:** OPEN  
**PRIORITY:** ABSOLUTE  
**SCOPE:** UI / UX / WORKFLOW GOVERNANCE  
**AFFECTED STAGES:** Stage 4 (Discovery Notes), Stage 5 (Assisted Synthesis)  

## PROBLEM STATEMENT
The current Ingest Discovery Notes UI incorrectly forces the operator to pre-synthesize meaning at Stage 4, violating Canon V2.
- The UI implies that the operator must translate raw Discovery Call Q&A into structured “Current Reality / Frictions / Goals”.
- This collapses raw truth ingress and assisted meaning formation into a single step.
- This creates cognitive risk and undermines downstream trust.

## SOLUTION
Restore the correct separation between Stage 4 (Raw Capture) and Stage 5 (Assisted Reasoning).
- Refactor Stage 4 to be raw capture framing (Ingest Discovery Call Notes - RAW).
- Update Stage 4 to use a **single, long-form text field** for all transcripts and notes, removing categorized sub-fields to minimize operator friction.
- Update field semantics to explicitly label them as RAW INPUT BUCKETS with verbatim prompt helpers.
- Ensure Stage 5 (Assisted Synthesis) is the first and only place reasoning occurs using the already implemented wide modal.
- Maintain human-gated declaration of canonical findings.

## ACCEPTANCE CRITERIA
1. An operator can paste raw Q&A + notes without thinking about structure.
2. Stage 4 never produces canonical meaning.
3. Stage 5 is the first place reasoning occurs.
4. Assisted Synthesis modal receives raw notes, Q&A, diagnostic, and exec brief.
5. Canon declaration remains human-gated.
6. Operator confidence is restored.

## GOVERNANCE ALIGNMENT
Satisfies the following sections of `docs/GOVERNANCE.md`:
- **PURPOSE**: Prevents architectural drift and preserves authority/sequencing invariants.
- **CANONICAL STRUCTURES**: Relies on explicitly declared sources of truth (Canon V2).
- **NON-NEGOTIABLE INVARIANTS**: Does not advance state implicitly; preserves human-in-the-loop authority.

---
*Work subject to `docs/GOVERNANCE.md` requirements.*
