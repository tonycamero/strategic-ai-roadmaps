// scripts/enrich-demo-intakes.ts
import { db } from '../src/db';
import { tenants, intakes } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function enrichIntake(tenantName: string, enrichedData: any) {
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.name, tenantName)
  });

  if (!tenant) {
    console.error(`❌ Tenant not found: ${tenantName}`);
    return;
  }

  const intake = await db.query.intakes.findFirst({
    where: eq(intakes.tenantId, tenant.id)
  });

  if (!intake) {
    console.error(`❌ No intake found for: ${tenantName}`);
    return;
  }

  const currentAnswers = (intake.answers as any) || {};
  const enrichedAnswers = {
    ...currentAnswers,
    ...enrichedData
  };

  await db
    .update(intakes)
    .set({ answers: enrichedAnswers })
    .where(eq(intakes.id, intake.id));

  console.log(`✅ Enriched intake for ${tenantName}`);
  console.log(`   Display Name: ${enrichedData.display_name}`);
  console.log(`   Top Issues: ${enrichedData.top_3_issues.filter(Boolean).length}`);
  console.log(`   Primary KPIs: ${enrichedData.primary_kpis.filter(Boolean).length}`);
  console.log('');
}

async function run() {
  console.log('='.repeat(70));
  console.log('ENRICHING DEMO FIRM INTAKES');
  console.log('='.repeat(70));
  console.log('');

  // Hayes Real Estate Group - real estate focused
  await enrichIntake('Hayes Real Estate Group', {
    // Section E: Enriched Profile
    role_label: 'Owner & Managing Broker',
    department_key: 'owner',
    display_name: 'Marcus Hayes',
    preferred_reference: 'Marcus',
    
    top_3_issues: [
      'Leads fall through the cracks between showings and follow-up',
      'No clear handoff process between sales reps and operations team',
      'Inconsistent client communication during escrow process'
    ],
    
    top_3_goals_next_90_days: [
      'Reduce lead response time to under 15 minutes',
      'Automate post-showing follow-up sequence',
      'Build transparent pipeline visibility for entire team'
    ],
    
    if_nothing_else_changes_but_X_this_was_worth_it: 
      'Every lead gets a timely, personalized follow-up within the first hour',
    
    primary_kpis: [
      'Lead response time',
      'Showing-to-offer conversion rate',
      'Average days to close'
    ],
    
    kpi_baselines: {
      'Lead response time': '2-4 hours',
      'Showing-to-offer conversion rate': '18%',
      'Average days to close': '45 days'
    },
    
    non_goals: [
      'Replacing our current MLS system',
      'Building custom software from scratch'
    ],
    
    do_not_automate: [
      'Initial client consultations',
      'Property valuation assessments'
    ],
    
    change_readiness: 'high',
    weekly_capacity_for_implementation_hours: 8,
    biggest_risk_if_we_push_too_fast: 
      'Team pushback if they feel overwhelmed or training is inadequate'
  });

  // BrightFocus Marketing - marketing agency focused
  await enrichIntake('BrightFocus Marketing', {
    // Section E: Enriched Profile
    role_label: 'Founder & Creative Director',
    department_key: 'owner',
    display_name: 'Sarah Chen',
    preferred_reference: 'Sarah',
    
    top_3_issues: [
      'Client onboarding takes too long and feels chaotic',
      'Hard to track project status across multiple campaigns',
      'Inconsistent reporting and difficulty proving ROI to clients'
    ],
    
    top_3_goals_next_90_days: [
      'Streamline client intake from 2 weeks to 3 days',
      'Automate weekly progress reports to clients',
      'Create standardized campaign launch checklist'
    ],
    
    if_nothing_else_changes_but_X_this_was_worth_it: 
      'Clients always know exactly where their campaign stands without having to ask',
    
    primary_kpis: [
      'Client onboarding time',
      'Campaign launch accuracy',
      'Time spent on reporting'
    ],
    
    kpi_baselines: {
      'Client onboarding time': '10-12 days',
      'Campaign launch accuracy': '75% (missing steps)',
      'Time spent on reporting': '6 hours/week'
    },
    
    non_goals: [
      'Becoming a full-service tech agency',
      'Hiring a dedicated ops manager right now'
    ],
    
    do_not_automate: [
      'Creative strategy sessions',
      'Client relationship check-ins'
    ],
    
    change_readiness: 'medium',
    weekly_capacity_for_implementation_hours: 5,
    biggest_risk_if_we_push_too_fast: 
      'Losing the personal touch that clients love about our boutique approach'
  });

  console.log('='.repeat(70));
  console.log('✅ ENRICHMENT COMPLETE');
  console.log('='.repeat(70));
  console.log('');
  console.log('Run this to verify:');
  console.log('  pnpm tsx scripts/debug-intake-enrichment.ts <tenant-id>');
  console.log('');
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
