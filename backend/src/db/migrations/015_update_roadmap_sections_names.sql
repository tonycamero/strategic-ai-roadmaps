-- Migration 015: Update roadmap_sections section_name constraint for new OS architecture
-- Changes section names to match the new roadmap generation system

-- Drop old constraint
ALTER TABLE roadmap_sections
  DROP CONSTRAINT IF EXISTS check_roadmap_sections_name;

-- Add new constraint with updated names
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
    'Metrics Dashboard',
    'Appendix'
  ));

COMMENT ON CONSTRAINT check_roadmap_sections_name ON roadmap_sections IS 'Section names for Roadmap OS (0-8)';
