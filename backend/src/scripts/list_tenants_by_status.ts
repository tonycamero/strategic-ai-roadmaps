import { db } from '../db/index.js';
import { tenants } from '../db/schema.js';

async function listTenantsByStatus() {
    console.log('=== TENANTS BY STATUS ===\n');

    const allTenants = await db
        .select({
            name: tenants.name,
            status: tenants.status,
            cohortLabel: tenants.cohortLabel,
            createdAt: tenants.createdAt,
        })
        .from(tenants)
        .orderBy(tenants.status, tenants.name);

    let currentStatus = '';
    allTenants.forEach((t) => {
        if (t.status !== currentStatus) {
            currentStatus = t.status;
            console.log(`\n=== ${currentStatus.toUpperCase()} ===`);
        }
        console.log(`  - ${t.name} (${t.cohortLabel || 'no cohort'}) [${new Date(t.createdAt).toISOString().split('T')[0]}]`);
    });

    console.log(`\n\nTotal: ${allTenants.length} tenants`);
    process.exit(0);
}

listTenantsByStatus().catch((err) => {
    console.error('Error:', err);
    process.exit(1);
});
