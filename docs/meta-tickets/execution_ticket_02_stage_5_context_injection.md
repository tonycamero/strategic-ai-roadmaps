# EXECUTION-TICKET-02 — STAGE 5 CONTEXT INJECTION

Scope:
- assistedSynthesisProposals.service.ts
- assistedSynthesisAgent.service.ts

Actions:
1. Load firm_baseline_intake in loadTenantContext()
2. Inject <SAR_TENANT_BASELINE> block into prompt
3. If none exists → inject NO BASELINE LOCKED marker
4. Append modeling rule instructions

Acceptance:
- Prompt log shows baseline block
- Agent references baseline metrics when present
- Agent refuses quantified modeling if baseline missing
