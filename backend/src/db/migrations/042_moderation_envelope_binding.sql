-- EXEC-TICKET-MODERATION-BINDING-001
-- Adds selection_envelope_id FK to ticket_moderation_sessions.
-- Nullable to avoid breaking existing sessions (backward-compat).
-- All new sessions created after this migration MUST populate this field.

ALTER TABLE ticket_moderation_sessions
  ADD COLUMN IF NOT EXISTS selection_envelope_id UUID
    REFERENCES selection_envelopes(id) ON DELETE RESTRICT;

-- Index for fast lookup (envelope → its sessions)
CREATE INDEX IF NOT EXISTS tms_selection_envelope_id_idx
  ON ticket_moderation_sessions (selection_envelope_id)
  WHERE selection_envelope_id IS NOT NULL;

COMMENT ON COLUMN ticket_moderation_sessions.selection_envelope_id IS
  'Binds session to a SelectionEnvelope (EXEC-TICKET-MODERATION-BINDING-001). '
  'Null for legacy sessions created before enforcement. '
  'All new sessions must populate this field — activation will reject if no envelope exists.';
