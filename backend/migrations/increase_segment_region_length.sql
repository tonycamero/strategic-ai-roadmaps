-- Clean up orphaned invites before migration
-- This removes invites that reference non-existent tenants

DELETE FROM invites 
WHERE tenant_id NOT IN (SELECT id FROM tenants);

-- Now apply the column length changes
ALTER TABLE tenants 
  ALTER COLUMN segment TYPE varchar(255),
  ALTER COLUMN region TYPE varchar(255);
