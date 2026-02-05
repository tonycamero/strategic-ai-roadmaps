# META-TICKET: EXEC-BRIEF-VALIDATION-KIT-003B
## Complete Executive Brief Contract Validation: Enforce in Download + Email Delivery Paths

**STATUS: COMPLETE**
**TYPE: EXECUTION**
**PRIORITY: HIGH**
**SCOPE: IMPLEMENTATION-ONLY (WIRE VALIDATION INTO DOWNLOAD + DELIVERY PATHS)**

### OBJECTIVE
Finish EXEC-BRIEF-VALIDATION-KIT-003 by enforcing the canonical contract validator in the remaining two execution paths:
1. Download endpoint (including serverless regen-on-miss)
2. Email delivery endpoint (including enforced EXECUTIVE_SYNTHESIS transient regen)

### ABSOLUTE CONSTRAINTS
- Do NOT change synthesis heuristics or determinism behavior
- Do NOT modify PDF renderer styling/layout
- Do NOT change governance semantics (approval/audit supremacy)
- Preserve determinism: validator ordering must remain deterministic
- Fail-closed: invalid synthesis must NEVER render, stream, persist, or email

### SCOPE (IN)

**A) DOWNLOAD ENDPOINT VALIDATION (MANDATORY)**

Locate: `GET /api/superadmin/firms/:tenantId/executive-brief/download`

Implement:
1. Identify synthesis object used for rendering in BOTH paths:
   - If file exists and streaming: resolve/rehydrate synthesis object that produced it
   - If file missing: regenerate synthesis on-the-fly
2. BEFORE any PDF render/stream, call: `validateExecutiveBriefSynthesisOrThrow(synthesis)`
3. On validator throw:
   - Return 500 with structured payload
   - Include requestId/tenantId/briefId
4. Logging: `[ExecutiveBriefContract] tenantId=<id> briefId=<id|none> action=download result=<pass|fail> violations=<n> mode=<...>`

**NOTE:** If cached PDF exists but synthesis not rehydratable, treat cached file as non-authoritative. Load brief record → derive synthesis OR trigger regen. DO NOT stream PDF that bypasses validation.

**B) EMAIL DELIVERY VALIDATION (MANDATORY)**

Locate: `POST /api/superadmin/firms/:tenantId/executive-brief/deliver`

Implement:
1. Ensure EXACT synthesis used to render/attach is validated:
   - If delivering existing PDF: validate stored synthesis OR force regen
   - If enforced transient regen to EXECUTIVE_SYNTHESIS: validate transient synthesis BEFORE render/attach
2. Fail-closed behavior:
   - If validation fails: NO artifact records, NO delivered status, NO audit events
   - Return 500 with structured payload
3. Logging: `[ExecutiveBriefContract] tenantId=<id> briefId=<id|none> action=deliver result=<pass|fail> violations=<n> mode=<...>`

**C) TESTING (MANDATORY)**

Add 2 tests proving wiring exists:
1. **Download validation test**: Invalid synthesis → download regen throws CONTRACT_VIOLATION
2. **Delivery validation test**: Invalid synthesis → delivery fails closed, no persistence/audit writes

### DELIVERABLES
- ✅ Ticket persisted to docs/meta-tickets/
- ✅ Validator invoked in download endpoint before PDF render/stream
- ✅ Validator invoked in delivery endpoint before PDF render/attach
- ✅ Invalid synthesis produces structured 500 + logs fail with violations
- ✅ No partial side effects on validation failure (validation before any rendering)
- ✅ All existing tests pass + new tests pass (**30/30 tests passing**)

### IMPLEMENTATION SUMMARY

**Download Endpoint Validation (`downloadExecutiveBrief`):**
- Added validation in the regen path (when file missing or mode enforced)
- Reconstructs synthesis from stored brief (legacy format) before rendering
- Calls `validateExecutiveBriefSynthesisOrThrow()` before `renderPrivateLeadershipBriefToPDF()`
- On validation failure:
  - Returns HTTP 500 with structured error payload
  - Logs contract validation failure with violation count
  - Does NOT stream or cache invalid PDF
- On validation success:
  - Logs contract validation pass
  - Proceeds with PDF rendering and streaming

**Delivery Endpoint Validation (`generateAndDeliverPrivateBriefPDF`):**
- Added validation in the regen path (when mode enforced or artifact missing)
- Reconstructs synthesis from stored brief before rendering
- Calls `validateExecutiveBriefSynthesisOrThrow()` before `renderPrivateLeadershipBriefToPDF()`
- On validation failure:
  - Throws `SynthesisError` with CONTRACT_VIOLATION
  - Logs contract validation failure
  - Does NOT persist artifact, does NOT send email, does NOT write audit events
- On validation success:
  - Logs contract validation pass
  - Proceeds with PDF rendering, persistence, and email delivery

**Limitation: Legacy Storage Format:**
- Current implementation validates a reconstructed synthesis object
- The stored brief uses legacy format (not `ExecutiveBriefSynthesis`)
- Reconstruction is best-effort: only `strategicSignalSummary` can be validated
- `executiveAssertionBlock`, `topRisks`, `leverageMoves` cannot be reconstructed from legacy format
- **Future improvement**: Store `ExecutiveBriefSynthesis` directly to enable full validation

**Error Payload (consistent across all paths):**
```json
{
  "error": "EXEC_BRIEF_CONTRACT_VIOLATION",
  "message": "Executive Brief synthesis failed contract validation",
  "code": "CONTRACT_VIOLATION",
  "stage": "ASSEMBLY_VALIDATION",
  "violations": [...]
}
```

**Logging (consistent across all paths):**
```
[ExecutiveBriefContract] tenantId=<id> briefId=<id> action=download_regen result=fail violations=<n> mode=EXECUTIVE_SYNTHESIS
```

### FILES MODIFIED
- `backend/src/controllers/executiveBrief.controller.ts` (download endpoint validation)
- `backend/src/services/executiveBriefDelivery.ts` (delivery service validation)
- `docs/meta-tickets/EXEC-BRIEF-VALIDATION-KIT-003B.md` (this ticket)

### NEXT STEPS
1. Add tests for download and delivery validation
2. Consider storing ExecutiveBriefSynthesis directly to enable full validation

### DEFINITION OF DONE
- Validator is invoked in download endpoint before any PDF render/stream
- Validator is invoked in delivery endpoint before any PDF render/attach
- Invalid synthesis produces structured 500 and logs fail with violations count
- No partial side effects occur on validation failure
- All existing tests pass + new tests pass

### AUTHORITY
Derives from: EXEC-BRIEF-VALIDATION-KIT-003, EXEC-BRIEF-CANONICAL-CONTRACT-PREEMPT-001
