import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function fixHayesOwnerIntake() {
  const sql = postgres(process.env.DATABASE_URL!);

  try {
    const tenantId = '4e2c6eb1-0767-43d6-b6a4-3fca8efd3f64'; // Hayes Real Estate Group
    
    console.log('🔧 Marking OWNER_INTAKE as complete for Hayes Real Estate Group...\n');

    // Get current state
    const [state] = await sql`
      SELECT id, steps, max_points
      FROM onboarding_states
      WHERE tenant_id = ${tenantId}
    `;

    if (!state) {
      console.log('❌ No onboarding state found');
      await sql.end();
      process.exit(1);
    }

    const steps = (typeof state.steps === 'string' ? JSON.parse(state.steps) : state.steps) as any[];
    
    // Update OWNER_INTAKE step
    const updatedSteps = steps.map((s: any) => {
      if (s.stepId === 'OWNER_INTAKE') {
        return {
          ...s,
          status: 'COMPLETED',
          pointsEarned: s.pointsPossible,
          completedAt: new Date().toISOString()
        };
      }
      return s;
    });

    // Recalculate totals
    const totalPoints = updatedSteps.reduce((sum: number, s: any) => sum + (s.pointsEarned || 0), 0);
    const percentComplete = Math.round((totalPoints / state.max_points) * 100);

    // Update database
    await sql`
      UPDATE onboarding_states
      SET 
        steps = ${JSON.stringify(updatedSteps)},
        total_points = ${totalPoints},
        percent_complete = ${percentComplete},
        updated_at = NOW()
      WHERE id = ${state.id}
    `;

    console.log('✅ OWNER_INTAKE marked as complete!');
    console.log(`\n📊 Updated progress: ${totalPoints}/${state.max_points} points (${percentComplete}%)`);
    
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await sql.end();
    process.exit(1);
  }
}

fixHayesOwnerIntake();
