META-TICKET v2 — DB-DRIFT-RECONCILIATION-01
STATUS: PRE-EMPT (DO NOT EXECUTE YET)

TITLE
Drizzle ↔ Neon Schema Drift Reconciliation (Intake Clarifications + Migration Integrity)

CONTEXT
We identified runtime failure caused by schema drift between:
- Drizzle schema.ts
- Local drizzle migration files
- Neon production database (__drizzle_migrations table)

Manual column patch was applied for:
  intake_clarifications.email_status
  intake_clarifications.email_error
  intake_clarifications.last_email_attempt_at

This fix is not yet codified as a canonical migration.

Additionally:
Neon shows 5 applied migrations.
Local drizzle folder contains 0000–0003 only.
Neon contains hash:
  6cec6782aaf9057166ccb08a58ef9b80d73f31313388e5223707008c0bd35984
which is not represented in the local drizzle directory.

This is schema drift.

We must reconcile without destabilizing Ninkasi or existing tenants.

---

OBJECTIVES

1) Identify exact drift between:
   - Neon drizzle.__drizzle_migrations
   - backend/drizzle/*.sql
   - schema.ts current definitions

2) Codify manual fixes as idempotent migration.

3) Ensure migration execution pipeline works cleanly against Neon.

4) Prevent future silent drift.

---

EXECUTION PHASES (HIGH-LEVEL ONLY — NO ACTION YET)

EXEC-DB-01 — Migration State Audit
- Map all entries in Neon __drizzle_migrations
- Map all local drizzle migration tags
- Identify orphan hash (6cec6782…)
- Determine if missing file or legacy artifact
- Produce drift report

EXEC-DB-02 — Canonical Migration Creation
- Create new migration:
  0004_add_email_status_to_intake_clarifications.sql
- Use:
  ALTER TABLE ... ADD COLUMN IF NOT EXISTS
- Include defaults + NOT NULL constraints
- Ensure migration is idempotent

EXEC-DB-03 — Controlled Migration Run
- Execute canonical drizzle migrate command
- Confirm applied_migrations increments properly
- Verify:
  intake_clarifications.email_status exists
  intake_clarifications.email_error exists
  intake_clarifications.last_email_attempt_at exists
- Re-test:
  generateDiagnostics endpoint
  clarification pipeline UI
  gate.service execution

EXEC-DB-04 — Drift Guardrail
Implement one of:
  A) CI schema drift detection
  B) Startup-time migration parity check
  C) Fail-closed staging guard if migration tags mismatch

Must ensure:
Future schema.ts changes cannot reach runtime without matching migration file.

---

NON-GOALS
- No business logic changes.
- No modification to Ninkasi tenant data.
- No fixture rewriting.
- No Stage 6 slug changes.

---

ACCEPTANCE CRITERIA
- Neon and local migration journal aligned.
- No runtime DB column errors.
- Diagnostics generation fully functional.
- Migration pipeline verified reproducible.
- No impact to Ninkasi artifacts.

---

READY STATE
System stable but drift exists.
Execution requires controlled migration pass.
Awaiting EXEC authorization.

## PROOF — EXEC-DB-03 (20260214T020129Z)

- DB: ep-lively-paper-a4yb6gco-pooler.us-east-1.aws.neon.tech/neondb (credentials redacted)
- SQL proof output: EXEC-DB-03-PROOF-20260214T020129Z.sql.out
- API proof output: SKIPPED (no SUPERADMIN_JWT)
- API_BASE: https://api.strategicai.app
- TENANT_ID: ec32ea41-d056-462d-8321-c2876c9af263

### SQL OUTPUT (verbatim)
```
Pager usage is off.
Output format is aligned.
Border style is 2.
--- A) Columns + defaults ---
+-----------------------+-----------------------------+-------------+-------------------------------+
|      column_name      |          data_type          | is_nullable |        column_default         |
+-----------------------+-----------------------------+-------------+-------------------------------+
| email_error           | text                        | YES         |                               |
| email_status          | character varying           | NO          | 'NOT_SENT'::character varying |
| last_email_attempt_at | timestamp without time zone | YES         |                               |
+-----------------------+-----------------------------+-------------+-------------------------------+
(3 rows)

--- B) Migration count ---
+--------------------+
| applied_migrations |
+--------------------+
|                  6 |
+--------------------+
(1 row)

--- C) Latest migrations (10) ---
+----+------------------------------------------------------------------+---------------+
| id |                               hash                               |  created_at   |
+----+------------------------------------------------------------------+---------------+
| 14 | 05bca9603301223c6ea5a77402b271803890b368d3c3dca4a2533d49f3078221 | 1770062800001 |
| 13 | 8b50b1aa0110e11ed7618e13da4a3741b841d5fc72e34b114859461b3cd524c3 | 1770062800000 |
| 12 | 63e60bf8d69e5cd5f5ec66f8f4bd33515844ccfddbe0e8a15f75802b4425f678 | 1770062364476 |
| 11 | fb5da583cb00f5bb9d83b93037155fa2aa280706b97f90b5fc6548d9825076a1 | 1768508868784 |
| 10 | b0666b9f9feb307074e9a39e7b73865980d8814f1a1f8d0d07405d7f9571efb1 | 1768351289154 |
|  1 | 6cec6782aaf9057166ccb08a58ef9b80d73f31313388e5223707008c0bd35984 | 1764195174560 |
+----+------------------------------------------------------------------+---------------+
(6 rows)

--- D) Orphan hash presence (DO NOT TOUCH) ---
+----+------------------------------------------------------------------+---------------+
| id |                               hash                               |  created_at   |
+----+------------------------------------------------------------------+---------------+
|  1 | 6cec6782aaf9057166ccb08a58ef9b80d73f31313388e5223707008c0bd35984 | 1764195174560 |
+----+------------------------------------------------------------------+---------------+
(1 row)

--- E) Our 0004 timestamp row ---
+----+------------------------------------------------------------------+---------------+
| id |                               hash                               |  created_at   |
+----+------------------------------------------------------------------+---------------+
| 14 | 05bca9603301223c6ea5a77402b271803890b368d3c3dca4a2533d49f3078221 | 1770062800001 |
+----+------------------------------------------------------------------+---------------+
(1 row)

```

### VERDICT
- PARTIAL — SQL verification passed. API test skipped (no SUPERADMIN_JWT).

## EXEC-DB-04 — DRIFT GUARDRAIL (COMPLETED)

### Overview
A deterministic guardrail system has been implemented to prevent schema drift between Drizzle and the Neon database from reaching production.

### How Drift Check Works
The drift check (`backend/src/db/driftGuard.ts`) performs the following steps on every startup and in CI:
1.  **Read Local Journal**: Parses `drizzle/meta/_journal.json` to count the number of local migration files.
2.  **Query DB Ledger**: Fetches row count and hashes from `drizzle.__drizzle_migrations`.
3.  **Validate Alignment**:
    *   **Missing Migrations**: If `dbCount < localCount`, the check fails.
    *   **Unknown Migrations**: If `dbCount > localCount`, every "extra" hash must exist in the `ALLOWED_ORPHAN_HASHES` allowlist.
    *   **Fail-Closed**: If the check fails in `NODE_ENV=production`, the server process will exit with a fatal error.

### CLI Usage
To run the check manually:
```bash
pnpm db:driftcheck
```

### How to add an Allowlist Entry
If a migration hash exists in the database that is not represented in the local codebase (orphan) and it is verified as safe:
1.  Locate the hash in Neon (`drizzle.__drizzle_migrations` table).
2.  Add the hash string to `ALLOWED_ORPHAN_HASHES` in `backend/src/db/driftAllowlist.ts`.
*This should be practiced with extreme caution and only for approved legacy precursors.*

### Verification Proof
- **Unit Tests**: `src/db/tests/driftGuard.test.ts` covers PASS/FAIL scenarios including allowlisted orphans.
- **Production State**: Verified against current Neon (dbCount=6, localCount=5, allowlistedCount=1) → **RESULT: PASS**.
