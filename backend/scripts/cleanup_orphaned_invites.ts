import { db } from '../src/db';
import { invites, tenants } from '../src/db/schema';
import { sql } from 'drizzle-orm';

/**
 * Clean up orphaned invites that reference non-existent tenants
 * Run this before applying schema migrations
 */
async function cleanupOrphanedInvites() {
    console.log('[Cleanup] Starting orphaned invites cleanup...');

    try {
        // Delete invites where tenant_id doesn't exist in tenants table
        const result = await db.execute(sql`
      DELETE FROM ${invites} 
      WHERE tenant_id NOT IN (SELECT id FROM ${tenants})
    `);

        console.log('[Cleanup] Deleted orphaned invites:', result);
        console.log('[Cleanup] ✅ Cleanup complete!');
        console.log('[Cleanup] You can now run: npm run db:push');
    } catch (error) {
        console.error('[Cleanup] Error during cleanup:', error);
        throw error;
    }

    process.exit(0);
}

cleanupOrphanedInvites();
