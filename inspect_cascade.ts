import { db } from './backend/src/db/index.ts';
import { tenants, executiveBriefs, auditEvents } from './backend/src/db/schema.ts';
import { eq, desc } from 'drizzle-orm';

async function inspectCascade() {
    const allTenants = await db.select().from(tenants);
    const cascade = allTenants.find(t => t.name?.toLowerCase().includes('cascade'));

    if (!cascade) {
        console.log('Cascade Climate Solutions not found');
        return;
    }

    console.log('--- TENANT ---');
    console.log(JSON.stringify(cascade, null, 2));

    const briefs = await db.select().from(executiveBriefs)
        .where(eq(executiveBriefs.tenantId, cascade.id))
        .orderBy(desc(executiveBriefs.createdAt));

    console.log('--- EXECUTIVE BRIEFS (Sorted by CreatedAt DESC) ---');
    console.log(JSON.stringify(briefs, null, 2));

    const events = await db.select().from(auditEvents)
        .where(eq(auditEvents.tenantId, cascade.id))
        .orderBy(desc(auditEvents.createdAt))
        .limit(10);

    console.log('--- RECENT AUDIT EVENTS ---');
    console.log(JSON.stringify(events, null, 2));
}

inspectCascade().catch(console.error);
