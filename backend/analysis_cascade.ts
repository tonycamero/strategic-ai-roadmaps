import { db } from './src/db/index.ts';
import { tenants, intakes } from './src/db/schema.ts';
import { eq } from 'drizzle-orm';

async function findCascade() {
    const allTenants = await db.select().from(tenants);
    const cascade = allTenants.find(t => t.name.toLowerCase().includes('cascade'));

    if (!cascade) {
        console.log('Cascade Climate Solutions not found');
        return;
    }

    console.log('FOUND TENANT:', JSON.stringify(cascade, null, 2));

    const tenantIntakes = await db.select().from(intakes).where(eq(intakes.tenantId, cascade.id));
    console.log('FOUND INTAKES:', JSON.stringify(tenantIntakes, null, 2));
}

findCascade().catch(console.error);
