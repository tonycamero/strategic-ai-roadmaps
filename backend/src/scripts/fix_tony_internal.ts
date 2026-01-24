import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

async function checkAndFixTonyUser() {
    console.log('Checking tony@scend.cash user record...\n');

    const [user] = await db
        .select({
            id: users.id,
            email: users.email,
            role: users.role,
            isInternal: users.isInternal,
            tenantId: users.tenantId,
        })
        .from(users)
        .where(eq(users.email, 'tony@scend.cash'))
        .limit(1);

    if (!user) {
        console.log('❌ User not found!');
        process.exit(1);
    }

    console.log('Current user state:');
    console.log(JSON.stringify(user, null, 2));
    console.log();

    if (!user.isInternal) {
        console.log('⚠️  isInternal is FALSE - updating to TRUE...');
        await db
            .update(users)
            .set({ isInternal: true })
            .where(eq(users.id, user.id));

        console.log('✅ Updated isInternal to TRUE');
        console.log('🔄 Please log out and log back in to refresh your token');
    } else {
        console.log('✅ isInternal is already TRUE');
    }

    process.exit(0);
}

checkAndFixTonyUser().catch((err) => {
    console.error('Error:', err);
    process.exit(1);
});
