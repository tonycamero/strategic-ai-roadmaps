import 'dotenv/config';
import { db } from '../db';
import { intakeVectors, invites } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';

async function run() {
    const tId = 'ec32ea41-d056-462d-8321-c2876c9af263';

    console.log(`[Reconcile] Syncing accepted status for all vectors in tenant ${tId}...`);

    // 1. Sync vectors where the invite has been accepted in the invites table
    const results = await db
        .update(intakeVectors)
        .set({
            inviteStatus: 'ACCEPTED',
            updatedAt: new Date()
        })
        .where(
            and(
                eq(intakeVectors.tenantId, tId),
                sql`recipient_email IN (
          SELECT email FROM invites 
          WHERE tenant_id = ${tId} AND accepted = true
        )`
            )
        )
        .returning();

    console.log(` - ✅ Updated ${results.length} vectors to ACCEPTED status.`);

    results.forEach(v => {
        console.log(`   - ${v.recipientEmail} (${v.roleLabel})`);
    });

    // 2. Also ensure that if they have an intakeId, they are marked as accepted (safety)
    const results2 = await db
        .update(intakeVectors)
        .set({
            inviteStatus: 'ACCEPTED',
            updatedAt: new Date()
        })
        .where(
            and(
                eq(intakeVectors.tenantId, tId),
                sql`intake_id IS NOT NULL`,
                sql`invite_status != 'ACCEPTED'`
            )
        )
        .returning();

    if (results2.length > 0) {
        console.log(` - ✅ Updated ${results2.length} additional vectors based on intake presence.`);
    }

    console.log('[Reconcile] Done');
    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
