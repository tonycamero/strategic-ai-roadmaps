import { db } from '../db/index';
import { tenants, discoveryCallNotes } from '../db/schema';
import { ilike, or } from 'drizzle-orm';

async function main() {
    const search = 'Baseline';
    const foundTenants = await db.select().from(tenants).where(ilike(tenants.name, `%${search}%`));

    if (foundTenants.length === 0) {
        console.log('No tenants found with name like Baseline');
        // Try searching in discovery notes
        const allNotes = await db.select().from(discoveryCallNotes);
        const mentions = allNotes.filter(n => JSON.stringify(n.notes).includes(search));
        console.log(`Found ${mentions.length} discovery notes mentioning ${search}`);
        mentions.forEach(m => {
            console.log(`- Tenant ID: ${m.tenantId}`);
        });
    } else {
        console.log('--- MATCHING TENANTS ---');
        foundTenants.forEach(t => {
            console.log(`[${t.id}] ${t.name}`);
        });
    }
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
