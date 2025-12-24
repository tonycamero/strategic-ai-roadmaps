import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function fixSuperadminTenant() {
  const sql = postgres(process.env.DATABASE_URL!);

  try {
    console.log('🔍 Checking superadmin user...\n');

    const superadmin = await sql`
      SELECT u.id, u.email, u.name, u.owner_id
      FROM users u
      WHERE u.role = 'superadmin'
    `;

    if (superadmin.length === 0) {
      console.log('No superadmin users found.');
      await sql.end();
      return;
    }

    const admin = superadmin[0];
    console.log(`Found: ${admin.email}`);
    console.log(`  user_id: ${admin.id}`);
    console.log(`  current owner_id: ${admin.owner_id}\n`);

    // Check if a tenant already exists for this user
    const existingTenant = await sql`
      SELECT id FROM tenants WHERE owner_id = ${admin.id}
    `;

    if (existingTenant.length > 0) {
      console.log(`✅ Tenant already exists (id: ${existingTenant[0].id})`);
      
      // Update user to point to that tenant
      await sql`
        UPDATE users
        SET owner_id = ${existingTenant[0].id}
        WHERE id = ${admin.id}
      `;
      console.log(`✅ Updated user to reference tenant\n`);
    } else {
      // Create a new tenant for superadmin
      console.log('📝 Creating tenant for superadmin...\n');
      
      const newTenant = await sql`
        INSERT INTO tenants (name, owner_id, status, cohort_label, created_at, updated_at)
        VALUES (
          'Platform Administration',
          ${admin.id},
          'active',
          'PLATFORM',
          NOW(),
          NOW()
        )
        RETURNING id
      `;

      console.log(`✅ Created tenant (id: ${newTenant[0].id})`);

      // Update user to point to the new tenant
      await sql`
        UPDATE users
        SET owner_id = ${newTenant[0].id}
        WHERE id = ${admin.id}
      `;
      
      console.log(`✅ Updated user to reference tenant\n`);
    }

    console.log('✅ Superadmin tenant setup complete!');
    console.log('\nNext step: Run the migration with:');
    console.log('  pnpm exec dotenv -e .env -- tsx src/scripts/apply-tenant-migration.ts\n');

    await sql.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await sql.end();
    process.exit(1);
  }
}

fixSuperadminTenant();
