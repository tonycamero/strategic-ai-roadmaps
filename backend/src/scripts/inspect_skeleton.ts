
import dotenv from 'dotenv';
import path from 'path';
import { sql } from 'drizzle-orm';

const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

async function inspectSkeleton() {
    try {
        const { db } = await import('../db/index');
        const { tenantDocuments } = await import('../db/schema');
        const { eq, and } = await import('drizzle-orm');

        const tenantId = '883a5307-6354-49ad-b8e3-765ff64dc1af'; // From user logs

        const docs = await db
            .select({
                category: tenantDocuments.category,
                outputNumber: tenantDocuments.outputNumber,
                content: tenantDocuments.content,
                createdAt: tenantDocuments.createdAt
            })
            .from(tenantDocuments)
            .where(and(
                eq(tenantDocuments.tenantId, tenantId),
                eq(tenantDocuments.category, 'sop_output'),
                eq(tenantDocuments.outputNumber, 'ROADMAP_SKELETON')
            ))
            .limit(1);

        if (docs.length === 0) {
            console.log('❌ NO ROADMAP_SKELETON FOUND');
        } else {
            console.log('✅ FOUND ROADMAP_SKELETON');
            const content = docs[0].content || '';
            const lines = content.split('\n');

            console.log(`\nTesting Extraction on ${lines.length} lines...`);
            const inventory = [];
            const bulletRegex = /^\s*-\s*(.*)/;

            for (const line of lines) {
                const bMatch = line.match(bulletRegex);
                if (bMatch) {
                    const clean = bMatch[1].replace(/\*\*/g, '').trim();
                    if (clean.length > 5) {
                        inventory.push(clean);
                        console.log(`   found: "${clean}"`);
                    }
                }
            }

            console.log(`\n📊 Total Inventory Items Found: ${inventory.length}`);
            if (inventory.length > 0) {
                console.log('✅ PARSER FIX VERIFIED!');
            } else {
                console.log('❌ PARSER FAILED: Still 0 items.');
            }
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

inspectSkeleton();
