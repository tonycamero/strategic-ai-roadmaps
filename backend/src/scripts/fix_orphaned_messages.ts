
import { db } from '../db/index.ts';
import { agentMessages, agentThreads } from '../db/schema.ts';
import { eq, inArray, notInArray } from 'drizzle-orm';

async function main() {
    console.log('Checking for orphaned agent messages...');

    // 1. Get all agent messages
    const messages = await db.select({
        id: agentMessages.id,
        agentThreadId: agentMessages.agentThreadId
    }).from(agentMessages);

    if (messages.length === 0) {
        console.log('No agent messages found.');
        return;
    }

    const threadIdsInMessages = [...new Set(messages.map(m => m.agentThreadId))];
    console.log(`Found ${messages.length} messages pointing to ${threadIdsInMessages.length} distinct threads.`);

    // 2. Get all valid thread IDs
    const validThreads = await db.select({ id: agentThreads.id }).from(agentThreads);
    const validThreadIds = new Set(validThreads.map(t => t.id));
    console.log(`Found ${validThreads.length} valid threads.`);

    // 3. Find orphans
    const orphanThreadIds = threadIdsInMessages.filter(id => !validThreadIds.has(id));

    if (orphanThreadIds.length === 0) {
        console.log('No orphans found! All messages point to valid threads.');
    } else {
        console.log(`Found ${orphanThreadIds.length} orphan thread IDs:`, orphanThreadIds);

        // 4. Delete orphans
        console.log(`Deleting orphaned agent messages...`);
        const result = await db.delete(agentMessages)
            .where(inArray(agentMessages.agentThreadId, orphanThreadIds))
            .returning({ id: agentMessages.id });

        console.log(`Deleted ${result.length} orphaned agent messages.`);
    }

    process.exit(0);
}

main().catch((err) => {
    console.error('Error running fix script:', err);
    process.exit(1);
});
