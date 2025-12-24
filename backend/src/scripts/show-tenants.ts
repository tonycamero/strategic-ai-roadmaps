import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function showTenants() {
  const sql = postgres(process.env.DATABASE_URL!);

  try {
    const tenants = await sql`
      SELECT id, name, owner_user_id, status, cohort_label
      FROM tenants
      ORDER BY created_at
    `;

    console.log('\n📋 Existing tenants:\n');
    tenants.forEach(t => {
      console.log(`  Tenant: ${t.name}`);
      console.log(`    id: ${t.id}`);
      console.log(`    ownerUserId: ${t.owner_user_id}`);
      console.log(`    status: ${t.status}`);
      console.log(`    cohort: ${t.cohort_label || 'none'}\n`);
    });

    // Show which users point to which tenant IDs
    console.log('👥 User -> Tenant mapping:\n');
    const users = await sql`
      SELECT u.id, u.email, u.role, u.tenant_id,
             CASE 
               WHEN t.id IS NOT NULL THEN 'EXISTS'
               ELSE 'MISSING'
             END as tenant_exists
      FROM users u
      LEFT JOIN tenants t ON u.tenant_id = t.id
      ORDER BY u.email
    `;

    users.forEach(u => {
      console.log(`  ${u.email} (${u.role})`);
      console.log(`    tenantId: ${u.tenant_id} [${u.tenant_exists}]`);
    });

    await sql.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await sql.end();
    process.exit(1);
  }
}

showTenants();
