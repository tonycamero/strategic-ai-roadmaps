import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function fixUserFkAndRefs() {
  const sql = postgres(process.env.DATABASE_URL!);

  try {
    console.log('🔍 Checking existing foreign key constraints...\n');

    // Check for existing FK on users.owner_id
    const existingFk = await sql`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'users' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%owner_id%'
    `;

    if (existingFk.length > 0) {
      console.log(`Found existing FK: ${existingFk[0].constraint_name}`);
      console.log('Dropping old constraint...\n');
      
      await sql.unsafe(`ALTER TABLE users DROP CONSTRAINT ${existingFk[0].constraint_name}`);
      console.log('✅ Old FK constraint dropped\n');
    }

    console.log('📝 Updating user records to point to tenant IDs...\n');

    // Find and update all users whose owner_id points to a user instead of a tenant
    const usersToFix = await sql`
      SELECT u.id, u.email, u.owner_id, t.id as correct_tenant_id, t.name as tenant_name
      FROM users u
      JOIN tenants t ON t.owner_id = u.owner_id
      WHERE u.owner_id NOT IN (SELECT id FROM tenants)
      ORDER BY t.name, u.email
    `;

    console.log(`Updating ${usersToFix.length} users:\n`);

    for (const user of usersToFix) {
      await sql`
        UPDATE users
        SET owner_id = ${user.correct_tenant_id}
        WHERE id = ${user.id}
      `;
      console.log(`  ✅ ${user.email} → ${user.tenant_name}`);
    }

    // Handle superadmin (no tenant)
    const superadmin = await sql`
      SELECT u.id, u.email, u.owner_id
      FROM users u
      WHERE u.role = 'superadmin' AND u.owner_id NOT IN (SELECT id FROM tenants)
    `;

    if (superadmin.length > 0) {
      console.log('\n🔧 Handling superadmin users (no tenant)...\n');
      for (const user of superadmin) {
        await sql`
          UPDATE users
          SET owner_id = NULL
          WHERE id = ${user.id}
        `;
        console.log(`  ✅ ${user.email} → NULL`);
      }
    }

    console.log('\n✅ All user-tenant references fixed!');
    console.log('\nNext step: Run the migration with:');
    console.log('  pnpm exec dotenv -e .env -- tsx src/scripts/apply-tenant-migration.ts\n');

    await sql.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await sql.end();
    process.exit(1);
  }
}

fixUserFkAndRefs();
