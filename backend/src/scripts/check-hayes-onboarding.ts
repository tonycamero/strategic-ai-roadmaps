import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkHayesOnboarding() {
  const sql = postgres(process.env.DATABASE_URL!);

  try {
    const tenantId = '4e2c6eb1-0767-43d6-b6a4-3fca8efd3f64'; // Hayes Real Estate Group
    
    console.log('📋 Checking Hayes Real Estate Group onboarding state...\n');

    const [state] = await sql`
      SELECT id, tenant_id, steps, total_points, max_points, percent_complete
      FROM onboarding_states
      WHERE tenant_id = ${tenantId}
    `;

    if (!state) {
      console.log('❌ No onboarding state found for Hayes Real Estate Group');
      await sql.end();
      process.exit(0);
    }

    const steps = (typeof state.steps === 'string' ? JSON.parse(state.steps) : state.steps) as any[];

    console.log(`Tenant ID: ${state.tenant_id}`);
    console.log(`Progress: ${state.total_points}/${state.max_points} points (${state.percent_complete}%)\n`);
    
    console.log('Steps:');
    for (const step of steps) {
      const status = step.status === 'COMPLETED' ? '✅' : '⬜';
      console.log(`  ${status} ${step.label} (${step.stepId})`);
      console.log(`     Status: ${step.status}, Points: ${step.pointsEarned}/${step.pointsPossible}`);
      if (step.completedAt) {
        console.log(`     Completed: ${step.completedAt}`);
      }
      console.log('');
    }

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await sql.end();
    process.exit(1);
  }
}

checkHayesOnboarding();
