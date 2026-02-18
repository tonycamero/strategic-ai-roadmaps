import { db } from '../db/index';
import { firmBaselineIntake, tenants } from '../db/schema';

async function main() {
    const baselines = await db.select().from(firmBaselineIntake);
    const allTenants = await db.select().from(tenants);

    console.log(`Found ${baselines.length} baseline intakes.`);

    for (const b of baselines) {
        const tenant = allTenants.find(t => t.id === b.tenantId);
        console.log(`--- Baseline for [${b.tenantId}] ${tenant?.name || 'Unknown'} ---`);
        console.log(JSON.stringify(b, null, 2));
    }
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
