#!/bin/bash
export $(grep -v '^#' .env | xargs)
echo "--- Northshore Statistics (Hardened) ---"
psql "$DATABASE_URL" -P pager=off -c "SELECT status, moderation_status, count(*) FROM sop_tickets WHERE tenant_id = '883a5307-6354-49ad-b8e3-765ff64dc1af' AND pain_source IS NOT NULL AND status NOT IN ('archived', 'invalid') GROUP BY status, moderation_status;"
