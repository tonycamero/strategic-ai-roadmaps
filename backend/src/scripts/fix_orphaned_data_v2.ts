
import { db } from '../db/index.ts';
import { ticketInstances, ticketPacks } from '../db/schema.ts';
import { eq, inArray, notInArray } from 'drizzle-orm';

async function main() {
    console.log('Checking for orphaned ticket instances...');

    // 1. Get all ticket instances
    const instances = await db.select({
        id: ticketInstances.id,
        ticketPackId: ticketInstances.ticketPackId
    }).from(ticketInstances);

    if (instances.length === 0) {
        console.log('No ticket instances found.');
        return;
    }

    const packIdsInInstances = [...new Set(instances.map(i => i.ticketPackId))];
    console.log(`Found ${instances.length} ticket instances pointing to ${packIdsInInstances.length} distinct ticket packs.`);

    // 2. Get all valid ticket pack IDs
    const validPacks = await db.select({ id: ticketPacks.id }).from(ticketPacks);
    const validPackIds = new Set(validPacks.map(p => p.id));
    console.log(`Found ${validPacks.length} valid ticket packs.`);

    // 3. Find orphans
    const orphanPackIds = packIdsInInstances.filter(id => !validPackIds.has(id));

    if (orphanPackIds.length === 0) {
        console.log('No orphans found! All ticket instances point to valid ticket packs.');
    } else {
        console.log(`Found ${orphanPackIds.length} orphan ticket pack IDs:`, orphanPackIds);

        // 4. Delete orphans
        console.log(`Deleting orphaned ticket instances...`);
        const result = await db.delete(ticketInstances)
            .where(inArray(ticketInstances.ticketPackId, orphanPackIds))
            .returning({ id: ticketInstances.id });

        console.log(`Deleted ${result.length} orphaned ticket instances.`);
    }

    process.exit(0);
}

main().catch((err) => {
    console.error('Error running fix script:', err);
    process.exit(1);
});
