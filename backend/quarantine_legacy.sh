#!/bin/bash
export $(grep -v '^#' .env | xargs)
# Use pain_source as the finding provenance column found in schema
psql "$DATABASE_URL" -c "UPDATE sop_tickets SET status = 'archived', moderation_status = 'archived' WHERE pain_source IS NULL OR ticket_id LIKE 'T-undefined%' OR status = 'legacy';"
