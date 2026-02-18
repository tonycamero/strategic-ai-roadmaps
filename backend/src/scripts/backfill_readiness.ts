import { db } from '../db/index';
import { tenants, roadmaps, sopTickets } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { AUDIT_EVENT_TYPES } from '../constants/auditEventTypes';

/**
 * Backfill Readiness Flags Script
 * 
 * Logic:
 * 1. If tenant has a delivered roadmap -> set ALL flags (KB, Roles, Exec)
 * 2. If tenant has moderated tickets (at least one approved) -> set KB and Roles flags
 */

async function main() {
    console.log('--- Starting Readiness Flag Backfill ---');

    const allTenants = await db.select().from(tenants);
    console.log(`Found ${allTenants.length} tenants.`);

    let updatedCount = 0;

    for (const tenant of allTenants) {
        const backupDate = tenant.createdAt || new Date();
        let updates: any = {};

        // Check for delivered roadmap
        const [roadmap] = await db
            .select()
            .from(roadmaps)
            .where(and(eq(roadmaps.tenantId, tenant.id), eq(roadmaps.status, 'delivered')))
            .limit(1);

        if (roadmap) {
            console.log(`[Tenant: ${tenant.name}] Roadmap DELIVERED. Setting all readiness flags.`);
            updates = {
                knowledgeBaseReadyAt: roadmap.deliveredAt || roadmap.createdAt || backupDate,
                rolesValidatedAt: roadmap.deliveredAt || roadmap.createdAt || backupDate,
                execReadyAt: roadmap.deliveredAt || roadmap.createdAt || backupDate,
                execReadyByUserId: tenant.ownerUserId,
            };
        } else if (tenant.lastDiagnosticId) {
            // Check if moderation is done (at least one approved, none pending)
            const stats = await db.select({
                pending: sql<number>`count(*) filter (where moderation_status = 'pending')`,
                approved: sql<number>`count(*) filter (where approved = true)`,
                total: sql<number>`count(*)`
            })
                .from(sopTickets)
                .where(and(eq(sopTickets.tenantId, tenant.id), eq(sopTickets.diagnosticId, tenant.lastDiagnosticId)))
                .then(r => r[0]);

            if (stats.total > 0 && stats.pending === 0 && stats.approved > 0) {
                console.log(`[Tenant: ${tenant.name}] Moderation complete. Setting KB and Roles flags.`);
                updates = {
                    knowledgeBaseReadyAt: backupDate,
                    rolesValidatedAt: backupDate,
                };
            }
        }

        if (Object.keys(updates).length > 0) {
            await db.update(tenants).set(updates).where(eq(tenants.id, tenant.id));

            // Audit using raw SQL to bypass type issues
            await db.execute(sql`
                INSERT INTO audit_events (tenant_id, event_type, entity_type, entity_id, metadata, created_at)
                VALUES (
                    ${tenant.id}, 
                    ${AUDIT_EVENT_TYPES.READINESS_BACKFILLED}, 
                    'tenant', 
                    ${tenant.id}, 
                    ${JSON.stringify({ updates })}, 
                    NOW()
                )
            `);

            updatedCount++;
        }
    }

    console.log(`--- Backfill Complete. Updated ${updatedCount} tenants. ---`);
    process.exit(0);
}

main().catch(err => {
    console.error('Backfill failed:', err);
    process.exit(1);
});
