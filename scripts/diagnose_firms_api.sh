#!/bin/bash
# Diagnostic script to check /api/superadmin/firms response shape

API_BASE="${API_BASE:-http://localhost:3001}"
EXEC_EMAIL="${EXEC_EMAIL:-tony@scend.cash}"
EXEC_PASSWORD="${EXEC_PASSWORD:-Scure4!2026}"

echo "=== API Firms Endpoint Diagnostic ==="
echo "API Base: $API_BASE"
echo ""

# Login
echo "Logging in..."
EXEC_TOKEN=$(curl -sS -X POST "$API_BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EXEC_EMAIL\",\"password\":\"$EXEC_PASSWORD\"}" | jq -r '.token // empty')

if [ -z "$EXEC_TOKEN" ]; then
  echo "❌ Failed to get token"
  exit 1
fi

echo "✅ Token obtained (length: ${#EXEC_TOKEN})"
echo ""

# Call firms endpoint
echo "Calling GET $API_BASE/api/superadmin/firms"
echo ""

RESPONSE=$(curl -sS -w "\n%{http_code}" \
  -H "Authorization: Bearer $EXEC_TOKEN" \
  "$API_BASE/api/superadmin/firms")

STATUS=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "=== HTTP STATUS ==="
echo "$STATUS"
echo ""

echo "=== RESPONSE BODY (first 100 lines) ==="
echo "$BODY" | head -n 100
echo ""

echo "=== JSON STRUCTURE ANALYSIS ==="
echo "Top-level keys:"
echo "$BODY" | jq 'keys' 2>/dev/null || echo "Not a JSON object"
echo ""

echo "Is it an array?"
echo "$BODY" | jq 'type' 2>/dev/null
echo ""

echo "Array length (if array):"
echo "$BODY" | jq 'length' 2>/dev/null || echo "N/A"
echo ""

echo "First item (if array):"
echo "$BODY" | jq '.[0]' 2>/dev/null || echo "N/A"
echo ""

echo "Trying .firms path:"
echo "$BODY" | jq '.firms | length' 2>/dev/null || echo "N/A"
echo ""

echo "Trying .data.firms path:"
echo "$BODY" | jq '.data.firms | length' 2>/dev/null || echo "N/A"
echo ""

echo "=== TENANT ID EXTRACTION ATTEMPTS ==="
echo "Method 1 (direct array):"
echo "$BODY" | jq -r '.[0].tenantId // .[0].id // empty' 2>/dev/null || echo "Failed"
echo ""

echo "Method 2 (.firms):"
echo "$BODY" | jq -r '.firms[0].tenantId // .firms[0].id // empty' 2>/dev/null || echo "Failed"
echo ""

echo "Method 3 (.data.firms):"
echo "$BODY" | jq -r '.data.firms[0].tenantId // .data.firms[0].id // empty' 2>/dev/null || echo "Failed"
echo ""

echo "=== DIAGNOSTIC COMPLETE ==="
