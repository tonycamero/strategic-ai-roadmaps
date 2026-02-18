-- EXEC-DB-03 VERIFICATION SCRIPT
-- Run this complete script in Neon SQL Editor

-- A) Confirm columns exist + defaults
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema='public'
  AND table_name='intake_clarifications'
  AND column_name IN ('email_status','email_error','last_email_attempt_at')
ORDER BY column_name;

-- B) Confirm migration count
SELECT COUNT(*) AS applied_migrations
FROM drizzle.__drizzle_migrations;

-- C) Show latest migration rows (confirm newest created_at)
SELECT id, hash, created_at
FROM drizzle.__drizzle_migrations
ORDER BY created_at DESC
LIMIT 10;

-- D) Find the orphan hash (should exist; DO NOT TOUCH)
SELECT id, hash, created_at
FROM drizzle.__drizzle_migrations
WHERE hash = '6cec6782aaf9057166ccb08a58ef9b80d73f31313388e5223707008c0bd35984';

-- E) Show whether our 0004 timestamp appears (expected created_at = 1770062800001)
SELECT id, hash, created_at
FROM drizzle.__drizzle_migrations
WHERE created_at = 1770062800001
ORDER BY id DESC;
