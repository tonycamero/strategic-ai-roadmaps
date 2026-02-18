import { db } from '../db/index';
import { tenants } from '../db/schema';

async function main() {
    const allTenants = await db.select().from(tenants);
    console.log('--- ALL TENANTS ---');
    allTenants.forEach(t => {
        console.log(`[${t.id}] ${t.name}`);
    });
    console.log('-------------------');
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
