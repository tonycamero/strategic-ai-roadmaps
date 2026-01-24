// Simple cleanup script that uses the existing database connection
import { db } from '../src/db/index.js';
import { tenants } from '../src/db/schema.js';
import { notInArray } from 'drizzle-orm';

const tenantsToKeep = [
    'RiverBend Brewing Co',
    'BrightFocus Marketing',
    'Platform Administration'
];

console.log('🧹 Cleaning up test tenants...\n');

// Get all tenants first
const allTenants = await db.select().from(tenants);
console.log(`Found ${allTenants.length} total tenants:\n`);

allTenants.forEach(t => {
    const action = tenantsToKeep.includes(t.name) ? '✅ KEEP' : '🗑️ DELETE';
    console.log(`${action} - ${t.name}`);
});

console.log('\n');

// Delete test tenants
const result = await db
    .delete(tenants)
    .where(notInArray(tenants.name, tenantsToKeep));

console.log('✅ Cleanup complete!\n');

// Show remaining
const remaining = await db.select().from(tenants);
console.log(`Remaining tenants (${remaining.length}):`);
remaining.forEach(t => console.log(`  ✓ ${t.name}`));

process.exit(0);
