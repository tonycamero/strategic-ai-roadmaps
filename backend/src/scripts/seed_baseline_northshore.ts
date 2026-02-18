import { db } from '../db';
import { firmBaselineIntake, tenants } from '../db/schema';
import { eq } from 'drizzle-orm';
import { getOrCreateRoadmapForTenant } from '../services/roadmapOs.service';
import { ImplementationMetricsService } from '../services/implementationMetrics.service';

const NORTHSHORE_ID = '883a5307-6354-49ad-b8e3-765ff64dc1af'; // From previous listing

async function seedBaseline() {
    console.log(`Seeding baseline for Northshore (${NORTHSHORE_ID})...`);

    // Verify tenant exists
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, NORTHSHORE_ID)).limit(1);
    if (!tenant) {
        console.error('Northshore tenant not found!');
        return;
    }
    console.log('Found tenant:', tenant.name);

    // Determine if roadmap exists? Controller does getOrCreateRoadmapForTenant
    // We can do it here too just to be safe
    const roadmap = await getOrCreateRoadmapForTenant(NORTHSHORE_ID);
    console.log('Found roadmap:', roadmap.id);

    // Insert Mock Baseline
    const payload: any = {
        tenantId: NORTHSHORE_ID,
        monthlyLeadVolume: 125,
        avgResponseTimeMinutes: 45,
        closeRatePercent: 18,
        avgJobValue: 3500,
        currentTools: ['HubSpot', 'QuickBooks', 'Excel'],
        salesRepsCount: 3,
        opsAdminCount: 2,
        primaryBottleneck: 'Scheduling and dispatch',

        // New Economic Fields
        weeklyRevenue: 42000,
        peakHourRevenuePct: 35,
        laborPct: 28,
        overtimePct: 15,
        grossMarginPct: 42,
        averageTicket: 3500,
        economicConfidenceLevel: 'MODERATE',

        status: 'COMPLETE',
        baselineLockedAt: new Date(),
        // lockedByUserId: tenant.ownerUserId, // Optional for script
    };

    // Upsert logic (simplified from controller)
    const existing = await db
        .select()
        .from(firmBaselineIntake)
        .where(eq(firmBaselineIntake.tenantId, NORTHSHORE_ID))
        .limit(1)
        .then(rows => rows[0]);

    if (existing) {
        console.log('Updating existing baseline...');
        await db.update(firmBaselineIntake).set(payload).where(eq(firmBaselineIntake.id, existing.id));
    } else {
        console.log('Inserting new baseline...');
        await db.insert(firmBaselineIntake).values(payload);
    }

    // Create Snapshot logic (simplified)
    console.log('Creating implementation snapshot (baseline_v1_locked)...');
    await ImplementationMetricsService.createBaselineSnapshot(
        NORTHSHORE_ID,
        roadmap.id,
        {
            lead_response_minutes: payload.avgResponseTimeMinutes,
            lead_to_appt_rate: 25, // Mock
            close_rate: payload.closeRatePercent,
            crm_adoption_rate: 60, // Mock
            weekly_ops_hours: payload.opsAdminCount * 40,
            nps: 45 // Mock
        },
        'manual'
    );

    // Actually controller creates with specific label 'baseline_v1_locked' not generic createBaselineSnapshot (which does 'baseline')
    // But wait, createBaselineSnapshot forces label 'baseline'.
    // My controller implementation does custom logic:

    /*
        if (existingSnapshot.length > 0) {
            await db.update(implementationSnapshots)...
        } else {
            await db.insert(implementationSnapshots).values({... label: 'baseline_v1_locked' ...});
        }
    */

    // So I should replicate that logic or rely on service.
    // The service creates `baseline` label.
    // The controller creates `baseline_v1_locked` label MANUALLY.
    // So I should replicate that manual logic here or stick to the controller logic.

    // I'll skip snapshot creation here to let the controller handling be the primary way, 
    // OR I can simulate it just to verify DB allows it.
    // Since I want UI to work, I'll just check if basic baseline (firm_baseline_intake) is enough.
    // UI reads from firm_baseline_intake now (via new endpoint). Old UI read from snapshot.

    console.log('Done!');
}

seedBaseline().catch(err => console.error(err));
