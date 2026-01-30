
import { db } from '../db';
import { sopTickets, auditEvents } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';

/**
 * S3: Invalidation Cascade
 * Discovery Change -> Invalidate Findings -> Invalidate Tickets -> Invalidate Roadmap
 */
export async function invalidateDownstreamArtifacts(tenantId: string, actorUserId?: string) {
    console.log(`[Invalidation] Triggering cascade for tenant: ${tenantId}`);

    // 1. Invalidate Tickets
    // Strategy: Any ticket that is not 'ready' or 'in_progress' (or even those) 
    // should be marked as 'stale' or 'archived' when the source truth (Discovery) changes.
    // For V2, we mark them as 'archived' so they disappear from the active roadmap assembly.

    const result = await db
        .update(sopTickets)
        .set({
            status: 'archived',
            adminNotes: sql`concat(COALESCE(admin_notes, ''), '\n[System] Automatically archived due to Discovery Notes update.')`
        })
        .where(
            and(
                eq(sopTickets.tenantId, tenantId),
                // Only archive non-final tickets? 
                // Actually, canon S3 says "invalidate Roadmap", which depends on tickets.
                // So all current tickets for this session become invalid.
                sql`status != 'archived'`
            )
        )
        .returning();

    console.log(`[Invalidation] Archived ${result.length} tickets.`);

    // 2. Audit Event
    if (actorUserId) {
        await db.insert(auditEvents).values({
            tenantId,
            actorUserId,
            eventType: 'compiler_invalidation',
            entityType: 'discovery_notes',
            entityId: tenantId, // Proxy for tenant-level invalidation
            metadata: {
                ticketsArchived: result.length,
                reason: 'Discovery Notes Mutation'
            }
        });
    }

    return result.length;
}
