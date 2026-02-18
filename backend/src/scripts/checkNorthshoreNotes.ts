import { db } from '../db/index';
import { discoveryCallNotes, tenants } from '../db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    const tenantId = '883a5307-6354-49ad-b8e3-765ff64dc1af'; // Northshore
    const notes = await db.select().from(discoveryCallNotes).where(eq(discoveryCallNotes.tenantId, tenantId));

    console.log(`Found ${notes.length} notes for Northshore.`);
    console.log(JSON.stringify(notes, null, 2));
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
