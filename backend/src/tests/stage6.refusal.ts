
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { generateRawTickets, ArtifactNotFoundError, InventoryEmptyError } from '../services/diagnosticIngestion.service';

async function runRefusalTests() {
    console.log('--- STAGE 6 AUTHORITY REFUSAL TESTS ---');
    const tenantId = 'test-tenant-refusal';
    const fakeTenant: any = { id: tenantId, name: 'Refusal Test Firm' };

    let passCount = 0;
    let failCount = 0;

    const assertThrows = async (name: string, fn: () => Promise<any>, errorClass: any) => {
        try {
            await fn();
            console.error(`✖ ${name}: Expected error ${errorClass.name} but it succeeded`);
            failCount++;
        } catch (e: any) {
            if (e instanceof errorClass) {
                console.log(`✓ ${name}: Correctly threw ${errorClass.name}`);
                passCount++;
            } else {
                console.error(`✖ ${name}: Threw ${e.name} instead of ${errorClass.name}`);
                failCount++;
            }
        }
    };

    // 1. Missing Roadmaps
    await assertThrows('Missing Roadmap Skeleton Artifact', async () => {
        await generateRawTickets(tenantId, fakeTenant, {
            sop01DiagnosticMarkdown: { markdown: '# Diag', category: 'findings_canonical' },
            sop01AiLeverageMarkdown: { markdown: '# AI', category: 'ai_leverage_map' },
            sop01RoadmapSkeletonMarkdown: null, // Missing
            sop01DiscoveryQuestionsMarkdown: { markdown: '# Discovery', category: 'discovery_questions' }
        });
    }, ArtifactNotFoundError);

    // 2. Empty Roadmap Skeleton (Length 0)
    await assertThrows('Empty Roadmap Skeleton', async () => {
        await generateRawTickets(tenantId, fakeTenant, {
            sop01DiagnosticMarkdown: { markdown: '# Diag' },
            sop01AiLeverageMarkdown: { markdown: '# AI' },
            sop01RoadmapSkeletonMarkdown: { markdown: '', category: 'roadmap_skeleton' },
            sop01DiscoveryQuestionsMarkdown: { markdown: '# Discovery' }
        });
    }, ArtifactNotFoundError);

    // 3. Roadmap Skeleton with no inventory (no bullet points)
    await assertThrows('Roadmap Skeleton No Inventory', async () => {
        await generateRawTickets(tenantId, fakeTenant, {
            sop01DiagnosticMarkdown: { markdown: '# Diag' },
            sop01AiLeverageMarkdown: { markdown: '# AI' },
            sop01RoadmapSkeletonMarkdown: { markdown: '# Phase 1\nThis has no tickets.', category: 'roadmap_skeleton' },
            sop01DiscoveryQuestionsMarkdown: { markdown: '# Discovery' }
        });
    }, InventoryEmptyError);

    console.log(`\nResults: ${passCount} passed, ${failCount} failed.`);
    if (failCount > 0) process.exit(1);
    process.exit(0);
}

runRefusalTests().catch(e => {
    console.error('Refusal tests crashed:', e);
    process.exit(1);
});
