import { db } from '../db/index';
import { tenants, discoveryCallNotes } from '../db/schema';

async function main() {
    const search = 'Economics';
    const foundTenants = await db.select().from(tenants);
    console.log(`Checking ${foundTenants.length} tenants...`);
    foundTenants.forEach(t => {
        if (t.name.includes(search) || t.name.includes('Baseline')) {
            console.log(`MATCH: [${t.id}] ${t.name}`);
        }
    });

    const allNotes = await db.select().from(discoveryCallNotes);
    const mentions = allNotes.filter(n => JSON.stringify(n.notes).toLowerCase().includes('economics'));
    console.log(`Found ${mentions.length} discovery notes mentioning economics`);
    mentions.forEach(m => {
        const tenant = foundTenants.find(t => t.id === m.tenantId);
        console.log(`- Tenant: ${tenant?.name || 'Unknown'} (${m.tenantId})`);
    });
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
