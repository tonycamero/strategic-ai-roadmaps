
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '.env') });

import { generateRawTickets } from './src/services/diagnosticIngestion.service';
import { db } from './src/db';
import { eq } from 'drizzle-orm';
import { tenants, tenantDocuments } from './src/db/schema';

const TENANT_ID = '883a5307-6354-49ad-b8e3-765ff64dc1af';
const OUTPUT_DIR = path.resolve(__dirname, '../docs/canonical-runs/northshore-logistics');

async function main() {
    console.log(`--- GENERATING FRESH CANONICAL BASELINE FOR ${TENANT_ID} ---`);

    try {
        // 1. Get Inputs
        const tenantInfo = await db.select().from(tenants).where(eq(tenants.id, TENANT_ID)).limit(1);
        const docs = await db.select().from(tenantDocuments).where(eq(tenantDocuments.tenantId, TENANT_ID));

        const artifacts: any = {};
        docs.forEach(d => {
            artifacts[d.category] = d;
        });

        // Map titles to categories for robustness
        const findByTitle = (title: string) => docs.find((a: any) => a.title === title) || docs.find((a: any) => a.category === title);

        const mappedArtifacts = {
            sop01DiagnosticMarkdown: findByTitle('Company Diagnostic Map'),
            sop01AiLeverageMarkdown: findByTitle('AI Leverage & Opportunity Map'),
            sop01RoadmapSkeletonMarkdown: findByTitle('Strategic Roadmap Skeleton'),
            sop01DiscoveryQuestionsMarkdown: findByTitle('Discovery Call Preparation Questions'),
            diagnosticMap: findByTitle('Canonical Findings (Operator Reviewed)') || findByTitle('Company Diagnostic Map')
        };

        // 2. Generate
        console.log('Executing live generation for baseline...');
        const tickets = await generateRawTickets(TENANT_ID, tenantInfo[0], mappedArtifacts);

        // 3. Save
        fs.writeFileSync(path.join(OUTPUT_DIR, 'tickets.json'), JSON.stringify(tickets, null, 2));
        console.log('✓ Updated tickets.json with deterministic v1.0.0 baseline');

        const manifest = {
            tenant_id: TENANT_ID,
            tenant_name: tenantInfo[0]?.name,
            timestamp: new Date().toISOString(),
            model_id: 'gpt-4o',
            authority_version: '1.0.0',
            ticket_count: tickets.length,
            status: 'LOCKED'
        };
        fs.writeFileSync(path.join(OUTPUT_DIR, 'run_manifest.json'), JSON.stringify(manifest, null, 2));
        console.log('✓ Updated run_manifest.json');

    } catch (e) {
        console.error('Baseline generation failed:', e);
    }
    process.exit(0);
}

main();
