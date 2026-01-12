import { db } from '../src/db';
import { tenants } from '../src/db/schema';
import { notInArray, eq } from 'drizzle-orm';

async function cleanupTestTenants() {
    console.log('🧹 Starting tenant cleanup...\n');

    // Define the tenants to KEEP
    const tenantsToKeep = [
        'RiverBend Brewing Co',
        'BrightFocus Marketing',
        'Platform Administration'
    ];

    console.log('✅ Tenants to KEEP:');
    tenantsToKeep.forEach(name => console.log(`   - ${name}`));
    console.log('');

    // First, let's see what we have
    const allTenants = await db
        .select({
            id: tenants.id,
            name: tenants.name,
            createdAt: tenants.createdAt
        })
        .from(tenants);

    console.log(`📊 Found ${allTenants.length} total tenants\n`);

    // Identify tenants to delete
    const tenantsToDelete = allTenants.filter(
        t => !tenantsToKeep.includes(t.name)
    );

    if (tenantsToDelete.length === 0) {
        console.log('✨ No test tenants to delete!');
        process.exit(0);
    }

    console.log(`🗑️  Tenants to DELETE (${tenantsToDelete.length}):`);
    tenantsToDelete.forEach(t => {
        console.log(`   - ${t.name} (${t.id})`);
    });
    console.log('');

    // Delete the test tenants
    // Note: This will cascade delete related records due to foreign key constraints
    const deleteIds = tenantsToDelete.map(t => t.id);
    
    const result = await db
        .delete(tenants)
        .where(notInArray(tenants.name, tenantsToKeep));

    console.log(`✅ Deleted ${tenantsToDelete.length} test tenants`);
    console.log('');

    // Verify the cleanup
    const remainingTenants = await db
        .select({
            name: tenants.name,
            createdAt: tenants.createdAt
        })
        .from(tenants);

    console.log(`📊 Remaining tenants (${remainingTenants.length}):`);
    remainingTenants.forEach(t => {
        console.log(`   ✓ ${t.name}`);
    });
    console.log('');
    console.log('🎉 Cleanup complete!');

    process.exit(0);
}

cleanupTestTenants().catch((err) => {
    console.error('❌ Error during cleanup:', err);
    process.exit(1);
});
