import 'dotenv/config';
import { db } from '../db';
import { users, intakeVectors } from '../db/schema';
import { eq, and } from 'drizzle-orm';

async function run() {
    const tId = 'ec32ea41-d056-462d-8321-c2876c9af263';
    const email = 'tonycamerobiz+ccs-gm@gmail.com';

    console.log(`[Fix] Upgrading Amanda Lewis to exec_sponsor...`);

    // 1. Update User Role
    const [updatedUser] = await db
        .update(users)
        .set({ role: 'exec_sponsor' })
        .where(and(eq(users.email, email), eq(users.tenantId, tId)))
        .returning();

    if (updatedUser) {
        console.log(` - ✅ User role updated to ${updatedUser.role}`);
    } else {
        console.log(` - ❌ User not found or mismatch.`);
    }

    // 2. Sync Intake Vector Status
    const [vector] = await db
        .update(intakeVectors)
        .set({
            inviteStatus: 'ACCEPTED',
            updatedAt: new Date()
        })
        .where(and(
            eq(intakeVectors.tenantId, tId),
            eq(intakeVectors.recipientEmail, email)
        ))
        .returning();

    if (vector) {
        console.log(` - ✅ Vector status updated to ACCEPTED.`);
    } else {
        console.log(` - ❌ Vector not found.`);
    }

    console.log('[Fix] Done');
    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
