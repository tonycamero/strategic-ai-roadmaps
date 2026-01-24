import '../config/env'; // Ensure env is loaded before DB import
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './index';
import path from 'path';

async function main() {
  console.log('🔄 Running migrations...');

  try {
    const migrationsFolder = path.join(__dirname, 'migrations');
    await migrate(db, { migrationsFolder });
    console.log('✅ Migrations complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
