# META-TICKET: EXEC-BRIEF-ASSERTION-EXPANSION-011

## Executive Brief Mode 2 — Assertion Expansion Fallback (LLM Candidates + Deterministic Selection)

**STATUS:** READY
**TYPE:** EXECUTION
**PRIORITY:** HIGH
**SCOPE:** IMPLEMENTATION-ONLY (ASSERTION EXPANSION FALLBACK) — NO HEURISTIC DRIFT

---

## OBJECTIVE

Introduce “Mode 2 Assertion Expansion” as a strictly-caged fallback path that:
- Keeps canonical validation rules unchanged (word cap, evidence count, required fields, section caps)
- Expands the candidate pool using an LLM ONLY when Track A (deterministic synthesis) produces fewer than TARGET_ASSERTION_COUNT
- Selects final assertions deterministically via stable IDs + stable sorting + deterministic scoring
- Never blocks generation due to Mode 2 failure (fail-soft for expansion; fail-closed remains for minimum viable output)
- Preserves determinism: final persisted ExecutiveBriefSynthesis must be stable for identical inputs (no timestamps/randomness in synthesis output)

---

## ABSOLUTE CONSTRAINTS

- DO NOT change Executive Brief contract validator rules
- DO NOT change section caps or word/evidence constraints
- DO NOT change PDF renderer layout/styling
- DO NOT change governance semantics (approval supremacy, audit semantics)
- DO NOT inject timestamps/random IDs into ExecutiveBriefSynthesis outputs
- Mode 2 may add candidates; it must not loosen validity rules

---

## SPECIFICATION

### A) Add Mode 2 expansion module (Track B)
1) Create a new service: `backend/src/services/executiveBriefAssertionExpansion.service.ts`
2) Constrained prompt input from existing Facts/Patterns.
3) Parse + validate output strictly (schema + evidence integrity).

### B) Deterministic merge + selection
1) Stable signature + ID generation. `id = "asrt_" + hash(bucket + "|" + normalize(assertion) + "|" + sorted_facts).slice(0, 16)`
2) Dedup rules (DSS).
3) Evidence integrity validation (hard).
4) Guardrails (Deterministic filters).
5) Deterministic scoring + stable selection.

### C) Wire into synthesis pipeline (fallback only)
- Run Track A normally.
- If validatedAssertions.length < TARGET_ASSERTION_COUNT (4):
  - Call expansion service (Track B).
  - Merge + dedup + rank deterministically.
  - Re-run validation + selection.

### D) Telemetry + observability
- Logs under prefix: `[ExecutiveBriefExpansion]`
- Track invoked, candidates returned/accepted/rejected, final counts.

### E) Update error payload
- Include expansion metadata in `INSUFFICIENT_SIGNAL` error details.

---

## TESTING REQUIREMENTS

- Existing determinism tests remain green.
- Add unit tests for expansion logic, fail-soft, and deterministic selection.
- Mock LLM responses to ensure test determinism.

---

## DEFINITION OF DONE

- All tests pass.
- Feature flag `EXEC_BRIEF_MODE2_EXPANSION_ENABLED` implemented.
- Expansion wired as fallback only.
- Deterministic selection proven via tests.
- Ticket persisted verbatim.

---

## TICKET PERSISTENCE (MANDATORY)

Persist verbatim ticket to:
`docs/meta-tickets/EXEC-BRIEF-ASSERTION-EXPANSION-011.md`
