#!/bin/bash
# Quick verification script for agent configs implementation
# Run: chmod +x verify_agent_configs.sh && ./verify_agent_configs.sh

echo "🔍 Verifying Agent Configs + VC Implementation..."
echo ""

ERRORS=0

# Check new files
echo "📁 Checking new files..."
FILES=(
  "backend/src/db/migrations/005_add_agent_configs.sql"
  "backend/src/types/agent.types.ts"
  "backend/src/services/verified-compute.service.ts"
  "backend/src/services/agentConfig.service.ts"
  "backend/src/controllers/agentConfig.controller.ts"
  "backend/src/routes/agentConfig.routes.ts"
  "backend/src/db/seeds/seed_hayes_owner_agent.sql"
  "AGENT_CONFIGS_IMPLEMENTATION.md"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file (MISSING)"
    ERRORS=$((ERRORS+1))
  fi
done

echo ""
echo "📝 Checking modified files..."
MODIFIED=(
  "backend/src/db/schema.ts"
  "backend/src/services/agent.service.ts"
  "backend/src/index.ts"
)

for file in "${MODIFIED[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file (MISSING)"
    ERRORS=$((ERRORS+1))
  fi
done

echo ""
echo "🔎 Checking for key changes..."

# Check schema.ts for agentConfigs
if grep -q "agentConfigs.*pgTable" backend/src/db/schema.ts; then
  echo "  ✅ agentConfigs table defined in schema.ts"
else
  echo "  ❌ agentConfigs table NOT found in schema.ts"
  ERRORS=$((ERRORS+1))
fi

# Check agent.service.ts for VC imports
if grep -q "runVerifiedCompute" backend/src/services/agent.service.ts; then
  echo "  ✅ VC imports found in agent.service.ts"
else
  echo "  ❌ VC imports NOT found in agent.service.ts"
  ERRORS=$((ERRORS+1))
fi

# Check index.ts for agent config routes
if grep -q "agentConfigRoutes" backend/src/index.ts; then
  echo "  ✅ Agent config routes wired in index.ts"
else
  echo "  ❌ Agent config routes NOT wired in index.ts"
  ERRORS=$((ERRORS+1))
fi

echo ""
if [ $ERRORS -eq 0 ]; then
  echo "✅ All verification checks passed!"
  echo ""
  echo "Next steps:"
  echo "1. Run migration: psql \$DATABASE_URL -f backend/src/db/migrations/005_add_agent_configs.sql"
  echo "2. Run seed: psql \$DATABASE_URL -f backend/src/db/seeds/seed_hayes_owner_agent.sql"
  echo "3. Start backend: cd backend && pnpm dev"
  echo "4. Test agent: curl -X POST http://localhost:3001/api/agent/query -H 'Authorization: Bearer <TOKEN>' -H 'Content-Type: application/json' -d '{\"message\": \"hello\"}'"
else
  echo "❌ $ERRORS error(s) found. Please review the implementation."
  exit 1
fi
