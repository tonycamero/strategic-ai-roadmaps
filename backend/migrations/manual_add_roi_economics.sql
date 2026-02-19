-- Manual migration: Add ROI Baseline Economic fields (Task 1)
-- Added in DB SAFE MODE (no direct DB connection)

ALTER TABLE "firm_baseline_intake" ADD COLUMN "weekly_revenue" integer;
ALTER TABLE "firm_baseline_intake" ADD COLUMN "peak_hour_revenue_pct" integer;
ALTER TABLE "firm_baseline_intake" ADD COLUMN "labor_pct" integer;
ALTER TABLE "firm_baseline_intake" ADD COLUMN "overtime_pct" integer;
ALTER TABLE "firm_baseline_intake" ADD COLUMN "gross_margin_pct" integer;
ALTER TABLE "firm_baseline_intake" ADD COLUMN "max_throughput_per_hour" integer;
ALTER TABLE "firm_baseline_intake" ADD COLUMN "avg_throughput_per_hour" integer;

