#!/bin/bash

# Verify Migrations Applied Successfully

set -a
source backend/.env
set +a

echo "🔍 Verifying Migration Status..."
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Checking New Tables"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for new tables
psql "$DATABASE_URL" -t -c "
  SELECT 
    CASE 
      WHEN table_name = 'agent_strategy_contexts' THEN '✅ agent_strategy_contexts (Migration 027)'
      WHEN table_name = 'tenant_vector_stores' THEN '✅ tenant_vector_stores (Migration 028)'
    END as status
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name IN ('agent_strategy_contexts', 'tenant_vector_stores')
  ORDER BY table_name;
"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Checking New Columns"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check invites.tenant_id
INVITES_CHECK=$(psql "$DATABASE_URL" -t -c "
  SELECT COUNT(*) 
  FROM information_schema.columns 
  WHERE table_name = 'invites' AND column_name = 'tenant_id'
")

if [ "$INVITES_CHECK" -gt 0 ]; then
  echo "✅ invites.tenant_id (Invites Migration)"
else
  echo "❌ invites.tenant_id - NOT FOUND"
fi

# Check agent_configs columns
AGENT_TYPE=$(psql "$DATABASE_URL" -t -c "
  SELECT COUNT(*) 
  FROM information_schema.columns 
  WHERE table_name = 'agent_configs' AND column_name = 'agent_type'
")

CONFIG_VERSION=$(psql "$DATABASE_URL" -t -c "
  SELECT COUNT(*) 
  FROM information_schema.columns 
  WHERE table_name = 'agent_configs' AND column_name = 'config_version'
")

INSTRUCTIONS_HASH=$(psql "$DATABASE_URL" -t -c "
  SELECT COUNT(*) 
  FROM information_schema.columns 
  WHERE table_name = 'agent_configs' AND column_name = 'instructions_hash'
")

if [ "$AGENT_TYPE" -gt 0 ]; then
  echo "✅ agent_configs.agent_type (Migration 026)"
else
  echo "❌ agent_configs.agent_type - NOT FOUND"
fi

if [ "$CONFIG_VERSION" -gt 0 ]; then
  echo "✅ agent_configs.config_version (Migration 026)"
else
  echo "❌ agent_configs.config_version - NOT FOUND"
fi

if [ "$INSTRUCTIONS_HASH" -gt 0 ]; then
  echo "✅ agent_configs.instructions_hash (Migration 026)"
else
  echo "❌ agent_configs.instructions_hash - NOT FOUND"
fi

# Check sop_tickets columns
INVENTORY_ID=$(psql "$DATABASE_URL" -t -c "
  SELECT COUNT(*) 
  FROM information_schema.columns 
  WHERE table_name = 'sop_tickets' AND column_name = 'inventory_id'
")

IS_SIDECAR=$(psql "$DATABASE_URL" -t -c "
  SELECT COUNT(*) 
  FROM information_schema.columns 
  WHERE table_name = 'sop_tickets' AND column_name = 'is_sidecar'
")

if [ "$INVENTORY_ID" -gt 0 ]; then
  echo "✅ sop_tickets.inventory_id (Migration 029)"
else
  echo "❌ sop_tickets.inventory_id - NOT FOUND"
fi

if [ "$IS_SIDECAR" -gt 0 ]; then
  echo "✅ sop_tickets.is_sidecar (Migration 029)"
else
  echo "❌ sop_tickets.is_sidecar - NOT FOUND"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

TOTAL=8
SUCCESS=0

[ "$INVITES_CHECK" -gt 0 ] && ((SUCCESS++))
[ "$AGENT_TYPE" -gt 0 ] && ((SUCCESS++))
[ "$CONFIG_VERSION" -gt 0 ] && ((SUCCESS++))
[ "$INSTRUCTIONS_HASH" -gt 0 ] && ((SUCCESS++))
[ "$INVENTORY_ID" -gt 0 ] && ((SUCCESS++))
[ "$IS_SIDECAR" -gt 0 ] && ((SUCCESS++))

# Check tables
STRATEGY_CONTEXTS=$(psql "$DATABASE_URL" -t -c "
  SELECT COUNT(*) 
  FROM information_schema.tables 
  WHERE table_name = 'agent_strategy_contexts'
")

VECTOR_STORES=$(psql "$DATABASE_URL" -t -c "
  SELECT COUNT(*) 
  FROM information_schema.tables 
  WHERE table_name = 'tenant_vector_stores'
")

[ "$STRATEGY_CONTEXTS" -gt 0 ] && ((SUCCESS++))
[ "$VECTOR_STORES" -gt 0 ] && ((SUCCESS++))

echo ""
if [ $SUCCESS -eq $TOTAL ]; then
  echo "✅ ALL MIGRATIONS VERIFIED SUCCESSFULLY ($SUCCESS/$TOTAL)"
  echo ""
  echo "Next steps:"
  echo "  1. ✅ Migrations complete"
  echo "  2. Test your application"
  echo "  3. Review MIGRATION_STATUS_COMPLETE.md for optional improvements"
else
  echo "⚠️  PARTIAL SUCCESS ($SUCCESS/$TOTAL migrations verified)"
  echo "Some migrations may need to be run manually"
fi

echo ""
