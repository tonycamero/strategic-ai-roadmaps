import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function markOrgTypeComplete() {
  const sql = postgres(process.env.DATABASE_URL!);

  try {
    const tenantId = 'bf472c81-f9d7-4fab-84b5-58cf9e1ebf06'; // BrightFocus Marketing
    
    console.log(`🔧 Marking ORGANIZATION_TYPE as complete for ${tenantId}...\n`);

    const [state] = await sql`
      SELECT id, steps, max_points, total_points
      FROM onboarding_states
      WHERE tenant_id = ${tenantId}
    `;

    if (!state) {
      console.log('❌ Onboarding state not found');
      await sql.end();
      process.exit(1);
    }

    const steps = (typeof state.steps === 'string' ? JSON.parse(state.steps) : state.steps) as any[];
    
    // Find and update ORGANIZATION_TYPE step
    const updatedSteps = steps.map((s: any) => {
      if (s.stepId === 'ORGANIZATION_TYPE') {
        return {
          ...s,
          status: 'COMPLETED',
          pointsEarned: 5,
          completedAt: new Date().toISOString()
        };
      }
      return s;
    });

    // Recalculate totals
    const totalPoints = updatedSteps.reduce((sum: number, s: any) => sum + (s.pointsEarned || 0), 0);
    const percentComplete = Math.round((totalPoints / state.max_points) * 100);

    await sql`
      UPDATE onboarding_states
      SET 
        steps = ${JSON.stringify(updatedSteps)},
        total_points = ${totalPoints},
        percent_complete = ${percentComplete},
        updated_at = NOW()
      WHERE id = ${state.id}
    `;

    console.log(`✅ ORGANIZATION_TYPE marked as complete`);
    console.log(`📊 Updated: ${totalPoints}/${state.max_points} points (${percentComplete}%)\n`);

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await sql.end();
    process.exit(1);
  }
}

markOrgTypeComplete();
