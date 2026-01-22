-- Fix: Set isInternal flag for tony@scend.cash
-- This user should be marked as internal since they have exec_sponsor role

UPDATE users
SET is_internal = true
WHERE email = 'tony@scend.cash';

-- Verify the change
SELECT id, email, role, is_internal, tenant_id
FROM users
WHERE email = 'tony@scend.cash';
