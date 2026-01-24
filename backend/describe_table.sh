#!/bin/bash
export $(grep -v '^#' .env | xargs)
psql "$DATABASE_URL" -P pager=off -c "\d sop_tickets"
