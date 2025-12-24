import 'dotenv/config';
import { db } from '../src/db/index.js';
import { sql } from 'drizzle-orm';

async function dropInvitesOwnerId() {
  try {
    console.log('🔧 Dropping owner_id column from invites table...');

    await db.execute(sql`
      ALTER TABLE invites
      DROP COLUMN IF EXISTS owner_id CASCADE;
    `);

    console.log('✅ Successfully dropped owner_id column from invites table');

    // Verify the change
    const result = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'invites'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Updated invites table columns:');
    result.forEach((row: any) => {
      console.log(`  - ${row.column_name}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error dropping owner_id column:', error);
    process.exit(1);
  }
}

dropInvitesOwnerId();
