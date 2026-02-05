
import fs from 'fs';
import path from 'path';
import { db } from '../db';
import { tenants, executiveBriefs } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { renderPrivateLeadershipBriefToPDF } from '../services/pdf/executiveBriefRenderer';

// Minimal args parser
const args = process.argv.slice(2);
const tenantIdsArgIndex = args.indexOf('--tenant');
let tenantIds: string[] = [];

if (tenantIdsArgIndex !== -1) {
    // Simple parse: grab all args after first --tenant assuming basic usage or repeated flags
    // Actually, standard is repeated flags: --tenant id1 --tenant id2
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--tenant' && args[i + 1]) {
            tenantIds.push(args[i + 1]);
            i++;
        }
    }
} else {
    // Fallback / direct call check (legacy support if needed)
}

if (tenantIds.length === 0) {
    console.error("Usage: tsx run_narrative_batch.ts --tenant <ID> --tenant <ID>");
    process.exit(1);
}

const TIMESTAMP = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14); // YYYYMMDDHHMMSS
// Use absolute path relative to repo root (assuming cwd is backend)
const OUTPUT_ROOT = path.resolve(__dirname, '../../../docs/narrative-tests', TIMESTAMP);

async function runBatch() {
    console.log(`Starting Narrative Batch for ${tenantIds.length} tenants...`);
    console.log(`Output Directory: ${OUTPUT_ROOT}`);

    if (!fs.existsSync(OUTPUT_ROOT)) {
        fs.mkdirSync(OUTPUT_ROOT, { recursive: true });
    }

    const manifest: any = {
        timestamp: new Date().toISOString(),
        tenants: [],
        command: process.argv.join(' ')
    };

    let failureCount = 0;

    for (const id of tenantIds) {
        const tenantEntry: any = { id, status: 'pending' };
        manifest.tenants.push(tenantEntry);

        try {
            console.log(`\nProcessing Tenant: ${id}`);

            // 1. Fetch Tenant
            const tenant = await db.query.tenants.findFirst({
                where: eq(tenants.id, id)
            });

            if (!tenant) {
                throw new Error(`Tenant not found: ${id}`);
            }
            tenantEntry.name = tenant.name;

            // 2. Fetch Brief
            const brief = await db.query.executiveBriefs.findFirst({
                where: eq(executiveBriefs.tenantId, id),
                orderBy: [desc(executiveBriefs.createdAt)]
            });

            if (!brief) {
                throw new Error(`No Executive Brief found for tenant ${id}`);
            }
            tenantEntry.briefId = brief.id;

            // 3. Prepare Tenant Output Dir
            const tenantDir = path.join(OUTPUT_ROOT, tenant.name.replace(/[^a-zA-Z0-9]/g, '_'));
            if (!fs.existsSync(tenantDir)) {
                fs.mkdirSync(tenantDir, { recursive: true });
            }

            // 4. Dump Data JSON
            const jsonPath = path.join(tenantDir, 'executive_brief_data.json');
            fs.writeFileSync(jsonPath, JSON.stringify(brief, null, 2));
            console.log(`   - Data JSON saved: ${jsonPath}`);

            // 5. Render PDF
            console.log(`   - Rendering PDF...`);
            // Using existing service renderer directly
            const pdfBuffer = await renderPrivateLeadershipBriefToPDF(brief, tenant.name);

            const pdfPath = path.join(tenantDir, 'executive_brief.pdf');
            fs.writeFileSync(pdfPath, pdfBuffer);
            console.log(`   - PDF saved: ${pdfPath}`);

            tenantEntry.status = 'success';
            tenantEntry.files = {
                json: jsonPath,
                pdf: pdfPath,
                pdfSize: pdfBuffer.length
            };

        } catch (error: any) {
            console.error(`   ❌ Failed: ${error.message}`);
            tenantEntry.status = 'error';
            tenantEntry.error = error.message;
            tenantEntry.stack = error.stack;

            // Write error log to tenant dir if possible, else root
            const errorLogPath = path.join(OUTPUT_ROOT, `error_${id}.log`);
            fs.writeFileSync(errorLogPath, `Error processing ${id}:\n${error.stack || error.message}`);

            failureCount++;
        }
    }

    // Write Manifest
    fs.writeFileSync(path.join(OUTPUT_ROOT, 'run_manifest.json'), JSON.stringify(manifest, null, 2));
    console.log(`\nBatch Complete. Manifest saved.`);

    if (failureCount === tenantIds.length) {
        console.error("All tenants failed.");
        process.exit(1);
    }
}

// Env check wrapper
if (!process.env.DATABASE_URL) {
    // Try to load from default locations if not set
    require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
}

runBatch().then(() => process.exit(0)).catch(e => {
    console.error("Fatal Batch Error:", e);
    process.exit(1);
});
