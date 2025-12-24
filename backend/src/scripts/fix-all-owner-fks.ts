import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function fixAllOwnerFks() {
  const sql = postgres(process.env.DATABASE_URL!);

  try {
    console.log('🔍 Step 1: Dropping old FK constraints on owner_id columns...\n');

    // Find all FK constraints with 'owner_id' in the name
    const oldFks = await sql`
      SELECT tc.table_name, tc.constraint_name
      FROM information_schema.table_constraints tc
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.constraint_name LIKE '%owner_id%'
      ORDER BY tc.table_name
    `;

    if (oldFks.length > 0) {
      console.log(`Found ${oldFks.length} FK constraints to drop:\n`);
      for (const fk of oldFks) {
        console.log(`  - ${fk.table_name}.${fk.constraint_name}`);
        await sql.unsafe(`ALTER TABLE ${fk.table_name} DROP CONSTRAINT ${fk.constraint_name}`);
      }
      console.log('\n✅ All old FK constraints dropped\n');
    } else {
      console.log('✅ No old FK constraints found\n');
    }

    console.log('🔍 Step 2: Updating owner_id values to point to tenants...\n');

    // Fix intakes.owner_id
    console.log('📋 Fixing intakes...');
    const intakes = await sql`
      SELECT i.id, i.owner_id, t.id as correct_tenant_id, t.name
      FROM intakes i
      JOIN tenants t ON t.owner_id = i.owner_id
      WHERE i.owner_id NOT IN (SELECT id FROM tenants)
    `;

    if (intakes.length > 0) {
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

    // Check tenant_documents and discovery_call_notes (these point to users, migration will rename)
    console.log('📋 Checking tenant_documents...');
    const tenantDocsCheck = await sql`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tenant_documents'
    `;
    if (tenantDocsCheck.length > 0) {
      console.log(`  ℹ️  Will be renamed to owner_user_id by migration\n`);
    }

    console.log('📋 Checking discovery_call_notes...');
    const discoveryNotesCheck = await sql`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'discovery_call_notes'
    `;
    if (discoveryNotesCheck.length > 0) {
      console.log(`  ℹ️  Will be renamed to created_by_user_id by migration\n`);
    }

    console.log('✅ All references fixed!');
    console.log('\nNext step: Run the migration with:');
    console.log('  pnpm exec dotenv -e .env -- tsx src/scripts/apply-tenant-migration.ts\n');

    await sql.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await sql.end();
    process.exit(1);
  }
}

fixAllOwnerFks();
