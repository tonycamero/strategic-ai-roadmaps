-- Migration: Add tenant_id column to invites table
-- Date: 2025-12-08

-- Add tenant_id column (nullable first to allow existing data)
ALTER TABLE invites 
ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Add foreign key constraint
ALTER TABLE invites
ADD CONSTRAINT invites_tenant_id_fkey 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Make tenant_id NOT NULL (after data is migrated if needed)
-- Note: If there are existing invites without tenant_id, you'll need to set them first
-- For now, we'll leave it nullable since this is dev/migration phase
