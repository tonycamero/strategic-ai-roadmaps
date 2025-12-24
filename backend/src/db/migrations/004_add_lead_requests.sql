-- Migration: Add lead_requests table for landing page cohort applications
-- Created: 2026-01-20

CREATE TABLE IF NOT EXISTS lead_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  team_size INTEGER NOT NULL,
  current_crm VARCHAR(255) NOT NULL,
  bottleneck TEXT NOT NULL,
  source VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lead_requests_email ON lead_requests(email);
CREATE INDEX idx_lead_requests_status ON lead_requests(status);
CREATE INDEX idx_lead_requests_created_at ON lead_requests(created_at DESC);
