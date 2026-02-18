# EXECUTION-TICKET-03 — ECONOMIC VECTOR ARITHMETIC ENFORCEMENT

Scope:
- assistedSynthesisProposals.service.ts

Actions:
1. Extend validateProposalFields():
   - If baseline exists AND economic_vector present
     → require explicit arithmetic reference or delta logic
2. Reject generic phrases
3. Log dropped proposals (baseline mismatch)

Acceptance:
- Attempted vague economic modeling is rejected server-side
- Arithmetic linkage required when baseline present
