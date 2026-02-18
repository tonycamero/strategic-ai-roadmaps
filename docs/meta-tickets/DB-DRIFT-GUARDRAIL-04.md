# META-TICKET v2 — DRIFT GUARDRAIL (EXEC-DB-04)
ID: DB-DRIFT-GUARDRAIL-04
TITLE: Prevent Drizzle↔Neon Drift Regressions (CI + Startup Parity Check)

SCOPE LOCK
- Goal: make “missing column / missing migration” impossible to ship again.
- No schema redesign. No refactors outside DB drift guardrails.
- No new tables. Only read-only parity checks + CI gate + optional startup fail-closed in prod.

WHY (PROBLEM)
- We hit runtime 500s because Drizzle schema expected `intake_clarifications.email_status` but Neon did not.
- Neon shows applied_migrations=6 with an orphan hash entry (legacy precursor). Local journal previously recognized fewer.
- We need deterministic detection of:
  (1) missing migrations on DB
  (2) DB having unknown migrations not represented locally
  (3) schema mismatch likely to cause runtime crashes

ACCEPTANCE CRITERIA (HARD)
A) CI CHECK
- A command that runs in CI and FAILS if:
  - Local migration journal count/tag list != DB applied migrations (within the recognized range),
  - OR DB contains hashes not present locally (unknown/orphan) AND not explicitly allowlisted,
  - OR DB is missing the latest local migration tag/hash.
- Outputs a single concise report with:
  - local tags
  - db rows (id, hash, created_at) for last N
  - diff summary
  - verdict PASS/FAIL

B) STARTUP CHECK (FAIL-CLOSED IN PROD, WARN IN DEV)
- On API boot (or first gated request), run a parity check:
  - If NODE_ENV=production: throw fatal if FAIL
  - Else: log WARN with remediation hints
- Must be O(1): 1 query to __drizzle_migrations (limit N), no table scans.

C) ALLOWLIST MECHANISM
- A small, explicit allowlist for known “legacy/orphan” hashes (like 6cec6782…).
- Allowlist stored in repo (config file) and referenced by parity checker.
- Any new orphan must be intentionally added (no silent pass).

D) NO SECRETS / NO PII
- Logs must redact DB URL credentials.
- Never print JWTs.

IMPLEMENTATION PLAN (DETERMINISTIC)
1) Add a parity checker module
   - backend/src/db/driftGuard.ts
   - exports:
     - getLocalMigrationTags(): reads backend/drizzle/meta/_journal.json entries[].tag
     - getDbMigrations(db): select id, hash, created_at from drizzle.__drizzle_migrations order by created_at asc
     - diffMigrations(localTags, dbRows, allowlist): returns { verdict, missingOnDb, unknownOnDb, localCount, dbCount }
     - formatReport(diff): string
2) Add allowlist config
   - backend/src/db/driftAllowlist.ts
   - export const ALLOWED_ORPHAN_HASHES = new Set([ '6cec6782aaf9…' ])
3) Add CLI runner (CI)
   - backend/src/db/driftCheck.cli.ts
   - exit(1) on FAIL; exit(0) on PASS
   - Add package.json script: "db:driftcheck": "tsx src/db/driftCheck.cli.ts"
4) Add startup hook (prod fail-closed)
   - backend/src/app.ts or server bootstrap (single entry point)
   - run drift check once on boot
   - behavior:
     - production: throw on FAIL
     - dev/staging: console.warn on FAIL (optionally feature-flagged)
5) Tests
   - backend/src/db/tests/driftGuard.test.ts
   - cases:
     - PASS: dbRows match local tags
     - FAIL: missingOnDb
     - FAIL: unknownOnDb not allowlisted
     - PASS: unknownOnDb allowlisted
6) Docs
   - Append section to docs/meta-tickets/DB-DRIFT-RECONCILIATION-01.md:
     - “How drift check works”
     - “How to add allowlist entry (rare)”

EDGE CONDITIONS (IMPORTANT)
- DB count can be > local count due to legacy entries. We do NOT treat that as PASS unless all “extra” hashes are allowlisted.
- Local may contain tags DB doesn’t have: always FAIL.
- We do NOT attempt to “repair” drift automatically. Detection only.

DELIVERABLES
- New files:
  - backend/src/db/driftGuard.ts
  - backend/src/db/driftAllowlist.ts
  - backend/src/db/driftCheck.cli.ts
  - backend/src/db/tests/driftGuard.test.ts
- Modified:
  - backend/package.json (add db:driftcheck script)
  - backend server bootstrap to run guard (prod fail-closed)
  - docs/meta-tickets/DB-DRIFT-RECONCILIATION-01.md (guardrail section)

DEFINITION OF DONE
- `pnpm db:driftcheck` returns PASS on your current Neon.
- If you manually remove a column migration from Neon (or simulate by mocking dbRows), CI fails.
- No runtime endpoints can crash due to missing-column drift without being caught first.

EXECUTION MODE
- PREP ONLY until you say “EXEC DB-04”.
- After EXEC: implement exactly above, no additional scope.
