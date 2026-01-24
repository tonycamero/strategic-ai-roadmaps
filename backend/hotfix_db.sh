#!/bin/bash
export DB_URL="postgresql://neondb_owner:npg_5zJucGskB4QI@ep-lively-paper-a4yb6gco-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
psql "$DB_URL" <<EOF
ALTER TABLE sop_tickets ADD COLUMN IF NOT EXISTS status varchar(20) NOT NULL DEFAULT 'generated';
ALTER TABLE discovery_call_notes ADD COLUMN IF NOT EXISTS status varchar(20) NOT NULL DEFAULT 'draft';
EOF
