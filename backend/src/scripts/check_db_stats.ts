import { db } from '../db/index.js';
import { tenants, intakes, roadmaps } from '../db/schema.js';
import { count, sql } from 'drizzle-orm';

async function checkDatabaseStats() {
    console.log('=== DATABASE STATS ===\n');

    // Total tenants
    const [{ totalTenants }] = await db
        .select({ totalTenants: count() })
        .from(tenants);
    console.log(`Total Tenants: ${totalTenants}`);

    // Tenants by status
    const statusStats = await db
        .select({
            status: tenants.status,
            count: count(),
        })
        .from(tenants)
        .groupBy(tenants.status);
    console.log('\nTenants by Status:');
    statusStats.forEach(s => console.log(`  ${s.status}: ${s.count}`));

    // Total intakes
    const [{ totalIntakes }] = await db
        .select({ totalIntakes: count() })
        .from(intakes);
    console.log(`\nTotal Intakes: ${totalIntakes}`);

    // Cohorts
    const cohortStats = await db
        .select({
            cohortLabel: tenants.cohortLabel,
            count: count(),
        })
        .from(tenants)
        .where(sql`${tenants.cohortLabel} IS NOT NULL`)
        .groupBy(tenants.cohortLabel);
    console.log('\nCohorts:');
    cohortStats.forEach(c => console.log(`  ${c.cohortLabel}: ${c.count}`));

    // Roadmaps by status
    const roadmapStats = await db
        .select({
            status: roadmaps.status,
            count: count(),
        })
        .from(roadmaps)
        .groupBy(roadmaps.status);
    console.log('\nRoadmaps by Status:');
    roadmapStats.forEach(r => console.log(`  ${r.status}: ${r.count}`));

    process.exit(0);
}

checkDatabaseStats().catch((err) => {
    console.error('Error:', err);
    process.exit(1);
});
