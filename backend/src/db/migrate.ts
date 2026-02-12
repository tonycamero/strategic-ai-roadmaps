import '../config/env.ts'; // Ensure env is loaded before DB import
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './index.ts';
import path from 'path';

async function main() {
  console.log('🔄 Running migrations...');

  try {
    const migrationsFolder = path.resolve(__dirname, '../../drizzle');
    console.log(`📂 Using migrations from: ${migrationsFolder}`);
    await migrate(db, { migrationsFolder });
    console.log('✅ Migrations complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
