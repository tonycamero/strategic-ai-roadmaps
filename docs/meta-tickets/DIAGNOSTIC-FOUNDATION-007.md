# META-TICKET: DIAGNOSTIC-FOUNDATION-007
## Diagnostic Artifact Foundation: Deterministic Pipeline + Validation + Golden Fixtures

**STATUS: READY**
**TYPE: EXECUTION**
**PRIORITY: HIGH**
**SCOPE: IMPLEMENTATION-ONLY (PIPELINE SKELETON + DETERMINISM TESTS; NO PDF POLISH)**

### OBJECTIVE
Replicate the Executive Brief rigor for the Diagnostic artifact so it becomes the second reliable output:

1. Deterministic synthesis pipeline with strict role separation
2. Canonical validation module + fail-closed error surface
3. Golden fixtures + determinism tests
4. Minimal JSON storage + simple download (PDF optional later)

### ABSOLUTE CONSTRAINTS
- Copy the "Brief discipline": determinism IDs, stable sorting, contract validation, requestId error surfacing
- Do NOT implement "executive tone" here; diagnostics can remain raw/structured
- No UI redesign

### SCOPE (IN)

**A) Create `backend/src/types/diagnostic.ts`**
- Define `DiagnosticSynthesis` contract (sections, caps)

**B) Create `backend/src/services/diagnosticSynthesis.service.ts` with 4-layer roles:**
- Fact Extractor
- Pattern Synthesizer
- Diagnostic Assembler
- Validation

**C) Create determinism tests + goldens**
- Under `backend/src/__tests__/diagnosticSynthesis/`

**D) Add endpoints (superadmin)**
- Generate + download JSON (PDF later)

### DELIVERABLES
- ⏳ Ticket persisted to docs/meta-tickets/
- ⏳ Diagnostic types defined with canonical contract
- ⏳ Synthesis service with 4-layer architecture
- ⏳ Validation module with fail-closed semantics
- ⏳ Determinism tests + golden fixtures
- ⏳ SA endpoints for generate + download
- ⏳ Standard error payload + requestId integrated

### DEFINITION OF DONE
- Goldens generate and determinism tests pass
- SA can generate + download diagnostic JSON
- Standard error payload + requestId integrated
- Ticket persisted verbatim

### AUTHORITY
Derives from: EXEC-BRIEF-VALIDATION-KIT-003, EXEC-BRIEF-SYNTHESIS-DETERMINISM-002
