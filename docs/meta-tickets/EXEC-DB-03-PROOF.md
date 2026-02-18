META-TICKET v2

ID: EXEC-DB-03-PROOF
TITLE: Produce Proof for email_status Migration + Unblock Diagnostics (No UI)

MISSION
Generate hard proof that Neon schema + drizzle migrations are aligned for intake_clarifications email_status,
and confirm diagnostic generation no longer fails due to missing column.

SCOPE
- Read-only verification via SQL queries (psql) against Neon
- API retest via curl (no UI)
- Output a single PROOF blob for docs/meta-tickets/DB-DRIFT-RECONCILIATION-01.md
- Do NOT modify schema, do NOT run migrations, do NOT edit fixtures

INPUTS REQUIRED (MUST NOT ASK USER AGAIN)
- Use existing DATABASE_URL / Neon connection string from backend environment (.env / .env.local / Netlify vars)
- Use existing SUPERADMIN_JWT already used in prior curls
- Tenant to retest: ec32ea41-d056-462d-8321-c2876c9af263

STEPS

1) Locate Neon DB URL
- In repo: ~/code/Strategic_AI_Roadmaps/backend
- Resolve DB URL from environment (prefer process env, else .env/.env.local).
- Print ONLY host/dbname (redact user/password).

2) Run SQL proof checks (psql)
Execute these queries and capture outputs:

A) Columns + defaults
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema='public'
  and table_name='intake_clarifications'
  and column_name in ('email_status','email_error','last_email_attempt_at')
order by column_name;

B) Migration count
select count(*) as applied_migrations
from drizzle.__drizzle_migrations;

C) Latest migrations
select id, hash, created_at
from drizzle.__drizzle_migrations
order by created_at desc
limit 10;

D) Orphan hash presence (DO NOT TOUCH)
select id, hash, created_at
from drizzle.__drizzle_migrations
where hash = '6cec6782aaf9057166ccb08a58ef9b80d73f31313388e5223707008c0bd35984';

E) Our 0004 timestamp row
select id, hash, created_at
from drizzle.__drizzle_migrations
where created_at = 1770062800001
order by id desc;

3) API retest: Generate diagnostics
- Use curl with SUPERADMIN_JWT to hit:
  POST /api/superadmin/firms/ec32ea41-d056-462d-8321-c2876c9af263/generate-diagnostics
- Capture full JSON response + HTTP status.

4) Determine outcome
PASS if:
- SQL shows the 3 columns exist
- API response does NOT include "column \"email_status\" does not exist"
(If API returns GATE_LOCKED for a real gate, that is not a failure for this ticket — record it.)

5) Persist proof
Append a PROOF section to:
docs/meta-tickets/DB-DRIFT-RECONCILIATION-01.md

PROOF must include:
- DB host/dbname (redacted)
- Query A output
- applied_migrations number
- top 5 latest migrations rows
- orphan hash row (found/not found)
- 1770062800001 row (found/not found)
- curl command (with token redacted) + HTTP status + JSON response
- Final verdict: PASS/FAIL (with reason)

ACCEPTANCE CRITERIA
- Proof appended to meta ticket file
- No schema writes performed
- Verdict stated clearly

STOP AFTER COMPLETION.
NO follow-up questions.
