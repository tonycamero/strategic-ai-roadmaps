-- Migration 025: Make tenant_id nullable in users table
-- Purpose: Allow user creation before tenant record exists (for signup flow)

ALTER TABLE users
ALTER COLUMN tenant_id DROP NOT NULL;
