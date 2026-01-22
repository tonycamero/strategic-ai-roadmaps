import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkOnboardingState() {
    const sql = postgres(process.env.DATABASE_URL!);

    const HAYES_TENANT_ID = '4e2c6eb1-0767-43d6-b6a4-3fca8efd3f64';

    console.log('\n🔍 ONBOARDING STATE CHECK\n');
    console.log('='.repeat(60));

    // Check onboarding state
    const onboarding = await sql`
    SELECT *
    FROM onboarding_states
    WHERE tenant_id = ${HAYES_TENANT_ID}
  `;

    if (onboarding.length === 0) {
        console.log('❌ No onboarding state found for Hayes Real Estate');
    } else {
        const state = onboarding[0];
        console.log('\n📊 Onboarding State:');
        console.log(`  Percent Complete: ${state.percent_complete}%`);
        console.log(`  Total Points: ${state.total_points}/${state.max_points}`);
        console.log(`  Created: ${state.created_at}`);
        console.log(`  Updated: ${state.updated_at}`);

        console.log('\n📋 Steps:');
        const steps = state.steps as any[];
        if (steps && steps.length > 0) {
            steps.forEach((step: any) => {
                const status = step.status === 'COMPLETED' ? '✅' : step.status === 'IN_PROGRESS' ? '🔄' : '⭕';
                console.log(`  ${status} ${step.key}: ${step.status} (${step.points} points)`);
            });
        } else {
            console.log('  (no steps defined)');
        }

        console.log('\n🏆 Badges:');
        const badges = state.badges as any[];
        if (badges && badges.length > 0) {
            badges.forEach((badge: any) => {
                console.log(`  🎖️  ${badge.key}: ${badge.label}`);
            });
        } else {
            console.log('  (no badges earned)');
        }
    }

    // Check what should be complete
    console.log('\n\n✅ EXPECTED STATE (based on completed work):');

    const intakes = await sql`
    SELECT COUNT(*) as count
    FROM intakes
    WHERE tenant_id = ${HAYES_TENANT_ID} AND status = 'completed'
  `;
    console.log(`  Intakes completed: ${intakes[0].count}/4`);

    const diagnostics = await sql`
    SELECT COUNT(*) as count
    FROM sop_tickets
    WHERE tenant_id = ${HAYES_TENANT_ID}
  `;
    console.log(`  Diagnostic tickets: ${diagnostics[0].count}`);

    const roadmapSections = await sql`
    SELECT COUNT(*) as count
    FROM roadmap_sections rs
    JOIN roadmaps r ON rs.roadmap_id = r.id
    WHERE r.tenant_id = ${HAYES_TENANT_ID}
  `;
    console.log(`  Roadmap sections: ${roadmapSections[0].count}`);

    console.log('\n' + '='.repeat(60));
    await sql.end();
}

checkOnboardingState().catch(console.error);
