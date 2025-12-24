import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

async function cleanupOrphanedInvites() {
  console.log('🧹 Cleaning up orphaned invites...');

  try {
    // First, let's see what we have
    const orphanedInvites = await sql`
      SELECT id, email, role, accepted, created_at
      FROM invites 
      WHERE tenant_id IS NULL
      ORDER BY created_at DESC
    `;

    console.log(`\nFound ${orphanedInvites.length} orphaned invites:`);
    orphanedInvites.forEach((invite, index) => {
      console.log(`  ${index + 1}. ${invite.email} (${invite.role}) - Accepted: ${invite.accepted} - Created: ${invite.created_at}`);
    });

    // Delete all orphaned invites since they're invalid without a tenant
    console.log('\n🗑️  Deleting orphaned invites...');
    const result = await sql`
      DELETE FROM invites 
      WHERE tenant_id IS NULL
      RETURNING id
    `;

    console.log(`✅ Deleted ${result.length} orphaned invites`);
    
    // Now make tenant_id NOT NULL
    console.log('\n🔒 Making tenant_id column NOT NULL...');
    await sql`
      ALTER TABLE invites 
      ALTER COLUMN tenant_id SET NOT NULL
    `;

    console.log('✅ Cleanup completed successfully!');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

cleanupOrphanedInvites();
