import { db } from '../db/index';
import { organizationalSnapshots } from '../db/schema';
import { resolveTenantLifecycleSnapshot } from './tenantStateAggregation.service';
import crypto from 'crypto';

export class SnapshotService {
    /**
     * Captures a daily immutable organizational snapshot derived from the lifecycle projection spine.
     */
    static async captureSnapshot(tenantId: string) {
        // 1. Call resolveTenantLifecycleSnapshot(tenantId)
        const state = await resolveTenantLifecycleSnapshot(tenantId);

        // 2. Serialize returned projection state
        const serialized = JSON.stringify(state);

        // 3. Generate SHA-256 hash of serialized state
        const snapshotHash = crypto
            .createHash('sha256')
            .update(serialized)
            .digest('hex');

        // Snapshot date (YYYY-MM-DD)
        const snapshotDate = new Date().toISOString().split('T')[0];

        // 4. Store snapshot record
        const [snapshot] = await db
            .insert(organizationalSnapshots)
            .values({
                tenantId,
                snapshotDate,
                snapshotHash,
                state: state as any,
                createdAt: new Date()
            })
            .returning();

        return {
            snapshotId: snapshot.id,
            snapshotHash: snapshot.snapshotHash
        };
    }
}
