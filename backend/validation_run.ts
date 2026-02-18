import { buildNormalizedIntakeContext } from './src/services/intakeNormalizer.ts';
import { buildSelectionContext, selectInventoryTickets } from './src/trustagent/services/inventorySelection.service.ts';
import { db } from './src/db/index.ts';
import { tenants, intakes } from './src/db/schema.ts';
import { eq } from 'drizzle-orm';
import { loadInventory } from './src/trustagent/services/inventory.service.ts';

async function validationRun() {
    const cascadeName = 'Cascade Climate Solutions';
    const allTenants = await db.select().from(tenants);
    const cascade = allTenants.find(t => t.name.toLowerCase().includes('cascade'));

    if (!cascade) {
        console.error('Cascade Climate Solutions not found');
        return;
    }

    const tenantId = cascade.id;

    // 1. Load NormalizedIntakeContext
    const normalized = await buildNormalizedIntakeContext(tenantId);
    const rawIntakes = await db.select().from(intakes).where(eq(intakes.tenantId, tenantId));

    console.log('--- 1. NormalizedIntakeContext ---');
    console.log('firmSizeTier:', (normalized as any).firmSizeTier || 'REJECTED/MISSING (Current DB has micro-tier headcount)');
    console.log('chokePoints:', JSON.stringify(normalized.chokePoints, null, 2));
    console.log('contradictions:', JSON.stringify(normalized.contradictions, null, 2));
    console.log('rolePatterns:', JSON.stringify((normalized as any).rolePatterns || 'MISSING (Logic not present)', null, 2));

    // 2. buildSelectionContext
    const diagnosticMap = {
        chokePoints: normalized.chokePoints,
        contradictions: normalized.contradictions,
        matrixView: normalized.matrixView
    };
    const selectionContext = buildSelectionContext({
        name: cascade.name,
        vertical: cascade.vertical,
        teamHeadcount: cascade.teamHeadcount
    }, diagnosticMap);

    console.log('\n--- 2. buildSelectionContext ---');
    console.log('deliveryBottlenecks:', selectionContext.diagnosticSignals.deliveryBottlenecks || 'FALSE (Logic not present or regex miss)');
    console.log('teamCoordinationPain:', selectionContext.diagnosticSignals.teamCoordinationPain);
    console.log('pipelinePain:', selectionContext.diagnosticSignals.pipelinePain);
    console.log('reportingPain:', selectionContext.diagnosticSignals.reportingPain);

    // 3. Resolved ConstraintProfile
    console.log('\n--- 3. Resolved ConstraintProfile ---');
    console.log('LOGIC MISSING IN CURRENT CODEBASE');

    // 4. deriveDeterministicAICandidates
    console.log('\n--- 4. deriveDeterministicAICandidates ---');
    console.log('LOGIC MISSING IN CURRENT CODEBASE');

    // 5. selectInventoryTickets Phase 1
    const allInventory = loadInventory();
    const selected = selectInventoryTickets(selectionContext, allInventory);
    const phase1 = selected.filter(t => t.tier === 'core' && t.sprint === 30);

    console.log('\n--- 5. selectInventoryTickets Phase 1 (Core/Sprint 30) ---');
    phase1.forEach((t, i) => {
        console.log(`${i + 1}. [${t.category}] ${t.inventoryId} - ${t.titleTemplate}`);
    });

    console.log('\n--- RAW INTAKE SNIPPETS (For Analysis) ---');
    rawIntakes.forEach(it => {
        console.log(`Role: ${it.role}`);
        if (it.answers) {
            const a = it.answers as any;
            if (a.top_priorities) console.log(`  Priorities: ${a.top_priorities}`);
            if (a.biggest_frustration) console.log(`  Frustration: ${a.biggest_frustration}`);
            if (a.team_bottlenecks) console.log(`  Bottlenecks: ${a.team_bottlenecks}`);
            if (a.growth_barriers) console.log(`  Barriers: ${a.growth_barriers}`);
        }
    })
}

validationRun().catch(console.error);
