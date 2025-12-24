-- 023_refactor_owner_to_tenant.sql
-- Strategic AI Roadmaps — ownerId -> tenantId / ownerUserId / createdByUserId refactor + moderation + indexes

BEGIN;

-- 1) USERS: owner_id (tenant key) -> tenant_id
ALTER TABLE "users" RENAME COLUMN "owner_id" TO "tenant_id";
-- Add FK to tenants (best-effort; column may be NULL for some seed users)
DO $$ BEGIN
  ALTER TABLE "users"
    ADD CONSTRAINT "users_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) TENANTS: owner_id (user) -> owner_user_id
ALTER TABLE "tenants" RENAME COLUMN "owner_id" TO "owner_user_id";
DO $$ BEGIN
  ALTER TABLE "tenants"
    ADD CONSTRAINT "tenants_owner_user_id_fkey"
    FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) INTAKES: owner_id (tenant key) -> tenant_id
ALTER TABLE "intakes" RENAME COLUMN "owner_id" TO "tenant_id";
DO $$ BEGIN
  ALTER TABLE "intakes"
    ADD CONSTRAINT "intakes_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4) TENANT DOCUMENTS: owner_id (user) -> owner_user_id
ALTER TABLE "tenant_documents" RENAME COLUMN "owner_id" TO "owner_user_id";
DO $$ BEGIN
  ALTER TABLE "tenant_documents"
    ADD CONSTRAINT "tenant_documents_owner_user_id_fkey"
    FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5) DISCOVERY CALL NOTES: owner_id (user) -> created_by_user_id
ALTER TABLE "discovery_call_notes" RENAME COLUMN "owner_id" TO "created_by_user_id";
DO $$ BEGIN
  ALTER TABLE "discovery_call_notes"
    ADD CONSTRAINT "discovery_call_notes_created_by_user_id_fkey"
    FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6) ROADMAPS: add tenant_id + created_by_user_id, backfill, drop owner_id
ALTER TABLE "roadmaps"
  ADD COLUMN IF NOT EXISTS "tenant_id" uuid,
  ADD COLUMN IF NOT EXISTS "created_by_user_id" uuid;

-- Backfill created_by_user_id from old owner_id if column exists
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='roadmaps' AND column_name='owner_id'
  ) THEN
    UPDATE "roadmaps" r SET "created_by_user_id" = r."owner_id" WHERE r."created_by_user_id" IS NULL;
  END IF;
END $$;

-- Backfill tenant_id from users.tenant_id
UPDATE "roadmaps" r
SET "tenant_id" = u."tenant_id"
FROM "users" u
WHERE r."created_by_user_id" = u."id" AND r."tenant_id" IS NULL;

-- Enforce NOT NULL on tenant_id
ALTER TABLE "roadmaps" ALTER COLUMN "tenant_id" SET NOT NULL;

-- FKs
DO $$ BEGIN
  ALTER TABLE "roadmaps"
    ADD CONSTRAINT "roadmaps_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "roadmaps"
    ADD CONSTRAINT "roadmaps_created_by_user_id_fkey"
    FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Drop old owner_id column if present
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='roadmaps' AND column_name='owner_id'
  ) THEN
    ALTER TABLE "roadmaps" DROP COLUMN "owner_id";
  END IF;
END $$;

-- 7) SOP_TICKETS: add moderation_status and backfill from approved
ALTER TABLE "sop_tickets" ADD COLUMN IF NOT EXISTS "moderation_status" varchar(20) DEFAULT 'pending';

UPDATE "sop_tickets"
SET "moderation_status" = CASE
  WHEN "approved" IS TRUE THEN 'approved'
  WHEN "approved" IS FALSE THEN 'rejected'
  ELSE 'pending'
END
WHERE "moderation_status" IS NULL OR "moderation_status" = 'pending';

ALTER TABLE "sop_tickets" ALTER COLUMN "moderation_status" SET NOT NULL;

-- 8) Indexes
CREATE INDEX IF NOT EXISTS "idx_tenants_cohort_status" ON "tenants" ("cohort_label", "status");
CREATE INDEX IF NOT EXISTS "idx_intakes_tenant_status_createdAt" ON "intakes" ("tenant_id", "status", "created_at");
CREATE INDEX IF NOT EXISTS "idx_roadmaps_tenant_status_createdAt" ON "roadmaps" ("tenant_id", "status", "created_at");
CREATE INDEX IF NOT EXISTS "idx_sop_tickets_tenant_diagnostic_status" ON "sop_tickets" ("tenant_id", "diagnostic_id", "moderation_status");
CREATE INDEX IF NOT EXISTS "idx_ticket_instances_pack_status" ON "ticket_instances" ("ticket_pack_id", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_tenant_metrics_daily_tenant_date" ON "tenant_metrics_daily" ("tenant_id", "metric_date");
CREATE INDEX IF NOT EXISTS "idx_agent_threads_tenant_role_lastActivity" ON "agent_threads" ("tenant_id", "role_type", "last_activity_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_public_agent_events_session_createdAt" ON "public_agent_events" ("session_id", "created_at");

COMMIT;
