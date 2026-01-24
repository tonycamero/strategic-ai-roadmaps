#!/bin/bash
# Quick check for non-canonical tickets in the database

echo "=== CANONICAL TICKET DATABASE CHECK ==="
echo ""

# Check for tickets with no inventoryId
echo "[1] Tickets with NO inventoryId (custom tickets):"
psql "$DATABASE_URL" -c "
SELECT 
    COUNT(*) as count,
    tenant_id,
    STRING_AGG(DISTINCT ticket_id, ', ' ORDER BY ticket_id) as ticket_ids
FROM sop_tickets 
WHERE inventory_id IS NULL
GROUP BY tenant_id
ORDER BY count DESC
LIMIT 10;
" 2>/dev/null || echo "Database not accessible"

echo ""

# Check for tickets with INV-DERIVED-* (legacy fake IDs)
echo "[2] Tickets with FAKE inventoryId (INV-DERIVED-*):"
psql "$DATABASE_URL" -c "
SELECT 
    COUNT(*) as count,
    tenant_id,
    STRING_AGG(DISTINCT inventory_id, ', ') as fake_ids
FROM sop_tickets 
WHERE inventory_id LIKE 'INV-DERIVED-%'
GROUP BY tenant_id
ORDER BY count DESC
LIMIT 10;
" 2>/dev/null || echo "Database not accessible"

echo ""

# Total ticket counts
echo "[3] Total ticket summary:"
psql "$DATABASE_URL" -c "
SELECT 
    COUNT(*) as total_tickets,
    COUNT(CASE WHEN inventory_id IS NULL THEN 1 END) as null_inventory,
    COUNT(CASE WHEN inventory_id LIKE 'INV-DERIVED-%' THEN 1 END) as fake_inventory,
    COUNT(CASE WHEN inventory_id IS NOT NULL AND inventory_id NOT LIKE 'INV-DERIVED-%' THEN 1 END) as canonical_inventory
FROM sop_tickets;
" 2>/dev/null || echo "Database not accessible"

echo ""
echo "=== END OF CHECK ==="
