/**
 * Delete "Tony Camero" tenant and all related data
 * 
 * This will cascade delete:
 * - User account
 * - Tenant record
 * - Intakes
 * - Roadmap sections
 * - SOP tickets
 * - Agent threads/messages
 * - All related foreign key references
 */

import { db } from '../db/index';
import { users, tenants } from '../db/schema';
import { eq, or, like } from 'drizzle-orm';

async function main() {
  console.log('🔍 Searching for "Tony Camero" tenant...\n');

  // Find tenants with name containing "Tony Camero" (case insensitive)
  const tonyCameroTenants = await db
    .select()
    .from(tenants)
    .where(like(tenants.name, '%Tony Camero%'));

  if (tonyCameroTenants.length === 0) {
    console.log('❌ No tenant found with name containing "Tony Camero"');
    return;
  }

  console.log(`Found ${tonyCameroTenants.length} tenant(s):\n`);
  tonyCameroTenants.forEach((tenant, idx) => {
    console.log(`${idx + 1}. Tenant ID: ${tenant.id}`);
    console.log(`   Name: ${tenant.name}`);
    console.log(`   Owner ID: ${tenant.ownerUserId}`);
    console.log(`   Status: ${tenant.status}`);
    console.log(`   Created: ${tenant.createdAt}`);
    console.log('');
  });

  // Find associated user accounts
  const ownerIds = tonyCameroTenants.map(t => t.ownerUserId);
  const associatedUsers = await db
    .select()
    .from(users)
    .where(or(...ownerIds.map(id => eq(users.id, id))));

  console.log(`Found ${associatedUsers.length} associated user(s):\n`);
  associatedUsers.forEach((user, idx) => {
    console.log(`${idx + 1}. User ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log('');
  });

  console.log('⚠️  WARNING: This will DELETE all data for these tenants and users.');
  console.log('⚠️  All related records (intakes, roadmaps, tickets, threads, etc.) will be CASCADE DELETED.\n');

  // Check if we're in a safe environment
  if (process.env.NODE_ENV === 'production' && !process.env.FORCE_DELETE_PRODUCTION) {
    console.log('❌ Cannot delete in production without FORCE_DELETE_PRODUCTION=true');
    console.log('   Set FORCE_DELETE_PRODUCTION=true to allow deletion in production.\n');
    return;
  }

  console.log('🗑️  Proceeding with deletion...\n');

  // Delete tenants (cascade will handle related records)
  for (const tenant of tonyCameroTenants) {
    console.log(`Deleting tenant: ${tenant.name} (${tenant.id})`);
    await db.delete(tenants).where(eq(tenants.id, tenant.id));
    console.log(`✅ Tenant deleted\n`);
  }

  // Delete users
  for (const user of associatedUsers) {
    console.log(`Deleting user: ${user.email} (${user.id})`);
    await db.delete(users).where(eq(users.id, user.id));
    console.log(`✅ User deleted\n`);
  }

  console.log('✅ All "Tony Camero" tenant data has been deleted successfully!');
}

main()
  .then(() => {
    console.log('\n✅ Cleanup completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
