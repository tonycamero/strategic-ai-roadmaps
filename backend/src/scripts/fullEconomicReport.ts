import { db } from '../db/index';
import { firmBaselineIntake, tenants, implementationSnapshots } from '../db/schema';

async function main() {
    const baselines = await db.select().from(firmBaselineIntake);
    const snapshots = await db.select().from(implementationSnapshots);
    const allTenants = await db.select().from(tenants);

    const report = {
        baselines: baselines.map(b => ({
            tenantName: allTenants.find(t => t.id === b.tenantId)?.name || 'Unknown',
            ...b
        })),
        snapshots: snapshots.map(s => ({
            tenantName: allTenants.find(t => t.id === s.tenantId)?.name || 'Unknown',
            ...s
        }))
    };

    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
