# EXEC-TICKET: FIX-INGEST-DISCOVERY-SCHEMA-VIOLATION-1

**TITLE:** Fix 400 SCHEMA_VIOLATION on /api/superadmin/firms/:tenantId/ingest-discovery (Stage 4 RAW Notes Ingestion)  
**STATUS:** OPEN  
**PRIORITY:** P0 (blocks Stage 4 → Stage 5 Assisted Synthesis)  
**OWNER:** AG (Junior Dev)  
**REQUESTOR:** Tony  

## PROBLEM STATEMENT
UI throws: "BLOCKED: BACKEND ERROR" + console shows:
`POST http://localhost:5173/api/superadmin/firms/<tenantId>/ingest-discovery 400 Error: SCHEMA_VIOLATION`
This means frontend request body does not match backend validator (zod/json schema) for ingest endpoint.

## OBJECTIVE
Make Stage 4 ingestion succeed deterministically with the new RAW modal:
- Ensure backend accepts the payload (session metadata + single raw capture field).
- Improve error reporting with structured field-level validation errors.
- Ensure the RAW artifact is retrievable and visible in Stage 5 “Source Artifacts” (RAW NOTES tab).

## IN-SCOPE CHANGES
1. Diagnose the mismatch: capture request payload vs backend schema.
2. Align FE payload keys/types to BE expectation OR update BE validator to accept the RAW payload shape (preferred).
3. Ensure RAW artifact visibility in Stage 5.
4. Add/adjust minimal verification for Stage 4 ingestion.
5. Add dev-only logging for validation failures.

## NON-NEGOTIABLE INVARIANTS
- No changes to ticket compilation, canonical findings generation, moderation logic, or roadmap assembly.
- No AI synthesis at ingestion time.
- No refactors unrelated to this endpoint.

## ACCEPTANCE CRITERIA
1. Clicking “INGEST RAW NOTES” returns 200 and unblocks the execution surface.
2. After ingest, TruthProbe / Stage status transitions to indicate Stage 4 complete and Stage 5 available.
3. Stage 5 modal shows RAW NOTES content under Source Artifacts tab.
4. Invalid payload produces 400 with explicit issues list.
5. No changes to ticket generation, canonical findings persistence, or roadmap logic.

---
*Work subject to `docs/GOVERNANCE.md` requirements.*
