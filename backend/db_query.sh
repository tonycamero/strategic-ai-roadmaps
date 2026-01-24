#!/bin/bash
export $(grep -v '^#' .env | xargs)
psql "$DATABASE_URL" -c "SELECT last_diagnostic_id FROM tenants WHERE id = '883a5307-6354-49ad-b8e3-765ff64dc1af';"
