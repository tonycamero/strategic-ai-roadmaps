/**
 * PRE-MIGRATION AUDIT: Check for duplicate findings_canonical rows per tenant.
 * EXEC-TICKET-CANONICAL-FINDINGS-HARDENING-001 requires this to be clean
 * before creating the partial unique index.
 */
import '../config/env';
import { db } from '../db/index';

import { tenantDocuments } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

async function run() {
    const rows = await db
        .select({
            tenantId: tenantDocuments.tenantId,
            count: sql<number>`count(*)`.mapWith(Number),
        })
        .from(tenantDocuments)
        .where(eq(tenantDocuments.category, 'findings_canonical'))
        .groupBy(tenantDocuments.tenantId)
        .having(sql`count(*) > 1`);

    if (rows.length === 0) {
        console.log('✅ CLEAN — No duplicate findings_canonical rows. Safe to create unique index.');
    } else {
        console.error('❌ DUPLICATES FOUND — Do NOT run migration until resolved:');
        rows.forEach(r => console.error(`  tenant_id=${r.tenantId}  count=${r.count}`));
        process.exit(1);
    }
}

run().catch(e => { console.error(e); process.exit(1); });
