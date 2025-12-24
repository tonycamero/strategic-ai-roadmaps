import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkBusinessTypes() {
  const sql = postgres(process.env.DATABASE_URL!);

  try {
    console.log('📋 Checking tenant business_type values...\n');

    const tenants = await sql`
      SELECT id, name, business_type, updated_at
      FROM tenants
      ORDER BY name
    `;

    console.log('Tenants:');
    for (const tenant of tenants) {
      console.log(`  ${tenant.name}`);
      console.log(`    ID: ${tenant.id}`);
      console.log(`    business_type: ${tenant.business_type || '(null)'}`);
      console.log(`    updated_at: ${tenant.updated_at}`);
      console.log('');
    }

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await sql.end();
    process.exit(1);
  }
}

checkBusinessTypes();
