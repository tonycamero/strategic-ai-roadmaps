import 'dotenv/config';
import { db } from '../src/db/index.js';
import { tenants, roadmaps } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';
import { ImplementationMetricsService } from '../src/services/implementationMetrics.service.js';

async function backfill() {
    const tenantName = 'BrightFocus Marketing';
    console.log(`🔍 Finding tenant: ${tenantName}`);

    const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.name, tenantName),
    });

    if (!tenant) {
        console.error('❌ Tenant not found');
        process.exit(1);
    }

    const tenantId = tenant.id;
    const roadmap = await db.query.roadmaps.findFirst({
        where: eq(roadmaps.tenantId, tenantId),
    });

    if (!roadmap) {
        console.error('❌ Roadmap not found');
        process.exit(1);
    }

    console.log(`⚖️ Computing outcome for Roadmap: ${roadmap.id}`);

    try {
        const outcome = await ImplementationMetricsService.createOutcomeForRoadmap({
            tenantId,
            roadmapId: roadmap.id,
        });

        console.log('✅ Outcome computed successfully:');
        console.log(JSON.stringify(outcome, null, 2));
    } catch (error) {
        console.error('❌ Error computing outcome:', error);
        process.exit(1);
    }

    process.exit(0);
}

backfill();
