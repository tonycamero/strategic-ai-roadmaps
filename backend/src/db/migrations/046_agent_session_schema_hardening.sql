-- S6-09: Agent Session Schema Hardening
-- Align assisted_synthesis_agent_sessions.tenant_id to canonical UUID FK

-- Step 1: Convert VARCHAR to UUID
ALTER TABLE assisted_synthesis_agent_sessions
ALTER COLUMN tenant_id TYPE UUID
USING tenant_id::uuid;

-- Step 2: Add foreign key constraint
ALTER TABLE assisted_synthesis_agent_sessions
ADD CONSTRAINT fk_agent_sessions_tenant
FOREIGN KEY (tenant_id)
REFERENCES tenants(id)
ON DELETE CASCADE;
