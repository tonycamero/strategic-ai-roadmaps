-- Migration 016: Add sectionNumber to ticketInstances
-- Binds tickets to roadmap sections for status rollup and organization

ALTER TABLE ticket_instances
  ADD COLUMN section_number INTEGER;

-- Add index for queries by section
CREATE INDEX idx_ticket_instances_section_number
  ON ticket_instances (ticket_pack_id, section_number);

COMMENT ON COLUMN ticket_instances.section_number IS 'Links ticket to roadmap_sections.section_number (0-8)';
