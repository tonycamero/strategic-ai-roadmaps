META-TICKET v2

ID: EXEC-DB-03
TITLE: Run Controlled Drizzle Migration on Neon + Verify Diagnostics Unblocked

MISSION
Execute the newly codified migration 0004 on the Neon database and verify:
1) columns exist as expected
2) drizzle.__drizzle_migrations reflects the run (or safely no-ops)
3) diagnostics generation no longer crashes/gates due to missing email_status

SCOPE
- Run canonical migrate command from backend repo
- Verify DB schema + migration state in Neon SQL Editor
- Re-run diagnostic generation for the affected tenant(s)
- Capture proof outputs (queries + results)

CONSTRAINTS
- No additional schema edits (no manual ALTERs) unless migration run fails.
- If migrate fails due to orphan hash or journal mismatch, STOP and report exact error.
- Do not touch/delete/modify drizzle.__drizzle_migrations rows.
- Do not change fixtures, tickets, or Stage 6 logic in this ticket.

STEPS (DO EXACTLY)

A) Locate canonical migrate command (do not guess)
1) cd ~/code/Strategic_AI_Roadmaps/backend
2) cat package.json | rg -n "\"scripts\"|drizzle|migrate"

B) Run migrate (choose the script you find)
- If scripts include db:migrate / drizzle:migrate / migrate → run that exact script.
- Else fallback:
  pnpm exec drizzle-kit migrate

C) Verify in Neon (SQL Editor)
Run:

1) Column existence + defaults
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema='public'
  and table_name='intake_clarifications'
  and column_name in ('email_status','email_error','last_email_attempt_at')
order by column_name;

2) Migration count
select count(*) as applied_migrations
from drizzle.__drizzle_migrations;

3) Latest rows
select id, hash, created_at
from drizzle.__drizzle_migrations
order by created_at desc
limit 5;

D) Re-test the failing flow
1) Attempt "Generate Diagnostics" for Cascade Climate Solutions (tenant: ec32ea41-d056-462d-8321-c2876c9af263)
2) Confirm:
- No "column email_status does not exist"
- No GATE_LOCKED due to query crash
(If still GATE_LOCKED for legitimate gating truth, that is acceptable — report it.)

OUTPUT REQUIREMENTS
Return:
- MIGRATE_COMMAND_USED
- MIGRATE_RESULT (success / no-op / failure + error)
- SQL_VERIFICATION_RESULTS (columns + count + latest rows)
- DIAGNOSTICS_RETEST_RESULT (pass/fail + exact error if fail)

ACCEPTANCE CRITERIA
- Migration executed successfully OR no-oped cleanly.
- Neon confirms columns exist with correct types/default.
- Diagnostics generation no longer errors on missing email_status.

STOP AFTER COMPLETION.
Do not proceed to guardrails (EXEC-DB-04) until explicitly authorized.
