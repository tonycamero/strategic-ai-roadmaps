import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, inArray } from 'drizzle-orm';
import * as schema from '../db/schema';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * META-TICKET SA-INTAKE-SEMANTIC-RETROFIT-1
 * Objective: Retrofit migrated (legacy) intake data to conform to the current semantic contract.
 */

async function runRetrofit() {
    console.log('🚀 Starting SA-INTAKE-SEMANTIC-RETROFIT-1...');

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is not set');
    }

    const client = postgres(connectionString);
    const db = drizzle(client, { schema });

    // 1. Fetch all completed intakes
    const allIntakes = await db
        .select()
        .from(schema.intakes)
        .where(eq(schema.intakes.status, 'completed'));

    console.log(`Found ${allIntakes.length} completed intakes to process.`);

    const affectedTenants = new Set<string>();
    let processedCount = 0;

    for (const intake of allIntakes) {
        affectedTenants.add(intake.tenantId);
        const answers = intake.answers as Record<string, any>;

        // --- A) ROLE METADATA ---
        const roleLabelRaw = answers['ROLE_LABEL'] || answers['role_label'] || intake.role || 'Other';
        let roleType: string = 'OTHER';

        const labelLower = roleLabelRaw.toLowerCase();
        if (labelLower.includes('owner') || labelLower.includes('executive') || labelLower.includes('coo') || labelLower.includes('ceo') || labelLower.includes('principal')) {
            roleType = 'EXECUTIVE';
        } else if (labelLower.includes('ops') || labelLower.includes('operations') || labelLower.includes('fulfillment')) {
            roleType = 'OPERATIONAL_LEAD';
        } else if (labelLower.includes('sales')) {
            roleType = 'SALES_LEAD';
        } else if (labelLower.includes('delivery')) {
            roleType = 'DELIVERY_LEAD';
        }

        // --- C) PERCEIVED CONSTRAINTS ---
        const constraintFields = [
            'biggest_frustration',
            'growth_barriers',
            'volume_breaking_point',
            'ext_authority_bottleneck',
            'owner_bottlenecks',
            'team_bottlenecks'
        ];
        const perceivedConstraints = constraintFields
            .map(f => answers[f.toUpperCase()] || answers[f])
            .filter(Boolean)
            .join('; ');

        // --- D) ANTICIPATED BLIND SPOTS ---
        const blindSpotFields = [
            'ext_decision_regret',
            'ext_silence_interpretation',
            'ext_behavioral_drift',
            'risks_if_push_too_fast',
            'biggest_risk_if_push_too_fast'
        ];
        const anticipatedBlindSpots = blindSpotFields
            .map(f => answers[f.toUpperCase()] || answers[f])
            .filter(Boolean)
            .join('; ');

        // --- B) OPERATING REALITY ---
        const realityFields = [
            'workflow_stuck', 'systems_struggles', 'communication_breakdown',
            'manual_firefighting', 'delivery_process', 'project_management',
            'current_systems', 'sales_process', 'conversion_challenges'
        ];
        const operatingReality = realityFields
            .map(f => answers[f.toUpperCase()] || answers[f])
            .filter(Boolean)
            .join('\n');

        // --- E) ALIGNMENT SIGNALS ---
        const alignmentFields = [
            'top_priorities', 'ideal_state', 'top_3_goals_next_90_days', 'if_nothing_else_changes_but_x'
        ];
        const alignmentSignals = alignmentFields
            .map(f => answers[f.toUpperCase()] || answers[f])
            .filter(Boolean)
            .join('\n');

        // --- F) RISK SIGNALS ---
        const riskFields = [
            'biggest_risk_if_push_too_fast', 'change_readiness'
        ];
        let riskSignalsRaw = riskFields
            .map(f => answers[f.toUpperCase()] || answers[f])
            .filter(Boolean)
            .join('\n');

        // Automation opportunities concern check (STRICT NON-INFERENCE)
        const automationOpp = answers['AUTOMATION_OPPORTUNITIES'] || answers['automation_opportunities'];
        if (automationOpp) {
            const riskKeywords = ['worry', 'risk', 'fear', 'concern', 'problem', 'issue', 'threat', 'difficult', 'barrier', 'danger'];
            if (riskKeywords.some(k => (automationOpp as string).toLowerCase().includes(k))) {
                riskSignalsRaw += (riskSignalsRaw ? '\n' : '') + automationOpp;
            }
        }

        // --- G) READINESS SIGNALS ---
        const readinessFields = [
            'change_readiness', 'weekly_capacity_for_implementation_hours', 'do_not_automate', 'non_goals'
        ];
        const readinessSignals = readinessFields
            .map(f => answers[f.toUpperCase()] || answers[f])
            .filter(v => v !== null && v !== undefined && v !== '')
            .map(v => String(v))
            .join('\n');

        // --- Persistence ---

        // Find or Create Intake Vector
        const [existingVector] = await db
            .select()
            .from(schema.intakeVectors)
            .where(eq(schema.intakeVectors.intakeId, intake.id))
            .limit(1);

        const semanticBuckets = {
            operatingReality,
            alignmentSignals,
            riskSignals: riskSignalsRaw,
            readinessSignals,
            retrofittedAt: new Date().toISOString()
        };

        const metadata: any = {
            ...((existingVector?.metadata as any) || {}),
            sourceTag: intake.role === 'owner' ? 'OWNER_INTAKE' : 'LEGACY_INTAKE',
            semanticBuckets
        };

        if (existingVector) {
            await db.update(schema.intakeVectors)
                .set({
                    roleLabel: roleLabelRaw,
                    roleType: roleType as any,
                    perceivedConstraints,
                    anticipatedBlindSpots,
                    metadata,
                    updatedAt: new Date()
                })
                .where(eq(schema.intakeVectors.id, existingVector.id));
        } else {
            await db.insert(schema.intakeVectors)
                .values({
                    tenantId: intake.tenantId,
                    intakeId: intake.id,
                    roleLabel: roleLabelRaw,
                    roleType: roleType as any,
                    perceivedConstraints,
                    anticipatedBlindSpots,
                    metadata,
                    inviteStatus: 'SENT',
                    updatedAt: new Date(),
                    createdAt: new Date()
                });
        }

        processedCount++;
    }

    // --- RESET REQUIREMENT (MANDATORY) ---
    console.log(`\n🧹 RESET REQUIREMENT: Clearing executive briefs for ${affectedTenants.size} tenants...`);

    if (affectedTenants.size > 0) {
        // Deleting rows ensures next generation run reflects corrected semantics.
        const deleteResult = await db.delete(schema.executiveBriefs)
            .where(inArray(schema.executiveBriefs.tenantId, Array.from(affectedTenants)));

        console.log(`Removed existing executive brief records.`);
    }

    console.log(`\n✅ RETROFIT COMPLETE`);
    console.log(`Total Intakes Processed: ${processedCount}`);
    console.log(`Affected Tenants: ${affectedTenants.size}`);

    await client.end();
}

runRetrofit().catch(error => {
    console.error('❌ Retrofit failed:', error);
    process.exit(1);
});
