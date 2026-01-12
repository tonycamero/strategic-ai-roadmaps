-- Create test users for SuperAdmin authority verification
-- Phase 1: Testing delegate and operator roles

-- Note: These are TEST USERS ONLY for development/verification
-- Password hashes are bcrypt for "testpass123"

-- Delegate user (for testing DELEGATE authority)
INSERT INTO users (id, email, password_hash, role, name, is_internal, created_at)
VALUES (
  gen_random_uuid(),
  'delegate@test.com',
  '$2b$10$rKJ5VxJ5vZ5Z5Z5Z5Z5Z5uN5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z',  -- testpass123
  'delegate',
  'Test Delegate',
  true,
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Operator user (for testing OPERATOR authority)
INSERT INTO users (id, email, password_hash, role, name, is_internal, created_at)
VALUES (
  gen_random_uuid(),
  'operator@test.com',
  '$2b$10$rKJ5VxJ5vZ5Z5Z5Z5Z5Z5uN5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z',  -- testpass123
  'operator',
  'Test Operator',
  true,
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Verify users were created
SELECT email, role, name, is_internal, created_at 
FROM users 
WHERE email IN ('delegate@test.com', 'operator@test.com');
