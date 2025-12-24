/**
 * Resync OpenAI assistants + agent_configs for ALL tenants that have at least one roadmap.
 *
 * Usage:
 *   cd backend
 *   npx tsx scripts/resync-all-agent-configs.ts
 */

import 'dotenv/config';
import { db } from '../src/db';
import { tenants, roadmaps } from '../src/db/schema';
import { resyncAgentsForTenant } from '../src/services/agentResyncAll.service';
import { eq, sql } from 'drizzle-orm';

async function main() {
  console.log('[agent-resync] Starting global assistant resync…');

  // Get all tenants that have at least one roadmap
  const allRoadmaps = await db
    .select({ tenantId: roadmaps.tenantId })
    .from(roadmaps);

  const tenantIds = [...new Set(allRoadmaps.map(r => r.tenantId))];

  console.log(`[agent-resync] Found ${tenantIds.length} tenants with roadmaps`);

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (const tenantId of tenantIds) {
    try {
      // Optional: verify tenant exists
      const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
      if (!tenant) {
        console.warn(`[agent-resync] Tenant ${tenantId} not found, skipping`);
        skipCount++;
        continue;
      }

      const result = await resyncAgentsForTenant(tenantId, 'system');
      
      if (result.skipped) {
        skipCount++;
      } else {
        successCount++;
        console.log(`[agent-resync] ✅ Done for tenant ${tenantId} (${tenant.name})`);
      }
    } catch (err) {
      failCount++;
      console.error(`[agent-resync] ❌ Failed for tenant ${tenantId}:`, err);
    }
  }

  console.log('\n[agent-resync] Global assistant resync complete');
  console.log(`  ✅ Success: ${successCount}`);
  console.log(`  ⏭️  Skipped: ${skipCount}`);
  console.log(`  ❌ Failed: ${failCount}`);
}

main().catch(err => {
  console.error('[agent-resync] Fatal error:', err);
  process.exit(1);
});
