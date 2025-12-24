// scripts/debug-intake-enrichment.ts
import { db } from '../src/db';
import { intakes } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function run(tenantId: string) {
  console.log('='.repeat(70));
  console.log(`Inspecting enriched intake data for tenant: ${tenantId}`);
  console.log('='.repeat(70));
  console.log('');

  const rows = await db
    .select()
    .from(intakes)
    .where(eq(intakes.tenantId, tenantId));

  if (!rows.length) {
    console.log('❌ No intakes found for this tenant');
    process.exit(1);
  }

  for (const row of rows) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`Intake: ${row.role} (ID: ${row.id})`);
    console.log(`Created: ${row.createdAt}`);
    console.log(`${'='.repeat(70)}\n`);

    const answers = row.answers as any;

    // Enriched Profile Fields
    console.log('📝 ENRICHED PROFILE:');
    console.log(`  role_label: ${answers?.role_label || '(not set)'}`);
    console.log(`  department_key: ${answers?.department_key || '(not set)'}`);
    console.log(`  display_name: ${answers?.display_name || '(not set)'}`);
    console.log(`  preferred_reference: ${answers?.preferred_reference || '(not set)'}`);
    console.log('');

    // Issues & Goals
    console.log('🎯 ISSUES & GOALS:');
    if (answers?.top_3_issues && Array.isArray(answers.top_3_issues)) {
      console.log(`  Top 3 Issues:`);
      answers.top_3_issues.filter(Boolean).forEach((issue: string, i: number) => {
        console.log(`    ${i + 1}. ${issue}`);
      });
    } else {
      console.log(`  Top 3 Issues: (not set)`);
    }

    if (answers?.top_3_goals_next_90_days && Array.isArray(answers.top_3_goals_next_90_days)) {
      console.log(`  Top 3 Goals (90 days):`);
      answers.top_3_goals_next_90_days.filter(Boolean).forEach((goal: string, i: number) => {
        console.log(`    ${i + 1}. ${goal}`);
      });
    } else {
      console.log(`  Top 3 Goals: (not set)`);
    }

    console.log(`  "If nothing else but X": ${answers?.if_nothing_else_changes_but_X_this_was_worth_it || '(not set)'}`);
    console.log('');

    // KPIs
    console.log('📊 PRIMARY KPIs:');
    if (answers?.primary_kpis && Array.isArray(answers.primary_kpis)) {
      const kpis = answers.primary_kpis.filter(Boolean);
      if (kpis.length) {
        kpis.forEach((kpi: string) => {
          const baseline = answers?.kpi_baselines?.[kpi] || '(no baseline)';
          console.log(`  • ${kpi}: ${baseline}`);
        });
      } else {
        console.log(`  (not set)`);
      }
    } else {
      console.log(`  (not set)`);
    }
    console.log('');

    // Guardrails
    console.log('🚫 GUARDRAILS:');
    if (answers?.non_goals && Array.isArray(answers.non_goals)) {
      const goals = answers.non_goals.filter(Boolean);
      if (goals.length) {
        console.log(`  Non-goals:`);
        goals.forEach((ng: string) => console.log(`    • ${ng}`));
      }
    }
    if (answers?.do_not_automate && Array.isArray(answers.do_not_automate)) {
      const dna = answers.do_not_automate.filter(Boolean);
      if (dna.length) {
        console.log(`  Do NOT automate:`);
        dna.forEach((item: string) => console.log(`    • ${item}`));
      }
    }
    console.log('');

    // Readiness & Capacity
    console.log('⚡ READINESS & CAPACITY:');
    console.log(`  Change readiness: ${answers?.change_readiness || '(not set)'}`);
    console.log(`  Weekly implementation hours: ${answers?.weekly_capacity_for_implementation_hours ?? 0}`);
    console.log(`  Risk if too fast: ${answers?.biggest_risk_if_we_push_too_fast || '(not set)'}`);
    console.log('');
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ Inspection complete');
  console.log('='.repeat(70));
}

// Usage: pnpm tsx scripts/debug-intake-enrichment.ts <tenant-id>
const tenantId = process.argv[2];
if (!tenantId) {
  console.error('Usage: pnpm tsx scripts/debug-intake-enrichment.ts <tenant-id>');
  process.exit(1);
}

run(tenantId)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
