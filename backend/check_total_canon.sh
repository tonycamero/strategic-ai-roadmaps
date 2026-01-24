#!/bin/bash
export $(grep -v '^#' .env | xargs)
psql "$DATABASE_URL" -c "SELECT count(*) FROM sop_tickets WHERE pain_source IS NOT NULL AND status != 'archived';"
