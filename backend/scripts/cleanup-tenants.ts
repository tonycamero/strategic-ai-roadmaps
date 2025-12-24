import { db } from '../src/db';
import { tenants, users, intakes, tenantDocuments } from '../src/db/schema';
import { inArray, not } from 'drizzle-orm';

const TENANTS_TO_KEEP = ['Hayes Real Estate Group', 'BrightFocus Marketing', 'Sample Chamber'];

async function cleanupDatabase() {
  console.log('🔍 Finding tenants to keep...');
  
  // Get all tenants to see what we have
  const allTenants = await db.select({ id: tenants.id, name: tenants.name }).from(tenants);
  
  console.log('\n📊 Current tenants:');
  allTenants.forEach(t => {
    const keep = TENANTS_TO_KEEP.includes(t.name);
    console.log(`  ${keep ? '✅' : '❌'} ${t.name} (${t.id})`);
  });
  
  const keepIds = allTenants
    .filter(t => TENANTS_TO_KEEP.includes(t.name))
    .map(t => t.id);
  
  if (keepIds.length === 0) {
    console.log('\n⚠️  No tenants found to keep! Aborting.');
    return;
  }
  
  console.log(`\n✅ Keeping ${keepIds.length} tenants:`, keepIds);
  
  const tenantsToDelete = allTenants.filter(t => !TENANTS_TO_KEEP.includes(t.name));
  
  if (tenantsToDelete.length === 0) {
    console.log('\n✨ Database is already clean!');
    return;
  }
  
  console.log(`\n🗑️  Will delete ${tenantsToDelete.length} tenants and their data...`);
  
  const deleteIds = tenantsToDelete.map(t => t.id);
  
  if (deleteIds.length === 0) {
    console.log('\n✨ No tenants to delete!');
    process.exit(0);
  }
  
  // Delete associated data first (foreign keys)
  console.log('  - Deleting documents...');
  const deletedDocs = await db.delete(tenantDocuments).where(inArray(tenantDocuments.tenantId, deleteIds));
  
  console.log('  - Deleting intakes...');
  // Get owner user IDs from tenants we're keeping
  const tenantsKeep = await db
    .select({ ownerId: tenants.ownerId })
    .from(tenants)
    .where(inArray(tenants.id, keepIds));
  
  const ownerIdsToKeep = tenantsKeep.map(t => t.ownerId);
  
  // Get all users that DON'T belong to kept tenants
  const usersToDelete = await db
    .select({ id: users.id })
    .from(users);
  
  const userIdsToDelete = usersToDelete
    .filter(u => !ownerIdsToKeep.includes(u.id))
    .map(u => u.id);
  
  if (userIdsToDelete.length > 0) {
    await db.delete(intakes).where(inArray(intakes.userId, userIdsToDelete));
    console.log('  - Deleting users...');
    await db.delete(users).where(inArray(users.id, userIdsToDelete));
  }
  
  console.log('  - Deleting tenants...');
  const deletedTenants = await db.delete(tenants).where(inArray(tenants.id, deleteIds));
  
  console.log('\n✨ Cleanup complete!');
  console.log(`   Deleted ${tenantsToDelete.length} tenants and their associated data.`);
  
  // Show remaining tenants
  const remaining = await db.select({ id: tenants.id, name: tenants.name }).from(tenants);
  console.log('\n📊 Remaining tenants:');
  remaining.forEach(t => console.log(`  ✅ ${t.name}`));
  
  process.exit(0);
}

cleanupDatabase().catch((err) => {
  console.error('❌ Error during cleanup:', err);
  process.exit(1);
});
