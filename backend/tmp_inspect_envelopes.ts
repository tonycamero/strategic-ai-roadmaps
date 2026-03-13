import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    const res = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'selection_envelopes'
      ORDER BY column_name;
    `);
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
