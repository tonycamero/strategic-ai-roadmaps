# META-TICKET v2
ID: EXEC-BRIEF-MIRROR-NARRATIVE-SOFT-GATE-025
TYPE: META
PRIORITY: HIGH
STATUS: READY
SCOPE: LOCKED

TITLE
Convert Mirror Narrative TRIAD from hard gate to soft guide; enforce inclusive “we” voice with minimal hard constraints.

PROBLEM
Mirror Narrative regeneration is failing due to TRIAD enforcement being applied as a hard validation gate at the synthesis layer. TRIAD violations are being evaluated against narrative synthesis (not PDF rendering), causing false negatives and blocking regeneration—especially with Gemini Flash. Additionally, first-person singular (“I”) voice is eclipsing operator agency; narrative must be inclusive (“we”).

OBJECTIVE
Allow Mirror Narrative generation to succeed reliably while preserving tone safety and voice integrity. TRIAD becomes advisory (logged, not blocking). Only essential tone/safety rules remain hard gates.

DECISION
Implement Option B:
- TRIAD = soft guide only (warn, never fail)
- Keep minimal hard gates (second-person ban, jargon ban)
- Enforce inclusive first-person plural (“we/our/us”)
- Always persist Mirror Narrative even with soft violations
- Attach violation metadata for observability

HARD GATES (FAIL OR REPAIR)
1) Ban second person: “you / your”
2) Ban consulting jargon (existing BANNED_JARGON list)
3) POV enforcement: first-person plural only (“we/our/us”); avoid “I”

SOFT CONSTRAINTS (LOG ONLY)
- TRIAD sentence presence:
  - Lived Reality
  - Explicit Ruling-Out
  - Decision Framing

IMPLEMENTATION STEPS

1) VALIDATION SPLIT
Refactor mirror narrative validator into two paths:

- validateMirrorNarrativeVoiceContract(text): Violation[]
  (returns violations, does not throw)

- validateMirrorNarrativeVoiceContractOrThrow(text): void
  (legacy use only; NOT used in regen path)

2) SOFT-GATE BEHAVIOR
In `executiveBriefMirrorNarrative.service.ts`:

- Replace any `...OrThrow()` calls during regeneration
- Always allow narrative persistence
- Log violations instead of throwing

REQUIRED LOG:
[MirrorNarrative][SOFT_CONTRACT_VIOLATIONS]
Include: tenantId, briefId, violationCount, first 20 violations

3) HARD-GATE + SINGLE REPAIR PASS
Flow:
- Generate narrative
- Validate hard gates (you/your, jargon, POV)
- If hard violations exist:
  - Run ONE constrained repair pass via same LLM
  - Re-check hard gates
- If still failing:
  - Persist anyway but log hard failure (no throw unless explicitly configured)

4) POV UPDATE (CRITICAL)
Update prompt + constraints:
- Primary POV: “we / our / us”
- Ban “you / your”
- Avoid “I” entirely unless unavoidable (prefer none)

5) PERSISTENCE METADATA
When saving narrative, attach:

meta: {
  softContractViolationCount: number,
  softContractViolations: Violation[],
  softContractEnforced: false
}

6) FINAL OBSERVABILITY LOG
At end of successful generation:

[MirrorNarrative] Persisted
{
  tenantId,
  briefId,
  softContractViolationCount,
  hardGateViolationCount
}

ACCEPTANCE CRITERIA
- Executive Brief regeneration NEVER fails due to TRIAD
- Gemini Flash outputs persist successfully
- Narrative voice uses “we/our/us”, never “you/your”
- TRIAD violations appear only as warnings in logs
- PDF regeneration includes Mirror Narrative reliably

NON-GOALS
- No PDF renderer changes
- No TRIAD rule expansion
- No multi-pass stylistic optimization beyond single repair pass

RISK
LOW — Softening TRIAD removes false negatives while preserving tone safety via hard gates.

END STATE
Mirror Narrative is resilient, inclusive, insider-confidant in voice, and no longer blocks Executive Brief or PDF regeneration under model variance.
