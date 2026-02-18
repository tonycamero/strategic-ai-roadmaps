
import 'dotenv/config';
import { db } from '../db/index';
import { sql } from 'drizzle-orm';
import { users, invites, intakeVectors } from '../db/schema';

async function main() {
    console.log('Starting safe email normalization...');

    try {
        // 1. Check for User collisions
        console.log('Checking for potential User email collisions...');

        // We can't easily do a GROUP BY on LOWER(email) with Drizzle query builder directly for complex HAVING clauses 
        // unless we use sql template, which returns strict types.
        // Let's use raw SQL for checks.

        const userCollisions = await db.execute(sql`
      SELECT lower(trim(email)) as normalized_email, count(*) as count
      FROM users 
      GROUP BY lower(trim(email)) 
      HAVING count(*) > 1
    `);

        if (userCollisions.length > 0) {
            console.error('❌ CRITICAL: Found duplicate users after normalization! Aborting to prevent data loss/constraint violation.');
            console.error('Duplicates:', userCollisions);
            console.error('Please manually resolve these duplicates in the users table before running this script.');
            process.exit(1);
        } else {
            console.log('✅ No user collisions found.');
        }

        // 2. Check for Invite collisions (assuming tenant + email uniqueness is desired, though schema may not enforce it strictly yet)
        console.log('Checking for potential Invite collisions within tenants...');
        const inviteCollisions = await db.execute(sql`
      SELECT tenant_id, lower(trim(email)) as normalized_email, count(*) as count
      FROM invites 
      GROUP BY tenant_id, lower(trim(email)) 
      HAVING count(*) > 1
    `);

        if (inviteCollisions.length > 0) {
            console.error('❌ CRITICAL: Found duplicate invites within tenants after normalization! Aborting.');
            console.error('Duplicates:', inviteCollisions);
            process.exit(1);
        } else {
            console.log('✅ No invite collisions found.');
        }

        // 3. Execute Updates
        console.log('Proceeding with updates...');

        const userUpdate = await db.execute(sql`UPDATE users SET email = LOWER(TRIM(email))`);
        console.log(`✔ Normalized users`);

        const inviteUpdate = await db.execute(sql`UPDATE invites SET email = LOWER(TRIM(email))`);
        console.log(`✔ Normalized invites`);

        // Intake vectors don't have unique constraints on email usually, but let's just update them.
        const vectorUpdate = await db.execute(sql`UPDATE intake_vectors SET recipient_email = LOWER(TRIM(recipient_email)) WHERE recipient_email IS NOT NULL`);
        console.log(`✔ Normalized intake_vectors`);

        console.log('🎉 Done. All emails normalized.');
        process.exit(0);

    } catch (error) {
        console.error('Script failed:', error);
        process.exit(1);
    }
}

main();
