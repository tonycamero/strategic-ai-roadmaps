import bcrypt from 'bcryptjs';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

async function createSuperAdmin() {
    const passwordHash = await bcrypt.hash('testpass123', 10);
    const email = 'superadmin@test.com';

    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (existing) {
        await db.update(users).set({ role: 'superadmin', isInternal: true, passwordHash }).where(eq(users.id, existing.id));
        console.log('Updated existing user to superadmin');
    } else {
        await db.insert(users).values({
            email,
            passwordHash,
            role: 'superadmin',
            name: 'Test SuperAdmin',
            isInternal: true,
        });
        console.log('Created new superadmin user');
    }
    process.exit(0);
}

createSuperAdmin().catch(console.error);
