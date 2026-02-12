import { db } from '../db/index.ts';
import { discoveryCallNotes, tenants } from '../db/schema.ts';
import { eq, desc } from 'drizzle-orm';
import { invalidateDownstreamArtifacts } from './compilerInvalidation.service.ts';

export async function saveDiscoveryCallNotes(params: {
  tenantId: string;
  ownerUserId: string;
  notes: string;
}): Promise<void> {
  const { tenantId, ownerUserId, notes } = params;

  // Keep only the latest record (simple "upsert" behavior)
  const existing = await db
    .select()
    .from(discoveryCallNotes)
    .where(eq(discoveryCallNotes.tenantId, tenantId))
    .orderBy(desc(discoveryCallNotes.createdAt));

  if (existing.length > 0) {
    await db
      .update(discoveryCallNotes)
      .set({
        notes,
        updatedAt: new Date(),
      })
      .where(eq(discoveryCallNotes.id, existing[0].id));
  } else {
    await db.insert(discoveryCallNotes).values({
      tenantId,
      createdByUserId: ownerUserId,
      notes,
    });
  }

  // Mark tenant as discovery_complete
  await db
    .update(tenants)
    .set({ discoveryComplete: true })
    .where(eq(tenants.id, tenantId));

  // S3: Invalidation Cascade
  await invalidateDownstreamArtifacts(tenantId, ownerUserId);
}

export async function getLatestDiscoveryCallNotes(tenantId: string) {
  const rows = await db
    .select()
    .from(discoveryCallNotes)
    .where(eq(discoveryCallNotes.tenantId, tenantId))
    .orderBy(desc(discoveryCallNotes.createdAt))
    .limit(1);

  return rows[0] ?? null;
}
