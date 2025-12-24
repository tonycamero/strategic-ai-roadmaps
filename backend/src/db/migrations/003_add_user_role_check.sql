-- 003_add_user_role_check.sql
-- Add CHECK constraint to enforce valid user roles at database level
-- Date: 2025-01-20

ALTER TABLE users
ADD CONSTRAINT users_role_check
CHECK (role IN ('owner', 'ops', 'sales', 'delivery', 'staff', 'superadmin'));

-- Rollback (if needed):
-- ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
