# EXECUTION-TICKET-01 — BASELINE API ACTIVATION

Scope:
- baselineIntake.controller.ts
- tenants.routes.ts

Actions:
1. Implement GET /:tenantId/baseline-intake
2. Implement POST /:tenantId/baseline-intake (upsert)
3. On POST:
   - Set baseline_locked_at
   - Set locked_by
   - Persist economic_confidence_level
4. Mirror to implementation_snapshots (label: baseline_v1_locked)

Acceptance:
- BaselineSummaryPanel loads real data
- 404 eliminated
- Snapshot row created
