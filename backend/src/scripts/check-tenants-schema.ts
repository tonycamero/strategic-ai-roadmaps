import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkSchema() {
  const sql = postgres(process.env.DATABASE_URL!);

  try {
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'tenants'
      ORDER BY ordinal_position
    `;

    console.log('\n📋 Tenants table columns:\n');
    columns.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      if (col.column_default) console.log(`    default: ${col.column_default}`);
    });

    await sql.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await sql.end();
    process.exit(1);
  }
}

checkSchema();
