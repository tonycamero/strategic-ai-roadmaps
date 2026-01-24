#!/bin/bash
export $(grep -v '^#' .env | xargs)
psql "$DATABASE_URL" -P pager=off -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'sop_tickets';"
