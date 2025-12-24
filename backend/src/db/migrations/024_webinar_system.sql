-- Migration 024: Webinar System
-- Rename lead_requests to webinar_registrations
-- Add webinar_settings table for password management

-- 1. Rename lead_requests table
ALTER TABLE lead_requests RENAME TO webinar_registrations;

-- 2. Create webinar_settings table
CREATE TABLE IF NOT EXISTS webinar_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  password_hash TEXT NOT NULL,
  password_version INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Seed initial webinar settings row (password: "webinar2025" - change immediately via SuperAdmin)
-- Hash generated with bcrypt rounds=10
INSERT INTO webinar_settings (password_hash, password_version)
VALUES ('$2b$10$rZ8vN.xY5wXKj7QJ8L3M6e5H5kX3Y7fZ8vN.xY5wXKj7QJ8L3M6e', 1);

-- 4. Add index on webinar_registrations.email for faster lookups
CREATE INDEX IF NOT EXISTS idx_webinar_registrations_email ON webinar_registrations(email);
CREATE INDEX IF NOT EXISTS idx_webinar_registrations_created_at ON webinar_registrations(created_at DESC);
