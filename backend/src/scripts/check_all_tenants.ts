import { db } from '../db/index.js';
import { tenants } from '../db/schema.js';

async function checkAllTenants() {
    console.log('=== ALL TENANTS ===\n');

    const allTenants = await db
        .select({
            id: tenants.id,
            name: tenants.name,
            cohortLabel: tenants.cohortLabel,
            status: tenants.status,
        })
        .from(tenants)
        .orderBy(tenants.name);

    console.log(`Total: ${allTenants.length} tenants\n`);

    allTenants.forEach((t, i) => {
        console.log(`${i + 1}. ${t.name}`);
        console.log(`   Cohort: ${t.cohortLabel || '(none)'}`);
        console.log(`   Status: ${t.status}`);
        console.log('');
    });

    process.exit(0);
}

checkAllTenants().catch((err) => {
    console.error('Error:', err);
    process.exit(1);
});
