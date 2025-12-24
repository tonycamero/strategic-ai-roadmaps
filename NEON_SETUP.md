# Neon Database Setup for Production

## Step 1: Create Neon Project

1. Go to https://neon.tech
2. Create new project: **strategic-ai-roadmaps**
3. Region: **US East (Ohio)** or closest to your users
4. Copy the connection string (looks like: `postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`)

---

## Step 2: Run Schema Migrations

In Neon SQL Editor (or via `psql`), run these SQL files in order:

### Create Base Tables (Initial Schema)

```sql
-- Base tables: users, invites, intakes, roadmaps, training_modules, training_progress
-- Run this first if starting from scratch

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  owner_id UUID NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  accepted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE intakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,
  answers JSONB NOT NULL,
  owner_id UUID NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress',
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pdf_url VARCHAR(500),
  status VARCHAR(30) NOT NULL DEFAULT 'draft',
  pilot_stage VARCHAR(30),
  delivered_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description VARCHAR(1000) NOT NULL,
  content VARCHAR(10000) NOT NULL,
  "order" SERIAL NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Migration 001: Multi-Tenant Support

```sql
-- Add owner_id foreign keys and indexes
ALTER TABLE users
ADD CONSTRAINT users_owner_id_fkey
FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX idx_users_owner_id ON users(owner_id);

ALTER TABLE intakes
ADD CONSTRAINT intakes_owner_id_fkey
FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX idx_intakes_owner_id ON intakes(owner_id);
```

### Migration 002: SuperAdmin Tables

```sql
-- Tenants, metrics, audit, feature flags

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    cohort_label VARCHAR(50),
    segment VARCHAR(50),
    region VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'prospect',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_cohort ON tenants(cohort_label);

CREATE TABLE tenant_metrics_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    intake_started_count INTEGER NOT NULL DEFAULT 0,
    intake_completed_count INTEGER NOT NULL DEFAULT 0,
    roadmap_created_count INTEGER NOT NULL DEFAULT 0,
    roadmap_delivered_count INTEGER NOT NULL DEFAULT 0,
    pilot_open_count INTEGER NOT NULL DEFAULT 0,
    pilot_won_count INTEGER NOT NULL DEFAULT 0,
    last_activity_at TIMESTAMP,
    metrics_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, metric_date)
);

CREATE INDEX idx_tenant_metrics_tenant_date ON tenant_metrics_daily(tenant_id, metric_date);

CREATE TABLE audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_role VARCHAR(20),
    event_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_tenant_date ON audit_events(tenant_id, created_at);
CREATE INDEX idx_audit_actor_date ON audit_events(actor_user_id, created_at);
CREATE INDEX idx_audit_type_date ON audit_events(event_type, created_at);

CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    default_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE tenant_feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    feature_flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
    enabled BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, feature_flag_id)
);

CREATE INDEX idx_tenant_flags_tenant ON tenant_feature_flags(tenant_id);

CREATE TABLE impersonation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    super_admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT,
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_impersonation_sa ON impersonation_sessions(super_admin_id, started_at);
CREATE INDEX idx_impersonation_tenant ON impersonation_sessions(tenant_id, started_at);
```

### Migration 003: Role Validation

```sql
ALTER TABLE users
ADD CONSTRAINT users_role_check
CHECK (role IN ('owner', 'ops', 'sales', 'delivery', 'staff', 'superadmin'));
```

### Migration 004: Lead Requests

```sql
CREATE TABLE lead_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  team_size INTEGER NOT NULL,
  current_crm VARCHAR(255) NOT NULL,
  bottleneck TEXT NOT NULL,
  source VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lead_requests_email ON lead_requests(email);
CREATE INDEX idx_lead_requests_status ON lead_requests(status);
CREATE INDEX idx_lead_requests_created_at ON lead_requests(created_at DESC);
```

---

## Step 3: Seed Demo Data (Roberta Hayes)

Run this SQL to create the Roberta Hayes demo firm:

```sql
-- See: backend/src/db/seeds/seed_roberta_hayes_final.sql
-- Or copy-paste from that file
```

---

## Step 4: Create Your SuperAdmin User

```sql
-- Replace with YOUR email and password (hash it first with bcrypt)
-- Password: 'password123' hashed = $2b$10$92H8K0XFHdJU7Qy8R5qVOOF5QZJXR1wGz4H6M8L9K0P3Q2W5X7Y9Z

INSERT INTO users (email, password_hash, name, role, owner_id)
VALUES (
  'tony@scend.cash',
  '$2b$10$dummyhashfordemopurposesonly',  -- REPLACE WITH REAL HASH
  'Tony Camero',
  'superadmin',
  (SELECT id FROM users WHERE email = 'tony@scend.cash')  -- Self-reference after insert
);

-- Update to self-reference
UPDATE users 
SET owner_id = id 
WHERE email = 'tony@scend.cash' AND owner_id IS NULL;

-- Create tenant for yourself
INSERT INTO tenants (owner_id, name, status)
SELECT id, 'Scend Technologies', 'active'
FROM users
WHERE email = 'tony@scend.cash'
ON CONFLICT (owner_id) DO NOTHING;
```

---

## Step 5: Get Connection String

Your Neon connection string should look like:
```
postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

Use this as your `DATABASE_URL` environment variable in Vercel.

---

## Verification Queries

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check user count
SELECT COUNT(*) as user_count FROM users;

-- Check Roberta's firm
SELECT * FROM users WHERE email LIKE '%hayesrealestate.com%';
SELECT * FROM tenants WHERE name = 'Hayes Real Estate Group';
```

---

## Next: Vercel Environment Variables

Once database is set up, add to Vercel:

```
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require
JWT_SECRET=generate-a-random-32-char-string-here
FRONTEND_URL=https://tonycamero.com
NODE_ENV=production
VITE_API_URL=https://tonycamero.com
```

Optional (for emails):
```
RESEND_API_KEY=re_your_key_here
FROM_EMAIL=noreply@tonycamero.com
```
