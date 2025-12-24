import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkHayesIntakes() {
  const sql = postgres(process.env.DATABASE_URL!);

  try {
    const tenantId = '4e2c6eb1-0767-43d6-b6a4-3fca8efd3f64'; // Hayes Real Estate Group
    
    console.log('📋 Checking intakes for Hayes Real Estate Group...\n');

    const intakes = await sql`
      SELECT id, user_id, role, status, completed_at, created_at
      FROM intakes
      WHERE tenant_id = ${tenantId}
      ORDER BY role
    `;

    if (intakes.length === 0) {
      console.log('❌ No intakes found for Hayes Real Estate Group');
    } else {
      console.log(`Found ${intakes.length} intake(s):\n`);
      for (const intake of intakes) {
        console.log(`Role: ${intake.role}`);
        console.log(`  User ID: ${intake.user_id}`);
        console.log(`  Status: ${intake.status}`);
        console.log(`  Created: ${intake.created_at}`);
        console.log(`  Completed: ${intake.completed_at || 'N/A'}`);
        console.log('');
      }
    }

    // Also check Roberta's user ID
    const [roberta] = await sql`
      SELECT id, email, role, tenant_id
      FROM users
      WHERE email = 'roberta@hayesrealestate.com'
    `;

    if (roberta) {
      console.log(`Roberta's user info:`);
      console.log(`  User ID: ${roberta.id}`);
      console.log(`  Role: ${roberta.role}`);
      console.log(`  Tenant ID: ${roberta.tenant_id}`);
    }

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await sql.end();
    process.exit(1);
  }
}

checkHayesIntakes();
