import { db } from '../db';
import { onboardingStates } from '../db/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

const HAYES_TENANT_ID = '4e2c6eb1-0767-43d6-b6a4-3fca8efd3f64';

async function updateOnboardingState() {
    console.log('\n🔧 UPDATING ONBOARDING STATE FOR HAYES\n');
    console.log('='.repeat(60));

    // Get current state
    const currentState = await db.query.onboardingStates.findFirst({
        where: eq(onboardingStates.tenantId, HAYES_TENANT_ID)
    });

    if (!currentState) {
        console.log('❌ No onboarding state found - creating one...');

        // Create initial state with all steps completed
        const steps = [
            { key: 'OWNER_INTAKE', label: 'Owner Intake', status: 'COMPLETED', points: 20 },
            { key: 'TEAM_INTAKES', label: 'Team Intakes', status: 'COMPLETED', points: 30 },
            { key: 'DIAGNOSTIC_GENERATED', label: 'Diagnostic Generated', status: 'COMPLETED', points: 30 },
            { key: 'ROADMAP_DELIVERED', label: 'Roadmap Delivered', status: 'COMPLETED', points: 40 }
        ];

        const totalPoints = steps.reduce((sum, s) => sum + s.points, 0);
        const percentComplete = 100;

        await db.insert(onboardingStates).values({
            tenantId: HAYES_TENANT_ID,
            percentComplete,
            totalPoints,
            maxPoints: 120,
            steps: steps as any,
            badges: [],
            createdAt: new Date(),
            updatedAt: new Date()
        });

        console.log('✅ Created onboarding state with all steps completed');
    } else {
        console.log('📊 Current state found, updating...');

        // Update existing state
        const steps = currentState.steps as any[] || [];

        // Mark all key steps as completed
        const stepKeys = ['OWNER_INTAKE', 'TEAM_INTAKES', 'DIAGNOSTIC_GENERATED', 'ROADMAP_DELIVERED'];
        const updatedSteps = steps.map(step => {
            if (stepKeys.includes(step.key)) {
                return { ...step, status: 'COMPLETED' };
            }
            return step;
        });

        // Add any missing steps
        const existingKeys = updatedSteps.map(s => s.key);
        const defaultSteps = [
            { key: 'OWNER_INTAKE', label: 'Owner Intake', status: 'COMPLETED', points: 20 },
            { key: 'TEAM_INTAKES', label: 'Team Intakes', status: 'COMPLETED', points: 30 },
            { key: 'DIAGNOSTIC_GENERATED', label: 'Diagnostic Generated', status: 'COMPLETED', points: 30 },
            { key: 'ROADMAP_DELIVERED', label: 'Roadmap Delivered', status: 'COMPLETED', points: 40 }
        ];

        defaultSteps.forEach(defaultStep => {
            if (!existingKeys.includes(defaultStep.key)) {
                updatedSteps.push(defaultStep);
            }
        });

        const totalPoints = updatedSteps
            .filter(s => s.status === 'COMPLETED')
            .reduce((sum, s) => sum + (s.points || 0), 0);

        const percentComplete = Math.min(100, Math.round((totalPoints / 120) * 100));

        await db.update(onboardingStates)
            .set({
                steps: updatedSteps as any,
                totalPoints,
                percentComplete,
                updatedAt: new Date()
            })
            .where(eq(onboardingStates.tenantId, HAYES_TENANT_ID));

        console.log('✅ Updated onboarding state');
        console.log(`   Percent Complete: ${percentComplete}%`);
        console.log(`   Total Points: ${totalPoints}/120`);
        console.log('\n   Steps:');
        updatedSteps.forEach(step => {
            const status = step.status === 'COMPLETED' ? '✅' : '⭕';
            console.log(`   ${status} ${step.label}: ${step.status}`);
        });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ DONE - Refresh the UI to see updated progress\n');
}

updateOnboardingState()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
