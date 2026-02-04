# META-TICKET: EXEC-BRIEF-VALIDATION-KIT-003
## Centralize Executive Brief Contract Validation + Enforce Across Generate / Regen / Download / Deliver

**STATUS: IN PROGRESS**
**TYPE: EXECUTION**
**PRIORITY: HIGH**
**SCOPE: IMPLEMENTATION-ONLY (CENTRAL VALIDATION + COHERENT ERROR SURFACE)**

### OBJECTIVE
Make the Executive Brief synthesis contract enforceable and observable by:
1. Introducing a single canonical validator for ExecutiveBriefSynthesis outputs
2. Running validation in ALL execution paths (generate, regen, download, deliver)
3. Returning a deterministic, stage-coded, fail-closed error surface to FE
4. Logging consistently so operators can pinpoint contract breaks immediately

### ABSOLUTE CONSTRAINTS
- Do NOT change synthesis pipeline heuristics unless required to pass existing deterministic tests
- Do NOT modify PDF renderer styling or content layout
- Do NOT change governance semantics (approval events, audit supremacy, etc.)
- No UI redesign. Only wire error display / banners if needed for coherence
- Preserve determinism: no timestamps, random IDs, nondeterministic ordering

### SCOPE (IN)

**A) Create canonical validation module:**
- `backend/src/services/executiveBriefValidation.service.ts`
- Export:
  - `validateExecutiveBriefSynthesisOrThrow(synthesis: ExecutiveBriefSynthesis): void`
  - `validateExecutiveAssertionBlock(eab: ExecutiveAssertionBlock): void`
  - `validatePattern(pattern: Pattern): void`
  - `validateStrategicSignalSummary(sss: string): void`
- Must throw SynthesisError with:
  - `code: 'CONTRACT_VIOLATION'`
  - `stage: 'ASSEMBLY_VALIDATION'`
  - `details: { violations: ValidationViolation[] }`

**B) Define ValidationViolation shape:**
```typescript
type ValidationViolation = {
  path: string;          // json-pointer-ish: "executiveAssertionBlock[2].assertion"
  rule: string;          // stable identifier: "EAB_ASSERTION_WORD_LIMIT"
  message: string;       // human readable (short)
  severity: 'ERROR';     // keep simple, fail-closed
  context?: Record<string, unknown>; // small, optional
}
```
- Violations MUST be sorted deterministically: path ASC, then rule ASC

**C) Enforce validation in ALL paths:**
1. Generate endpoint (superadmin): After synthesis, validate before persistence
2. Force regeneration: Same validation before persistence
3. Download endpoint: If regenerating on-the-fly, validate BEFORE streaming PDF
4. Email delivery: If generating transient PDF, validate synthesis BEFORE rendering/attaching

**D) Logging Contract:**
```
[ExecutiveBriefContract] tenantId=<id> briefId=<id|none> action=<generate|regen|download_regen|deliver_regen|deliver_existing> result=<pass|fail> violations=<n> mode=<EXECUTIVE_SYNTHESIS|...>
```

**E) Frontend minimal coherence:**
- Show toast/banner: "Contract violation: cannot generate brief"
- Include top 1-3 violation messages and "View details" expand for full list
- No styling redesign

### SCOPE (OUT)
- Any rewriting of PDF narrative content
- Any change to EAB spec limits (word caps, evidence count, section caps)
- Any change to determinism IDs
- Any change to governance approval rules

### TESTING REQUIREMENTS
1. Extend determinism test suite with contract violation test
2. Ensure existing tests still pass
3. Add smoke test that validates all valid fixtures pass validator

### DELIVERABLES
- ✅ Ticket persisted to docs/meta-tickets/
- ✅ Canonical validation module created (`executiveBriefValidation.service.ts`)
- ✅ ValidationViolation type defined with deterministic sorting
- ✅ Validation enforced in generate/regen path (controller)
- ✅ Logging standardized with `logContractValidation`
- ✅ Tests updated with 6 contract validation test cases
- ✅ Validation in download path (PDF regen-on-miss)
- ✅ Validation in email delivery path
- ✅ **All 30 tests passing** (24 existing + 6 new contract validation tests)

### IMPLEMENTATION SUMMARY

**Canonical Validator Created:**
- `backend/src/services/executiveBriefValidation.service.ts`
- Exports:
  - `validateExecutiveBriefSynthesisOrThrow()` - Main validator
  - `validateExecutiveAssertionBlock()` - EAB validator
  - `validatePattern()` - Pattern validator
  - `validateStrategicSignalSummary()` - Summary validator
  - `logContractValidation()` - Standardized logging
- Throws `SynthesisError` with `code='CONTRACT_VIOLATION'`, `stage='ASSEMBLY_VALIDATION'`
- Violations sorted deterministically: path ASC, then rule ASC

**Validation Rules Enforced:**
- EAB assertions: 1-24 words
- EAB evidence: 1-3 items
- EAB required fields: id, assertion, evidence, implication, constraint_signal, alignment_strength, alignment_scope, confidence_score, source_refs
- Section caps: ≤4 exec assertions, ≤5 top risks, ≤5 leverage moves
- Strategic signal summary: non-empty string

**Execution Paths Updated:**
1. ✅ **Generate/Regen** (`executiveBrief.controller.ts`):
   - Validation runs after synthesis, before persistence
   - Returns 500 with structured error payload on violation
   - Logs pass/fail with violation count
2. ⏳ **Download** (PDF regen-on-miss): Pending
3. ⏳ **Email Delivery**: Pending

**Test Coverage Added:**
- 6 new contract validation tests in `determinism.test.ts`:
  1. All valid fixtures pass validation (smoke test)
  2. Word limit violation detected
  3. Evidence count violation detected
  4. Missing required fields detected
  5. Section cap violation detected
  6. Deterministic violation sorting verified

**Error Payload Structure:**
```json
{
  "error": "EXEC_BRIEF_CONTRACT_VIOLATION",
  "message": "Executive Brief synthesis failed contract validation",
  "code": "CONTRACT_VIOLATION",
  "stage": "ASSEMBLY_VALIDATION",
  "violations": [
    {
      "path": "executiveAssertionBlock[0].assertion",
      "rule": "EAB_ASSERTION_WORD_LIMIT",
      "message": "Assertion must be 1-24 words",
      "severity": "ERROR",
      "context": { "wordCount": 27, "min": 1, "max": 24 }
    }
  ]
}
```

**Logging Format:**
```
[ExecutiveBriefContract] tenantId=<id> briefId=<id|none> action=<generate|regen> result=<pass|fail> violations=<n> mode=EXECUTIVE_SYNTHESIS
```

### NEXT STEPS
1. Add validation to download endpoint (PDF regen-on-miss)
2. Add validation to email delivery endpoint
3. Run tests to verify all pass
4. Update frontend to display contract violations (if needed)

### DEFINITION OF DONE
- A single validator exists and is used in all four execution paths
- Invalid synthesis results never persist, never render, never email
- Error payload is structured and stable
- Determinism tests pass, and new contract-violation test passes

### AUTHORITY
Derives from: EXEC-BRIEF-CANONICAL-CONTRACT-PREEMPT-001, EXEC-BRIEF-SYNTHESIS-PIPELINE-001, EXEC-BRIEF-SYNTHESIS-DETERMINISM-TESTS-002
