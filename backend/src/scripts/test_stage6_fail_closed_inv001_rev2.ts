import 'dotenv/config';
import { generateRawTickets, InventoryEmptyError } from '../services/diagnosticIngestion.service.ts';
import { randomUUID } from 'crypto';

async function runIntegrationTests() {
    console.log('🧪 Running Integration Test: Stage 6 Fail-Closed (SAR-STAGE6-PARSER-FIX-INV001-REV2)\n');
    let failures = 0;

    const assert = (condition: boolean, message: string) => {
        if (condition) {
            console.log(`✅ PASS: ${message}`);
        } else {
            console.error(`❌ FAIL: ${message}`);
            failures++;
        }
    };

    const tenantId = randomUUID();

    // --- 1. Fail-Closed Path (Empty Inventory) ---
    console.log('\n--- 1. Fail-Closed Path ---');
    const emptyArtifacts = {
        diagnosticMap: { id: 'art1', content: 'Empty diagnostic' },
        aiLeverageMap: { id: 'art2', content: 'Empty AI' },
        roadmapSkeleton: { id: 'art3', content: 'Empty Skeleton (no bullets)' },
        discoveryQuestions: { id: 'art4', content: 'Empty Questions' },
    };

    try {
        await generateRawTickets(tenantId, { firmName: 'FailCorp' }, emptyArtifacts);
        assert(false, 'Should have thrown InventoryEmptyError');
    } catch (e: any) {
        if (e instanceof InventoryEmptyError) {
            assert(true, 'Correctly threw InventoryEmptyError on empty inventory');
            assert(e.debug.artifactIds.includes('art3'), 'Error payload includes Skeleton artifact ID');
            assert(e.debug.countsByArtifactType.ROADMAP_SKELETON === 0, 'Error payload counts are correct');
            assert(e.debug.parserSignature === 'extractInventoryFromArtifacts/v2', 'Error payload has correct parser signature');
        } else {
            assert(false, `Threw unexpected error type: ${e.name}`);
        }
    }

    // --- 2. Validation Path (Missing Artifact objects/strings) ---
    console.log('\n--- 2. Missing Artifact Path ---');
    try {
        await generateRawTickets(tenantId, {}, { diagnosticMap: null });
        assert(false, 'Should have thrown ArtifactNotFoundError');
    } catch (e: any) {
        assert(e.name === 'ArtifactNotFoundError', 'Correctly threw ArtifactNotFoundError on missing artifacts');
    }

    console.log(`\nTests Complete. Failures: ${failures}`);
    if (failures > 0) {
        process.exit(1);
    } else {
        console.log('\n🌟 ALL INTEGRATION TESTS PASSED');
        process.exit(0);
    }
}

runIntegrationTests().catch(err => {
    console.error('Fatal Integration Test Error:', err);
    process.exit(1);
});
