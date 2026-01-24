ALTER TABLE "tickets_draft" ADD COLUMN IF NOT EXISTS "category" varchar(100);
ALTER TABLE "tickets_draft" ADD COLUMN IF NOT EXISTS "tier" varchar(50);
ALTER TABLE "tickets_draft" ADD COLUMN IF NOT EXISTS "ghl_implementation" text;
ALTER TABLE "tickets_draft" ADD COLUMN IF NOT EXISTS "implementation_steps" json;
ALTER TABLE "tickets_draft" ADD COLUMN IF NOT EXISTS "success_metric" text;
ALTER TABLE "tickets_draft" ADD COLUMN IF NOT EXISTS "roi_notes" text;
ALTER TABLE "tickets_draft" ADD COLUMN IF NOT EXISTS "time_estimate_hours" integer DEFAULT 0;
ALTER TABLE "tickets_draft" ADD COLUMN IF NOT EXISTS "pain_source" text;
