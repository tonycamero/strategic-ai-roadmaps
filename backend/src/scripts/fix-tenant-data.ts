import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function fixTenantData() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  const sql = postgres(connectionString);

  try {
    console.log('🔍 Analyzing tenant data...\n');

    // Find all unique owner_ids that should be tenants
    const ownerUsers = await sql`
      SELECT DISTINCT u.owner_id, o.email, o.name
      FROM users u
      JOIN users o ON u.owner_id = o.id
      WHERE u.role = 'owner' AND u.id = u.owner_id
      ORDER BY o.email
    `;

    console.log(`Found ${ownerUsers.length} owner users who need tenant records:\n`);
    ownerUsers.forEach(u => {
      console.log(`  - ${u.email} (${u.name || 'No name'})`);
      console.log(`    user_id: ${u.owner_id}\n`);
    });

    // Create tenant records for each owner
    console.log('📝 Creating tenant records...\n');

    for (const owner of ownerUsers) {
      // Check if tenant already exists
      const existing = await sql`
        SELECT id FROM tenants WHERE id = ${owner.owner_id}
      `;

      if (existing.length > 0) {
        console.log(`  ✓ Tenant already exists for ${owner.email}`);
        continue;
      }

      // Create tenant record
      await sql`
        INSERT INTO tenants (id, name, owner_id, status, cohort_label, created_at, updated_at)
        VALUES (
          ${owner.owner_id},
          ${owner.name || owner.email.split('@')[0]},
          ${owner.owner_id},
          'active',
          'cohort_1',
          NOW(),
          NOW()
        )
      `;

      console.log(`  ✅ Created tenant for ${owner.email}`);
    }

    console.log('\n✅ All tenant records created successfully!');
    console.log('\nNext step: Run the migration with:');
    console.log('  pnpm exec dotenv -e .env -- tsx src/scripts/apply-tenant-migration.ts\n');

    await sql.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await sql.end();
    process.exit(1);
  }
}

fixTenantData();
