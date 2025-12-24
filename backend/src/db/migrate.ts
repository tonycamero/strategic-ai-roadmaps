import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './index';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function main() {
  console.log('🔄 Running migrations...');
  
  try {
    const migrationsFolder = path.join(__dirname, '../../drizzle');
    await migrate(db, { migrationsFolder });
    console.log('✅ Migrations complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
