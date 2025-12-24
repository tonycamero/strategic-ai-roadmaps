import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

async function applyMigration() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found in environment');
    process.exit(1);
  }

  console.log('🔌 Connecting to database...');
  const sql = postgres(connectionString);

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '../db/migrations/023_refactor_owner_to_tenant.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('🚀 Applying migration 023_refactor_owner_to_tenant.sql...');
    console.log('   This will rename columns and add indexes.\n');

    // Strip BEGIN/COMMIT from migration since we'll use sql.begin()
    const cleanSQL = migrationSQL
      .replace(/^BEGIN;\s*/im, '')
      .replace(/\s*COMMIT;\s*$/im, '');

    // Execute the migration in a transaction
    await sql.begin(async (sql) => {
      await sql.unsafe(cleanSQL);
    });

    console.log('✅ Migration applied successfully!');
    console.log('\nChanges applied:');
    console.log('  - users.owner_id → tenant_id');
    console.log('  - tenants.owner_id → owner_user_id');
    console.log('  - intakes.owner_id → tenant_id');
    console.log('  - roadmaps: added tenant_id + created_by_user_id');
    console.log('  - tenant_documents.owner_id → owner_user_id');
    console.log('  - discovery_call_notes.owner_id → created_by_user_id');
    console.log('  - sop_tickets: added moderation_status');
    console.log('  - Added 8 performance indexes');

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await sql.end();
    process.exit(1);
  }
}

applyMigration();
