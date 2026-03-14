import { db } from '../db/index';
import { tenants } from '../db/schema';
import { ne } from 'drizzle-orm';
import { SnapshotService } from '../services/snapshot.service';

/**
 * DAILY SNAPSHOT JOB
 * Runs daily snapshot capture for all active tenants.
 */
export async function runDailySnapshots() {
    console.log('[SnapshotJob] Starting daily organizational snapshots...');

    // 1. Fetch active tenants (status != archived)
    const activeTenants = await db
        .select({ id: tenants.id })
        .from(tenants)
        .where(ne(tenants.status, 'archived'));

    console.log(`[SnapshotJob] Processing ${activeTenants.length} tenants.`);

    const results = {
        success: 0,
        skipped: 0,
        error: 0
    };

    // 2. Capture snapshots
    for (const tenant of activeTenants) {
        try {
            await SnapshotService.captureSnapshot(tenant.id);
            results.success++;
        } catch (error: any) {
            // Handle unique constraint (already snapshotted today)
            if (error.message?.includes('unique constraint') || error.code === '23505') {
                results.skipped++;
            } else {
                console.error(`[SnapshotJob] Error capturing snapshot for tenant ${tenant.id}:`, error.message);
                results.error++;
            }
        }
    }

    console.log('[SnapshotJob] Daily snapshots complete.', results);
    return results;
}
