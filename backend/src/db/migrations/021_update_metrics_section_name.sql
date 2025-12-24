-- Migration 021: Update Metrics Dashboard section name to KPIs/Metrics
-- Updates existing section names and constraint

-- Drop old constraint first
ALTER TABLE roadmap_sections
  DROP CONSTRAINT IF EXISTS check_roadmap_sections_name;

-- Update existing records that have "Metrics Dashboard" to "KPIs/Metrics"
UPDATE roadmap_sections
SET section_name = 'KPIs/Metrics'
WHERE section_name = 'Metrics Dashboard';

-- Add updated constraint with new name
ALTER TABLE roadmap_sections
  ADD CONSTRAINT check_roadmap_sections_name
  CHECK (section_name IN (
    'Summary',
    'Executive Summary',
    'Diagnostic Analysis',
    'System Architecture',
    'High-Leverage Systems',
    'Implementation Plan',
    'SOP Pack',
    'KPIs/Metrics',
    'Appendix'
  ));

COMMENT ON CONSTRAINT check_roadmap_sections_name ON roadmap_sections IS 'Section names for Roadmap OS (0-8)';
