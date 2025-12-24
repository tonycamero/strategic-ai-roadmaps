-- 002_add_tenants_and_sa_tables.sql
-- Migration: Add SuperAdmin Infrastructure (Tenants, Metrics, Audit, Feature Flags)
-- Date: 2025-01-20

-- ============================================================================
-- TENANTS (1:1 with owner users)
-- ============================================================================

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL UNIQUE
        REFERENCES users(id) ON DELETE CASCADE,
    
    -- Display / segmentation
    name VARCHAR(255) NOT NULL,
    cohort_label VARCHAR(50),          -- e.g. 'EUGENE_Q1_2026'
    segment VARCHAR(50),               -- 'cpa', 'insurance', etc.
    region VARCHAR(50),                -- 'Eugene', 'PNW', etc.

    status VARCHAR(20) NOT NULL DEFAULT 'prospect',
    -- prospect | active | paused | churned

    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_cohort ON tenants(cohort_label);

-- ============================================================================
-- TENANT METRICS (daily rollups for SA dashboard)
-- ============================================================================

CREATE TABLE tenant_metrics_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL
        REFERENCES tenants(id) ON DELETE CASCADE,
    
    metric_date DATE NOT NULL,
    -- Core funnel metrics
    intake_started_count INTEGER NOT NULL DEFAULT 0,
    intake_completed_count INTEGER NOT NULL DEFAULT 0,
    roadmap_created_count INTEGER NOT NULL DEFAULT 0,
    roadmap_delivered_count INTEGER NOT NULL DEFAULT 0,
    pilot_open_count INTEGER NOT NULL DEFAULT 0,
    pilot_won_count INTEGER NOT NULL DEFAULT 0,

    last_activity_at TIMESTAMP WITHOUT TIME ZONE,

    metrics_json JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),

    UNIQUE (tenant_id, metric_date)
);

CREATE INDEX idx_tenant_metrics_tenant_date
    ON tenant_metrics_daily(tenant_id, metric_date);

-- ============================================================================
-- AUDIT EVENTS (system + SA actions)
-- ============================================================================

CREATE TABLE audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Scope
    tenant_id UUID
        REFERENCES tenants(id) ON DELETE SET NULL,
    
    -- Actor
    actor_user_id UUID
        REFERENCES users(id) ON DELETE SET NULL,
    actor_role VARCHAR(20), -- 'super_admin', 'owner', 'ops', etc.
    
    -- Event
    event_type VARCHAR(100) NOT NULL,
    -- e.g. 'TENANT_STATUS_CHANGED', 'ROADMAP_MARKED_DELIVERED',
    --      'FEATURE_FLAG_TOGGLED', 'SA_IMPERSONATE_START', ...

    entity_type VARCHAR(50),
    -- 'tenant', 'user', 'roadmap', 'intake', 'feature_flag'

    entity_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_tenant_date ON audit_events(tenant_id, created_at);
CREATE INDEX idx_audit_actor_date  ON audit_events(actor_user_id, created_at);
CREATE INDEX idx_audit_type_date   ON audit_events(event_type, created_at);

-- ============================================================================
-- FEATURE FLAGS (global definitions)
-- ============================================================================

CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) NOT NULL UNIQUE,      -- 'intake_v2', 'ai_comments'
    description TEXT,
    default_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================================
-- TENANT FEATURE FLAGS (overrides)
-- ============================================================================

CREATE TABLE tenant_feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL
        REFERENCES tenants(id) ON DELETE CASCADE,
    feature_flag_id UUID NOT NULL
        REFERENCES feature_flags(id) ON DELETE CASCADE,
    
    enabled BOOLEAN NOT NULL,

    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),

    UNIQUE (tenant_id, feature_flag_id)
);

CREATE INDEX idx_tenant_flags_tenant
    ON tenant_feature_flags(tenant_id);

-- ============================================================================
-- IMPERSONATION SESSIONS (Phase 2)
-- ============================================================================

CREATE TABLE impersonation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    super_admin_id UUID NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,

    tenant_id UUID NOT NULL
        REFERENCES tenants(id) ON DELETE CASCADE,

    -- optional: the owner user they're impersonating
    owner_user_id UUID
        REFERENCES users(id) ON DELETE SET NULL,

    reason TEXT,
    started_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    ended_at   TIMESTAMP WITHOUT TIME ZONE,

    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_impersonation_sa ON impersonation_sessions(super_admin_id, started_at);
CREATE INDEX idx_impersonation_tenant ON impersonation_sessions(tenant_id, started_at);

-- ============================================================================
-- EXTEND ROADMAPS (status + pilot stage)
-- ============================================================================

ALTER TABLE roadmaps
    ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'draft',
    -- draft | in_progress | delivered

    ADD COLUMN IF NOT EXISTS pilot_stage VARCHAR(30),
    -- null | 'pilot_proposed' | 'pilot_active' | 'pilot_completed'

    ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITHOUT TIME ZONE;

-- ============================================================================
-- EXTEND INTAKES (status + timestamps)
-- ============================================================================

ALTER TABLE intakes
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'in_progress',
    -- in_progress | completed

    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITHOUT TIME ZONE;

-- ============================================================================
-- BACKFILL: Create tenant records for existing owners
-- ============================================================================

INSERT INTO tenants (owner_id, name, status)
SELECT id, name, 'active'
FROM users
WHERE role = 'owner'
ON CONFLICT (owner_id) DO NOTHING;

-- ============================================================================
-- ROLLBACK (manual, if needed)
-- ============================================================================
-- DROP TABLE IF EXISTS impersonation_sessions;
-- DROP TABLE IF EXISTS tenant_feature_flags;
-- DROP TABLE IF EXISTS feature_flags;
-- DROP TABLE IF EXISTS audit_events;
-- DROP TABLE IF EXISTS tenant_metrics_daily;
-- DROP TABLE IF EXISTS tenants;
-- ALTER TABLE intakes DROP COLUMN IF EXISTS completed_at;
-- ALTER TABLE intakes DROP COLUMN IF EXISTS status;
-- ALTER TABLE roadmaps DROP COLUMN IF EXISTS delivered_at;
-- ALTER TABLE roadmaps DROP COLUMN IF EXISTS pilot_stage;
-- ALTER TABLE roadmaps DROP COLUMN IF EXISTS status;
