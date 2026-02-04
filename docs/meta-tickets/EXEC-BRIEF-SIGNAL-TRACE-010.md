# META-TICKET: EXEC-BRIEF-SIGNAL-TRACE-010

## Instrument Executive Brief Regen Signal Path: Stage Counts + Drop Reasons (So “Insufficient Signal” Is Explainable)

**STATUS:** COMPLETED
**TYPE:** EXECUTION
**PRIORITY:** HIGH
**SCOPE:** IMPLEMENTATION-ONLY (OBSERVABILITY + ROOT-CAUSE ISOLATION)

---

## OBJECTIVE

When regen fails with INSUFFICIENT_SIGNAL (or returns LOW_SIGNAL), operators must see exactly WHY:
- How many vectors were used
- How many facts/patterns were produced
- How many assertion candidates were generated
- How many were rejected and for what rules
So we can distinguish “not enough inputs” vs “filters too strict” vs “wrong vector selection”.

---

## ABSOLUTE CONSTRAINTS

- Do NOT change synthesis heuristics/prompts/output content
- Do NOT change PDF renderer layout/styling
- Do NOT change governance semantics
- Preserve determinism of synthesis outputs (logs can be nondeterministic; synthesis cannot)
- No UI redesign; minimal additions allowed

---

## SCOPE (IN)

### A) Add stage-count instrumentation in backend/src/services/executiveBriefSynthesis.service.ts
1) Immediately after vectors are assembled/selected:
   log: tenantId, briefId|none, action=regen, vectorCount, vectorSourceSummary
2) After fact extraction:
   log factCount
3) After pattern extraction:
   log patternCount
4) After assertion synthesis:
   log assertionCandidatesCount
5) After assertion validation/filtering:
   log validAssertionsCount
   log invalidAssertionsCount
   log invalidAssertionsBreakdown: Record<rule, count>

### B) Enrich INSUFFICIENT_SIGNAL error payload (422) in controller
When throwing/returning INSUFFICIENT_SIGNAL, include:
{
  error, code:"INSUFFICIENT_SIGNAL", stage,
  assertionCount, minRequired, targetCount,
  vectorCount, factCount, patternCount,
  invalidAssertions: { total: n, byRule: {RULE: count} }
}
No arrays of full assertions; counts only.

### C) Confirm vector selection logic is not accidentally narrow
Add one log line that prints the selector mode/filters used (no PII):
- mode (EXECUTIVE_SYNTHESIS)
- which artifact sources were included (intake, discovery, etc.)
- any “latest-only” or bucket filters

### D) FE: show enriched counts in existing error banner (optional but recommended)
If payload contains vectorCount/factCount/patternCount/byRule, render as compact diagnostics.

---

## OUT OF SCOPE

- Changing minRequired / targetCount behavior
- Altering assertion constraints
- Modifying prompts or synthesis ranking

---

## TESTING REQUIREMENTS

- Existing determinism tests remain unchanged and passing
- Add 1 unit test for error payload shape enrichment for INSUFFICIENT_SIGNAL (no golden updates)

---

## DEFINITION OF DONE

- A single regen attempt logs stage counts + breakdown
- 422 payload carries counts so operator can diagnose without backend spelunking
- No synthesis output changes; determinism suite still green

---

## TICKET PERSISTENCE (MANDATORY)

Persist verbatim ticket to:
docs/meta-tickets/EXEC-BRIEF-SIGNAL-TRACE-010.md
Execution invalid if not persisted.
