import postgres from 'postgres';
import { readFileSync } from 'fs';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function main() {
  const sql = postgres(process.env.DATABASE_URL!);
  const migrationPath = path.join(__dirname, '../drizzle/027_add_inventory_tracking.sql');
  const migration = readFileSync(migrationPath, 'utf8');

  console.log('🔄 Applying migration 027_add_inventory_tracking...');
  
  try {
    await sql.unsafe(migration);
    console.log('✅ Migration 027 applied successfully!');
    console.log('   - Added inventory_id column (VARCHAR(64))');
    console.log('   - Added is_sidecar column (BOOLEAN DEFAULT FALSE)');
    console.log('   - Created indexes for inventory queries');
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('ℹ️  Columns already exist - migration was previously applied');
    } else {
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
  } finally {
    await sql.end();
  }
}

main();
