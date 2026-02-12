import 'dotenv/config';
import { db } from '../db/index.ts';
import { intakeVectors, intakes, users } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

async function run() {
    const tId = 'ec32ea41-d056-462d-8321-c2876c9af263';
    console.log(`[Fix] Linking existing intakes for tenant: ${tId}`);

    const vectors = await db.select().from(intakeVectors).where(eq(intakeVectors.tenantId, tId));

    for (const v of vectors) {
        if (!v.recipientEmail) continue;

        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, v.recipientEmail))
            .limit(1);

        if (user) {
            const [intake] = await db
                .select()
                .from(intakes)
                .where(eq(intakes.userId, user.id))
                .limit(1);

            if (intake) {
                console.log(` - Linking ${v.roleLabel} to intake ${intake.id}`);
                await db
                    .update(intakeVectors)
                    .set({ intakeId: intake.id })
                    .where(eq(intakeVectors.id, v.id));
            } else {
                console.log(` - No intake found for ${v.recipientEmail}`);
            }
        } else {
            console.log(` - No user found for ${v.recipientEmail}`);
        }
    }

    console.log('[Fix] Done');
    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
