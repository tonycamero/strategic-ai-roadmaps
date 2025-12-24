import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function fixUserTenantRefs() {
  const sql = postgres(process.env.DATABASE_URL!);

  try {
    console.log('🔍 Analyzing user-tenant relationships...\n');

    // Find all users whose owner_id points to a user instead of a tenant
    const usersToFix = await sql`
      SELECT u.id, u.email, u.owner_id, t.id as correct_tenant_id, t.name as tenant_name
      FROM users u
      JOIN tenants t ON t.owner_id = u.owner_id
      WHERE u.owner_id NOT IN (SELECT id FROM tenants)
      ORDER BY t.name, u.email
    `;

    console.log(`Found ${usersToFix.length} users to update:\n`);

    const byTenant = usersToFix.reduce((acc, u) => {
      const key = u.tenant_name;
      if (!acc[key]) acc[key] = [];
      acc[key].push(u);
      return acc;
    }, {} as Record<string, typeof usersToFix>);

    for (const [tenantName, users] of Object.entries(byTenant)) {
      console.log(`  📁 ${tenantName}`);
      users.forEach(u => {
        console.log(`     ${u.email}`);
        console.log(`       owner_id: ${u.owner_id} (user) → ${u.correct_tenant_id} (tenant)`);
      });
      console.log();
    }

    console.log('📝 Updating user records...\n');

    for (const user of usersToFix) {
      await sql`
        UPDATE users
        SET owner_id = ${user.correct_tenant_id}
        WHERE id = ${user.id}
      `;
      console.log(`  ✅ Updated ${user.email}`);
    }

    // Handle superadmin (tony@scend.cash) - no tenant exists, set to NULL
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
        console.log(`  ✅ Set ${user.email} owner_id to NULL`);
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

fixUserTenantRefs();
