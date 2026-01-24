#!/bin/bash
export $(grep -v '^#' .env | xargs)
psql "$DATABASE_URL" -c "UPDATE sop_tickets SET status = 'generated', diagnostic_id = '2745d2de-7009-4983-9bfe-792560bc285c' WHERE tenant_id = '883a5307-6354-49ad-b8e3-765ff64dc1af' AND status = 'archived';"
