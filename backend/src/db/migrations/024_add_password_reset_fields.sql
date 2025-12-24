-- Migration 024: Add password reset fields to users table
-- Purpose: Enable password reset functionality

ALTER TABLE users
ADD COLUMN reset_token VARCHAR(255) UNIQUE,
ADD COLUMN reset_token_expiry TIMESTAMP;

-- Index for faster token lookups
CREATE INDEX idx_users_reset_token ON users(reset_token) WHERE reset_token IS NOT NULL;
