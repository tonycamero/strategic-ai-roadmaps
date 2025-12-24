import { db } from '../db';
import { roadmaps } from '../db/schema';
import { desc, eq } from 'drizzle-orm';
import { syncAgentsForRoadmap } from './roadmapAgentSync.service';

/**
 * Resync agents for a single tenant
 * Finds their latest roadmap and rebuilds agent configs + OpenAI assistants
 */
export async function resyncAgentsForTenant(tenantId: string, actorUserId?: string) {
  // Get latest roadmap for tenant
  const [roadmap] = await db
    .select()
    .from(roadmaps)
    .where(eq(roadmaps.tenantId, tenantId))
    .orderBy(desc(roadmaps.createdAt))
    .limit(1);

  if (!roadmap) {
    console.warn(`[agent-resync] No roadmap found for tenant ${tenantId}, skipping`);
    return { skipped: true, reason: 'no_roadmap' };
  }

  console.log(`[agent-resync] Resyncing agents for tenant ${tenantId}, roadmap ${roadmap.id}`);
  await syncAgentsForRoadmap(tenantId, roadmap.id, actorUserId);
  
  return { success: true, roadmapId: roadmap.id };
}
