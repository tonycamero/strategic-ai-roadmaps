# Owner Vector Repair (Invariant Fixing)

This document contains repair SQL to fix any missing or corrupted `intake_vectors` rows for `Tenant Owner`. DO NOT execute this in code runtime. This is for manual Ops intervention against the Neon database.

## A) FIND tenants missing Owner vector
```sql
SELECT t.id AS tenant_id
FROM tenants t
LEFT JOIN intake_vectors v
  ON v.tenant_id = t.id
 AND v.role_label = 'Tenant Owner'
WHERE v.id IS NULL;
```

## B) INSERT missing Owner vectors
```sql
INSERT INTO intake_vectors (id, tenant_id, role_label, role_type, perceived_constraints, intake_id)
SELECT gen_random_uuid(), t.id, 'Tenant Owner', 'EXECUTIVE', 'Tenant Owner intake profile (generated).', NULL
FROM tenants t
LEFT JOIN intake_vectors v
  ON v.tenant_id = t.id
 AND v.role_label = 'Tenant Owner'
WHERE v.id IS NULL;
```

## C) LINK completed owner intakes to owner vectors (only when intake_vectors.intake_id is NULL)
```sql
UPDATE intake_vectors v
SET intake_id = i.id
FROM intakes i
WHERE v.tenant_id = i.tenant_id
  AND v.role_label = 'Tenant Owner'
  AND v.intake_id IS NULL
  AND i.role = 'owner'
  AND i.status = 'completed';
```

## D) DETECT duplicates (must be manually resolved)
```sql
SELECT tenant_id, COUNT(*) AS owner_vector_count
FROM intake_vectors
WHERE role_label = 'Tenant Owner'
GROUP BY tenant_id
HAVING COUNT(*) > 1;
```

## E) VALIDATE: no missing + no duplicates + no orphan completed owner intakes
```sql
-- missing
SELECT t.id
FROM tenants t
LEFT JOIN intake_vectors v
  ON v.tenant_id = t.id AND v.role_label='Tenant Owner'
WHERE v.id IS NULL;

-- duplicates
SELECT tenant_id
FROM intake_vectors
WHERE role_label='Tenant Owner'
GROUP BY tenant_id
HAVING COUNT(*) > 1;

-- orphan completed owner intakes
SELECT i.tenant_id, i.id AS intake_id
FROM intakes i
LEFT JOIN intake_vectors v
  ON v.intake_id = i.id
WHERE i.role='owner'
  AND i.status='completed'
  AND v.id IS NULL;
```
