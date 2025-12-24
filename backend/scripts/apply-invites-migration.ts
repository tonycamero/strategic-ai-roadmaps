import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

async function applyInvitesMigration() {
  console.log('🔧 Applying invites table migration...');

  try {
    // Add tenant_id column
    console.log('  Adding tenant_id column...');
    await sql`
      ALTER TABLE invites 
      ADD COLUMN IF NOT EXISTS tenant_id UUID
    `;

    // Add foreign key constraint
    console.log('  Adding foreign key constraint...');
    await sql`
      ALTER TABLE invites
      DROP CONSTRAINT IF EXISTS invites_tenant_id_fkey
    `;
    
    await sql`
      ALTER TABLE invites
      ADD CONSTRAINT invites_tenant_id_fkey 
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    `;

    // Check if there are any existing invites without tenant_id
    const invitesWithoutTenant = await sql`
      SELECT COUNT(*) as count FROM invites WHERE tenant_id IS NULL
    `;
    
    console.log(`  Found ${invitesWithoutTenant[0].count} invites without tenant_id`);

    if (Number(invitesWithoutTenant[0].count) > 0) {
      console.log('  ⚠️  Warning: Some invites don\'t have tenant_id set. They may need manual cleanup.');
    }

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

applyInvitesMigration();
