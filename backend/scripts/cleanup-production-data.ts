import 'dotenv/config';
import { db } from '../src/db/index.js';
import {
    tenants,
    users,
    intakes,
    roadmaps,
    invites,
    onboardingStates,
    tenantDocuments,
    agentConfigs,
    agentThreads,
    agentMessages,
    agentLogs,
    agentRoutingRules,
    agentStrategyContexts,
    tenantVectorStores,
    roadmapSections,
    ticketPacks,
    ticketInstances,
    implementationSnapshots,
    roadmapOutcomes,
    discoveryCallNotes,
    sopTickets,
    diagnosticSnapshots,
    tenantMetricsDaily,
    auditEvents,
    tenantFeatureFlags,
    impersonationSessions
} from '../src/db/schema.js';
import { sql, inArray } from 'drizzle-orm';


/**
 * PRODUCTION DATA CLEANUP SCRIPT
 * 
 * This script removes all client data EXCEPT:
 * - BrightFocus Marketing (bf472c81-f9d7-4fab-84b5-58cf9e1ebf06)
 * - Platform Administration (99c23d61-aa5b-4b49-80fc-7595db756e3a)
 * 
 * WARNING: This is a destructive operation. Make sure you have a backup!
 */

const TENANTS_TO_KEEP = [
    'bf472c81-f9d7-4fab-84b5-58cf9e1ebf06', // BrightFocus Marketing
    '99c23d61-aa5b-4b49-80fc-7595db756e3a'  // Platform Administration (system)
];

