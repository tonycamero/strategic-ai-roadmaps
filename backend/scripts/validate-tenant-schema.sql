-- Strategic AI Roadmaps - Tenant Schema Validation
-- Run after migration 023 to verify tenant scoping refactor

\echo '=========================================='
\echo 'TENANT SCOPING VALIDATION'
\echo '=========================================='
\echo ''

-- 1. Check schema structure
\echo '1. Schema Structure Check'
\echo '----------------------------------------'

\echo 'Tables with tenantId column:'
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE column_name = 'tenantId'
AND table_schema = 'public'
ORDER BY table_name;

\echo ''
\echo 'Tables with ownerUserId column:'
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE column_name = 'ownerUserId'
AND table_schema = 'public'
ORDER BY table_name;

\echo ''
\echo '2. Users Table Structure'
\echo '----------------------------------------'
\d users

\echo ''
\echo '3. Tenants Table Structure'
\echo '----------------------------------------'
\d tenants

\echo ''
\echo '4. Roadmaps Table Structure'
\echo '----------------------------------------'
\d roadmaps

\echo ''
\echo '5. Intakes Table Structure'
\echo '----------------------------------------'
\d intakes

\echo ''
\echo '6. Invites Table Structure'
\echo '----------------------------------------'
\d invites

\echo ''
\echo '7. Tenant Documents Table Structure'
\echo '----------------------------------------'
\d tenant_documents

\echo ''
\echo '8. Data Integrity Checks'
\echo '----------------------------------------'

\echo 'Total tenants:'
SELECT COUNT(*) as tenant_count FROM tenants;

\echo ''
\echo 'Total users:'
SELECT COUNT(*) as user_count FROM users;

\echo ''
\echo 'Users with tenantId assigned:'
SELECT 
    COUNT(*) as users_with_tenant,
    COUNT(*) FILTER (WHERE "tenantId" IS NULL) as users_without_tenant
FROM users;

\echo ''
\echo 'Tenants with ownerUserId assigned:'
SELECT 
    COUNT(*) as total_tenants,
    COUNT(*) FILTER (WHERE "ownerUserId" IS NOT NULL) as tenants_with_owner,
    COUNT(*) FILTER (WHERE "ownerUserId" IS NULL) as tenants_without_owner
FROM tenants;

\echo ''
\echo 'Intakes with tenantId:'
SELECT 
    COUNT(*) as total_intakes,
    COUNT(*) FILTER (WHERE "tenantId" IS NOT NULL) as intakes_with_tenant,
    COUNT(*) FILTER (WHERE "tenantId" IS NULL) as intakes_without_tenant
FROM intakes;

\echo ''
\echo 'Roadmaps with tenantId:'
SELECT 
    COUNT(*) as total_roadmaps,
    COUNT(*) FILTER (WHERE "tenantId" IS NOT NULL) as roadmaps_with_tenant,
    COUNT(*) FILTER (WHERE "tenantId" IS NULL) as roadmaps_without_tenant
FROM roadmaps;

\echo ''
\echo '9. Sample Tenant-User Relationship'
\echo '----------------------------------------'
SELECT 
    t.id as tenant_id,
    t.name as tenant_name,
    t."ownerUserId",
    u.id as user_id,
    u.email as owner_email,
    u.role as owner_role,
    u."tenantId" as user_tenant_id,
    CASE 
        WHEN t.id = u."tenantId" AND t."ownerUserId" = u.id THEN '✓ Valid'
        ELSE '✗ MISMATCH'
    END as relationship_status
FROM tenants t
LEFT JOIN users u ON t."ownerUserId" = u.id
LIMIT 5;

\echo ''
\echo '10. Check for Legacy ownerId Columns (Should be empty)'
\echo '----------------------------------------'
SELECT 
    table_name,
    column_name
FROM information_schema.columns
WHERE column_name = 'ownerId'
AND table_schema = 'public'
AND table_name NOT IN ('migrations', 'typeorm_metadata')
ORDER BY table_name;

\echo ''
\echo '=========================================='
\echo 'VALIDATION COMPLETE'
\echo '=========================================='
