-- Migration 053: User Surface Assignments
CREATE TABLE IF NOT EXISTS user_surface_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_email TEXT NOT NULL,
    surface TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    UNIQUE(tenant_id, user_email)
);

-- Index for quick lookups during login routing
CREATE INDEX IF NOT EXISTS idx_surface_assignment_lookup ON user_surface_assignments (tenant_id, user_email);
