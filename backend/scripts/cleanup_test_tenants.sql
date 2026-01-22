-- Cleanup Test Tenants
-- This script removes all test tenants except the three legitimate ones
-- Run this in your PostgreSQL database

-- First, let's see what we have
SELECT 
    id,
    name,
    created_at,
    CASE 
        WHEN name IN ('RiverBend Brewing Co', 'BrightFocus Marketing', 'Platform Administration') 
        THEN '✅ KEEP'
        ELSE '🗑️ DELETE'
    END as action
FROM tenants
ORDER BY created_at;

-- Delete all test tenants (keeping only the three legitimate ones)
-- WARNING: This will cascade delete all related data (users, diagnostics, documents, etc.)
DELETE FROM tenants
WHERE name NOT IN (
    'RiverBend Brewing Co',
    'BrightFocus Marketing',
    'Platform Administration'
);

-- Verify the cleanup
SELECT 
    id,
    name,
    created_at
FROM tenants
ORDER BY name;
