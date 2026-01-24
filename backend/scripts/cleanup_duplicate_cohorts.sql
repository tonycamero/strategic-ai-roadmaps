-- Find and delete duplicate cohorts (case-insensitive)
-- This script keeps the first occurrence and deletes subsequent duplicates

-- First, let's see what cohorts exist
SELECT 
    id,
    name,
    created_at,
    LOWER(name) as normalized_name
FROM cohorts
ORDER BY LOWER(name), created_at;

-- Delete duplicates, keeping only the first occurrence (earliest created_at)
DELETE FROM cohorts
WHERE id NOT IN (
    SELECT MIN(id)
    FROM cohorts
    GROUP BY LOWER(name)
);

-- Verify the cleanup
SELECT 
    id,
    name,
    created_at
FROM cohorts
ORDER BY name;
