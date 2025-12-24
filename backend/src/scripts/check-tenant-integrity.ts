import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkIntegrity() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  const sql = postgres(connectionString);

  try {
    // Check users with owner_id that don't have matching tenants
    const orphanedUsers = await sql`
      SELECT u.id, u.email, u.owner_id, u.role
      FROM users u
      LEFT JOIN tenants t ON u.owner_id = t.id
      WHERE u.owner_id IS NOT NULL AND t.id IS NULL
    `;

    console.log(`\n📊 Found ${orphanedUsers.length} users with missing tenants:\n`);
    orphanedUsers.forEach(u => {
      console.log(`  - ${u.email} (${u.role})`);
      console.log(`    user_id: ${u.id}`);
      console.log(`    owner_id (missing tenant): ${u.owner_id}\n`);
    });

    // Check all tenants
    const allTenants = await sql`
      SELECT id, name, owner_id FROM tenants
    `;
    console.log(`📋 Total tenants in database: ${allTenants.length}\n`);

    // Check all users
    const allUsers = await sql`
      SELECT id, email, role, owner_id FROM users
    `;
    console.log(`👥 Total users in database: ${allUsers.length}`);
    
    const usersWithOwner = allUsers.filter(u => u.owner_id !== null);
    console.log(`   - With owner_id: ${usersWithOwner.length}`);
    console.log(`   - Without owner_id: ${allUsers.length - usersWithOwner.length}\n`);

    await sql.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await sql.end();
    process.exit(1);
  }
}

checkIntegrity();
