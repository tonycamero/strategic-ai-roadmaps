-- TCK-MIH-002: Unique partial index — enforces one published diagnostic per tenant at the DB level.
-- Projection assumes this invariant holds. Without it, concurrent publish requests could produce
-- two rows with status='published' for the same tenant, causing projection state ambiguity.
-- 
-- SAFE: IF NOT EXISTS prevents duplicate application errors.

CREATE UNIQUE INDEX IF NOT EXISTS one_published_diagnostic_per_tenant
ON diagnostics (tenant_id)
WHERE status = 'published';
