-- 001_add_multi_tenant_support.sql
-- Migration: Add Multi-Tenant Support (owner_id on users + intakes)
-- Date: 2025-01-20

-- ============================================================================
-- STEP 1: Add owner_id to USERS table (nullable first)
-- ============================================================================

ALTER TABLE users
ADD COLUMN owner_id UUID;

-- ============================================================================
-- STEP 2: Backfill owner_id for existing users
-- If you already have non-owner users and want them in the same tenant
-- as themselves, this is safe: each user becomes their own tenant.
-- If ONLY owners exist right now, this is also fine.
-- ============================================================================

UPDATE users
SET owner_id = id
WHERE owner_id IS NULL;

-- ============================================================================
-- STEP 3: Make owner_id NOT NULL and add FK + index
-- ============================================================================

ALTER TABLE users
ALTER COLUMN owner_id SET NOT NULL;

ALTER TABLE users
ADD CONSTRAINT users_owner_id_fkey
FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX idx_users_owner_id ON users(owner_id);

-- ============================================================================
-- STEP 4: Add owner_id to INTAKES table (nullable first)
-- ============================================================================

ALTER TABLE intakes
ADD COLUMN owner_id UUID;

-- ============================================================================
-- STEP 5: Backfill intakes.owner_id from users.owner_id
-- ============================================================================

UPDATE intakes i
SET owner_id = u.owner_id
FROM users u
WHERE i.user_id = u.id
  AND i.owner_id IS NULL;

-- ============================================================================
-- STEP 6: Make intakes.owner_id NOT NULL, add FK + index
-- ============================================================================

ALTER TABLE intakes
ALTER COLUMN owner_id SET NOT NULL;

ALTER TABLE intakes
ADD CONSTRAINT intakes_owner_id_fkey
FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX idx_intakes_owner_id ON intakes(owner_id);

-- ============================================================================
-- ROLLBACK (manual, if needed)
-- ============================================================================
-- DROP INDEX IF EXISTS idx_intakes_owner_id;
-- DROP INDEX IF EXISTS idx_users_owner_id;
-- ALTER TABLE intakes DROP CONSTRAINT IF EXISTS intakes_owner_id_fkey;
-- ALTER TABLE users DROP CONSTRAINT IF EXISTS users_owner_id_fkey;
-- ALTER TABLE intakes DROP COLUMN IF EXISTS owner_id;
-- ALTER TABLE users DROP COLUMN IF EXISTS owner_id;