async function cleanupData() {
    console.log('🧹 Starting production data cleanup...\n');

    try {
        // Get list of tenants to delete
        const allTenants = await db.select().from(tenants);
        const tenantsToDelete = allTenants.filter(t => !TENANTS_TO_KEEP.includes(t.id));

        console.log('📊 Current tenants:');
        allTenants.forEach(t => {
            const keep = TENANTS_TO_KEEP.includes(t.id);
            console.log(`  ${keep ? '✅ KEEP' : '❌ DELETE'}: ${t.name} (${t.id})`);
        });

        if (tenantsToDelete.length === 0) {
            console.log('\n✨ No tenants to delete. Database is already clean!');
            process.exit(0);
        }

        console.log(`\n⚠️  About to delete ${tenantsToDelete.length} tenant(s) and all associated data.`);
        console.log('   Press Ctrl+C within 5 seconds to cancel...\n');

        await new Promise(resolve => setTimeout(resolve, 5000));

        const tenantIdsToDelete = tenantsToDelete.map(t => t.id);

        // Start deletion process
        console.log('🗑️  Deleting associated data...\n');

        // Delete in reverse dependency order to avoid foreign key constraints

        // 1. Agent-related data
        console.log('  - Deleting agent messages...');
        await db.execute(sql`
      DELETE FROM ${agentMessages} 
      WHERE agent_thread_id IN (
        SELECT id FROM ${agentThreads} 
        WHERE ${inArray(agentThreads.tenantId, tenantIdsToDelete)}
      )
    `);

        console.log('  - Deleting agent threads...');
        await db.delete(agentThreads).where(inArray(agentThreads.tenantId, tenantIdsToDelete));

        console.log('  - Deleting agent logs...');
        await db.execute(sql`
      DELETE FROM ${agentLogs} 
      WHERE agent_config_id IN (
        SELECT id FROM ${agentConfigs} 
        WHERE ${inArray(agentConfigs.tenantId, tenantIdsToDelete)}
      )
    `);

        console.log('  - Deleting agent routing rules...');
        await db.delete(agentRoutingRules).where(inArray(agentRoutingRules.tenantId, tenantIdsToDelete));

        console.log('  - Deleting agent configs...');
        await db.delete(agentConfigs).where(inArray(agentConfigs.tenantId, tenantIdsToDelete));

        console.log('  - Deleting agent strategy contexts...');
        await db.delete(agentStrategyContexts).where(inArray(agentStrategyContexts.tenantId, tenantIdsToDelete));

        console.log('  - Deleting tenant vector stores...');
        await db.delete(tenantVectorStores).where(inArray(tenantVectorStores.tenantId, tenantIdsToDelete));

        // 2. Roadmap-related data
        console.log('  - Deleting roadmap sections...');
        await db.execute(sql`
      DELETE FROM ${roadmapSections} 
      WHERE roadmap_id IN (
        SELECT id FROM ${roadmaps} 
        WHERE ${inArray(roadmaps.tenantId, tenantIdsToDelete)}
      )
    `);

        console.log('  - Deleting ticket instances...');
        await db.execute(sql`
      DELETE FROM ${ticketInstances} 
      WHERE ticket_pack_id IN (
        SELECT id FROM ${ticketPacks} 
        WHERE ${inArray(ticketPacks.tenantId, tenantIdsToDelete)}
      )
    `);

        console.log('  - Deleting ticket packs...');
        await db.delete(ticketPacks).where(inArray(ticketPacks.tenantId, tenantIdsToDelete));

        console.log('  - Deleting roadmap outcomes...');
        await db.delete(roadmapOutcomes).where(inArray(roadmapOutcomes.tenantId, tenantIdsToDelete));

        console.log('  - Deleting implementation snapshots...');
        await db.delete(implementationSnapshots).where(inArray(implementationSnapshots.tenantId, tenantIdsToDelete));

        console.log('  - Deleting roadmaps...');
        await db.delete(roadmaps).where(inArray(roadmaps.tenantId, tenantIdsToDelete));

        // 3. SOP and diagnostic data
        console.log('  - Deleting SOP tickets...');
        await db.delete(sopTickets).where(inArray(sopTickets.tenantId, tenantIdsToDelete));

        console.log('  - Deleting diagnostic snapshots...');
        await db.execute(sql`
      DELETE FROM ${diagnosticSnapshots}
      WHERE user_id IN (
        SELECT id FROM ${users} WHERE ${inArray(users.tenantId, tenantIdsToDelete)}
      )
    `);

        console.log('  - Deleting discovery call notes...');
        await db.delete(discoveryCallNotes).where(inArray(discoveryCallNotes.tenantId, tenantIdsToDelete));

        // 4. Documents and intakes
        console.log('  - Deleting tenant documents...');
        await db.delete(tenantDocuments).where(inArray(tenantDocuments.tenantId, tenantIdsToDelete));

        console.log('  - Deleting intakes...');
        await db.delete(intakes).where(inArray(intakes.tenantId, tenantIdsToDelete));

        // 5. Onboarding and invites
        console.log('  - Deleting onboarding states...');
        await db.delete(onboardingStates).where(inArray(onboardingStates.tenantId, tenantIdsToDelete));

        console.log('  - Deleting invites...');
        await db.delete(invites).where(inArray(invites.tenantId, tenantIdsToDelete));

        // 6. Metrics and audit
        console.log('  - Deleting tenant metrics...');
        await db.delete(tenantMetricsDaily).where(inArray(tenantMetricsDaily.tenantId, tenantIdsToDelete));

        console.log('  - Deleting audit events...');
        await db.delete(auditEvents).where(inArray(auditEvents.tenantId, tenantIdsToDelete));

        // 7. Feature flags and impersonation
        console.log('  - Deleting tenant feature flags...');
        await db.delete(tenantFeatureFlags).where(inArray(tenantFeatureFlags.tenantId, tenantIdsToDelete));

        console.log('  - Deleting impersonation sessions...');
        await db.delete(impersonationSessions).where(inArray(impersonationSessions.tenantId, tenantIdsToDelete));

        // 8. Users (this will cascade to any remaining dependent records)
        console.log('  - Deleting users...');
        await db.delete(users).where(inArray(users.tenantId, tenantIdsToDelete));

        // 9. Finally, delete the tenants themselves
        console.log('  - Deleting tenants...');
        await db.delete(tenants).where(inArray(tenants.id, tenantIdsToDelete));

        console.log('\n✅ Cleanup complete!\n');

        // Show remaining tenants
        const remainingTenants = await db.select().from(tenants);
        console.log('📊 Remaining tenants:');
        remainingTenants.forEach(t => {
            console.log(`  ✅ ${t.name} (${t.id})`);
        });

        console.log('\n🎉 Database is now clean and ready for production!');

    } catch (error) {
        console.error('\n❌ Error during cleanup:', error);
        process.exit(1);
    }

    process.exit(0);
}

cleanupData();
