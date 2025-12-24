import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function fixAllTenantRefs() {
  const sql = postgres(process.env.DATABASE_URL!);

  try {
    console.log('🔍 Checking all tables with owner_id references...\n');

    // Fix intakes.owner_id
    console.log('📋 Fixing intakes...');
    const intakes = await sql`
      SELECT i.id, i.owner_id, t.id as correct_tenant_id, t.name
      FROM intakes i
      JOIN tenants t ON t.owner_id = i.owner_id
      WHERE i.owner_id NOT IN (SELECT id FROM tenants)
    `;

    if (intakes.length > 0) {
      console.log(`  Found ${intakes.length} intakes to update`);
      for (const intake of intakes) {
        await sql`
          UPDATE intakes
          SET owner_id = ${intake.correct_tenant_id}
          WHERE id = ${intake.id}
        `;
      }
      console.log(`  ✅ Updated ${intakes.length} intakes\n`);
    } else {
      console.log(`  ✅ All intakes already correct\n`);
    }

    // Fix roadmaps.owner_id (if exists - migration will handle this but check anyway)
    console.log('📋 Checking roadmaps...');
    const roadmapsCheck = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'roadmaps' AND column_name = 'owner_id'
    `;

    if (roadmapsCheck.length > 0) {
      const roadmaps = await sql`
        SELECT r.id, r.owner_id, u.id as user_id
        FROM roadmaps r
        JOIN users u ON u.id = r.owner_id
        WHERE r.owner_id IS NOT NULL
      `;

      console.log(`  Found ${roadmaps.length} roadmaps with owner_id (will be handled by migration)\n`);
    } else {
      console.log(`  ✅ Roadmaps already migrated\n`);
    }

    // Fix invites.owner_id (if table exists)
    console.log('📋 Checking invites...');
    const invitesTableExists = await sql`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'invites'
    `;

    if (invitesTableExists.length > 0) {
      const invites = await sql`
        SELECT i.id, i.owner_id, t.id as correct_tenant_id
        FROM invites i
        JOIN tenants t ON t.owner_id = i.owner_id
        WHERE i.owner_id NOT IN (SELECT id FROM tenants)
      `;

      if (invites.length > 0) {
        console.log(`  Found ${invites.length} invites to update`);
        for (const invite of invites) {
          await sql`
            UPDATE invites
            SET owner_id = ${invite.correct_tenant_id}
            WHERE id = ${invite.id}
          `;
        }
        console.log(`  ✅ Updated ${invites.length} invites\n`);
      } else {
        console.log(`  ✅ All invites already correct\n`);
      }
    } else {
      console.log(`  ⚠️  Invites table does not exist\n`);
    }

    console.log('✅ All table references fixed!');
    console.log('\nNext step: Run the migration with:');
    console.log('  pnpm exec dotenv -e .env -- tsx src/scripts/apply-tenant-migration.ts\n');

    await sql.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await sql.end();
    process.exit(1);
  }
}

fixAllTenantRefs();
