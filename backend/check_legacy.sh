#!/bin/bash
export $(grep -v '^#' .env | xargs)
psql "$DATABASE_URL" -P pager=off -c "SELECT ticket_id, title, pain_source, status FROM sop_tickets WHERE ticket_id LIKE 'T-undefined%' LIMIT 5;"
