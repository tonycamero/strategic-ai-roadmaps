import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function fixOnboardingOrgType() {
  const sql = postgres(process.env.DATABASE_URL!);

  try {
    console.log('🔧 Fixing missing ORGANIZATION_TYPE step in onboarding states...\n');

    // Get all onboarding states
    const states = await sql`
      SELECT id, tenant_id, steps, max_points
      FROM onboarding_states
    `;

    console.log(`Found ${states.length} onboarding state(s)\n`);

    for (const state of states) {
      const steps = (typeof state.steps === 'string' ? JSON.parse(state.steps) : state.steps) as any[];
      
      // Check if ORGANIZATION_TYPE step exists
      const hasOrgType = steps.some((s: any) => s.stepId === 'ORGANIZATION_TYPE');
      
      if (!hasOrgType) {
        console.log(`Tenant ${state.tenant_id}: Missing ORGANIZATION_TYPE step`);
        
        // Check if tenant has businessType set
        const [tenant] = await sql`
          SELECT business_type FROM tenants WHERE id = ${state.tenant_id}
        `;
        
        const isCompleted = tenant && tenant.business_type && tenant.business_type !== 'default';
        
        // Add ORGANIZATION_TYPE step at the beginning
        const orgTypeStep = {
          stepId: 'ORGANIZATION_TYPE',
          label: 'Organization Type',
          status: isCompleted ? 'COMPLETED' : 'NOT_STARTED',
          pointsEarned: isCompleted ? 5 : 0,
          pointsPossible: 5,
          orderIndex: 0,
          isRequired: true,
          estimatedMinutes: 1,
          ...(isCompleted ? { completedAt: new Date().toISOString() } : {})
        };
        
        // Re-index existing steps
        const updatedSteps = [
          orgTypeStep,
          ...steps.map((s: any) => ({
            ...s,
            orderIndex: s.orderIndex + 1
          }))
        ];
        
        // Recalculate totals
        const totalPoints = updatedSteps.reduce((sum: number, s: any) => sum + (s.pointsEarned || 0), 0);
        const newMaxPoints = state.max_points + 5;
        const percentComplete = Math.round((totalPoints / newMaxPoints) * 100);
        
        // Update the database
        await sql`
          UPDATE onboarding_states
          SET 
            steps = ${JSON.stringify(updatedSteps)},
            max_points = ${newMaxPoints},
            total_points = ${totalPoints},
            percent_complete = ${percentComplete},
            updated_at = NOW()
          WHERE id = ${state.id}
        `;
        
        console.log(`  ✅ Added step (status: ${orgTypeStep.status})`);
        console.log(`  📊 Updated: ${totalPoints}/${newMaxPoints} points (${percentComplete}%)\n`);
      } else {
        console.log(`Tenant ${state.tenant_id}: Already has ORGANIZATION_TYPE step ✓\n`);
      }
    }

    console.log('✅ Migration complete!');
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await sql.end();
    process.exit(1);
  }
}

fixOnboardingOrgType();
