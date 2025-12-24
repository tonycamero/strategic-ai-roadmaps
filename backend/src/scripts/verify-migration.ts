import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function verifyMigration() {
  const sql = postgres(process.env.DATABASE_URL!);

  try {
    console.log('🔍 Verifying migration results...\n');

    // Check users table
    const usersColumns = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name IN ('owner_id', 'tenant_id')
      ORDER BY column_name
    `;
    console.log('👤 users table:');
    console.log(`  ${usersColumns.map(c => c.column_name).join(', ') || 'No owner_id/tenant_id'}`);
    console.log(`  ✅ Expected: tenant_id\n`);

    // Check tenants table
    const tenantsColumns = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'tenants' AND column_name IN ('owner_id', 'owner_user_id')
      ORDER BY column_name
    `;
    console.log('🏢 tenants table:');
    console.log(`  ${tenantsColumns.map(c => c.column_name).join(', ') || 'No owner columns'}`);
    console.log(`  ✅ Expected: owner_user_id\n`);

    // Check intakes table
    const intakesColumns = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'intakes' AND column_name IN ('owner_id', 'tenant_id')
      ORDER BY column_name
    `;
    console.log('📥 intakes table:');
    console.log(`  ${intakesColumns.map(c => c.column_name).join(', ') || 'No owner_id/tenant_id'}`);
    console.log(`  ✅ Expected: tenant_id\n`);

    // Check roadmaps table
    const roadmapsColumns = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'roadmaps' AND column_name IN ('owner_id', 'tenant_id', 'created_by_user_id')
      ORDER BY column_name
    `;
    console.log('🗺️  roadmaps table:');
    console.log(`  ${roadmapsColumns.map(c => c.column_name).join(', ') || 'No columns found'}`);
    console.log(`  ✅ Expected: created_by_user_id, tenant_id\n`);

    // Check sop_tickets moderation_status
    const sopTicketsColumns = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'sop_tickets' AND column_name = 'moderation_status'
    `;
    console.log('🎫 sop_tickets table:');
    console.log(`  ${sopTicketsColumns.length > 0 ? 'moderation_status ✅' : 'moderation_status ❌'}\n`);

    // Check indexes
    const indexes = await sql`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname LIKE 'idx_%'
        AND indexname IN (
          'idx_tenants_cohort_status',
          'idx_intakes_tenant_status_createdAt',
          'idx_roadmaps_tenant_status_createdAt',
          'idx_sop_tickets_tenant_diagnostic_status'
        )
      ORDER BY indexname
    `;
    console.log('📊 New indexes created:');
    indexes.forEach(idx => console.log(`  ✅ ${idx.indexname}`));

    console.log('\n✅ Migration verification complete!');
    console.log('\nNext step: Run validation checklist:');
    console.log('  see backend/docs/VALIDATION_CHECKLIST.md\n');

    await sql.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await sql.end();
    process.exit(1);
  }
}

verifyMigration();
