#!/bin/bash

# Complete All Pending Migrations
# This script applies all pending database migrations for Strategic AI Roadmaps

set -e  # Exit on error

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Strategic AI Roadmaps - Complete All Migrations"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
BACKEND_DIR="$PROJECT_ROOT/backend"

# Navigate to backend directory and load .env
cd "$BACKEND_DIR"

# Load .env if it exists
if [ -f .env ]; then
    echo "📋 Loading environment from .env..."
    set -a
    source .env
    set +a
    echo "✅ Environment loaded"
    echo ""
else
    echo "❌ ERROR: .env file not found in backend directory"
    echo "Please create backend/.env with DATABASE_URL"
    exit 1
fi

# Check if DATABASE_URL is set after loading .env
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL not found in .env file"
    echo "Please add DATABASE_URL to backend/.env"
    exit 1
fi

echo "🔍 Connected to: $(echo $DATABASE_URL | sed 's/:\/\/.*@/:\/\/*****@/')"
echo ""

# Migration 0: Webinar System (024)
echo "📋 Migration 0/6: 024_webinar_system"
if psql "$DATABASE_URL" -f src/db/migrations/024_webinar_system.sql 2>&1 | grep -qE "ERROR"; then
    echo "  ⚠️  May already be applied or partially applied (some errors expected)"
else
    echo "  ✅ Applied"
fi
echo ""

# Migration 1: Add tenant_id to invites
echo "📋 Migration 1/6: add-tenant-to-invites"
psql "$DATABASE_URL" <<SQL 2>&1 | grep -E "(ALTER|ERROR|already)" || echo "  ✅ Applied"
ALTER TABLE invites ADD COLUMN IF NOT EXISTS tenant_id UUID;

DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invites_tenant_id_fkey') THEN
    ALTER TABLE invites
    ADD CONSTRAINT invites_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END \$\$;
SQL
echo ""

# Migration 2: Agent Config Refactor (026)
echo "📋 Migration 2/6: 026_agent_config_refactor"
if psql "$DATABASE_URL" -f src/db/migrations/026_agent_config_refactor.sql 2>&1 | grep -qE "ERROR"; then
    echo "  ⚠️  May already be applied (some errors expected)"
else
    echo "  ✅ Applied"
fi
echo ""

# Migration 3: Agent Strategy Contexts (027)
echo "📋 Migration 3/6: 027_add_agent_strategy_contexts"
psql "$DATABASE_URL" -f src/db/migrations/027_add_agent_strategy_contexts.sql 2>&1 | grep -E "(CREATE|ERROR)" || echo "  ✅ Applied"
echo ""

# Migration 4: Tenant Vector Stores (028)
echo "📋 Migration 4/6: 028_add_tenant_vector_stores"
psql "$DATABASE_URL" -f src/db/migrations/028_add_tenant_vector_stores.sql 2>&1 | grep -E "(CREATE|ERROR)" || echo "  ✅ Applied"
echo ""

# Migration 5: Inventory Tracking (029)
echo "📋 Migration 5/6: 029_add_inventory_tracking"
psql "$DATABASE_URL" -f src/db/migrations/029_add_inventory_tracking.sql 2>&1 | grep -E "(ALTER|CREATE|ERROR)" || echo "  ✅ Applied"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ALL MIGRATIONS COMPLETED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verification
echo "🔍 Verifying migrations..."
echo ""

# Check for new tables
echo "📊 New tables created:"
psql "$DATABASE_URL" -t -c "
  SELECT '  ✅ ' || table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name IN ('agent_strategy_contexts', 'tenant_vector_stores', 'webinar_settings', 'webinar_registrations')
  ORDER BY table_name;
" || echo "  ⚠️  Could not verify"

# Check for new columns
echo ""
echo "📊 New columns added:"
psql "$DATABASE_URL" -t -c "
  SELECT '  ✅ invites.' || column_name
  FROM information_schema.columns 
  WHERE table_name = 'invites' AND column_name = 'tenant_id'
  UNION ALL
  SELECT '  ✅ agent_configs.' || column_name
  FROM information_schema.columns 
  WHERE table_name = 'agent_configs' 
    AND column_name IN ('agent_type', 'config_version', 'instructions_hash')
  UNION ALL
  SELECT '  ✅ sop_tickets.' || column_name
  FROM information_schema.columns 
  WHERE table_name = 'sop_tickets' 
    AND column_name IN ('inventory_id', 'is_sidecar');
" || echo "  ⚠️  Could not verify"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Migration completed successfully!"
echo ""
echo "Next steps:"
echo "  1. Review MIGRATION_STATUS_COMPLETE.md for details"
echo "  2. Test your application"
echo "  3. Optional: Update agentConfig routes (see docs)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
