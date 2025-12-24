import { db } from '../src/db';
import {
  tenants,
  users,
  intakes,
  tenantDocuments,
  tenantMetricsDaily,
  tenantFeatureFlags,
  agentConfigs,
  impersonationSessions,
  auditEvents,
  trainingProgress,
  invites,
  roadmaps,
} from '../src/db/schema';
import { and, eq, inArray, or } from 'drizzle-orm';

const KEEP_NAMES = ['Hayes Real Estate Group', 'BrightFocus Marketing', 'Platform Administration'];

async function deleteTenantById(tenantId: string) {
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId));
  if (!tenant) return;

  // Collect users in this tenant
  const tenantUsers = await db.select({ id: users.id }).from(users).where(eq(users.tenantId, tenantId));
  const userIds = tenantUsers.map(u => u.id);

  console.log(`\n— Deleting data for tenant '${tenant.name}' (${tenant.id})`);

  // Order matters – delete children first
  await db.delete(tenantDocuments).where(eq(tenantDocuments.tenantId, tenantId));
  await db.delete(tenantMetricsDaily).where(eq(tenantMetricsDaily.tenantId, tenantId));
  await db.delete(tenantFeatureFlags).where(eq(tenantFeatureFlags.tenantId, tenantId));
  await db.delete(agentConfigs).where(eq(agentConfigs.tenantId, tenantId));
  await db.delete(impersonationSessions).where(eq(impersonationSessions.tenantId, tenantId));
  await db.delete(auditEvents).where(or(eq(auditEvents.tenantId, tenantId), userIds.length ? inArray(auditEvents.actorUserId, userIds) : eq(auditEvents.actorUserId, '00000000-0000-0000-0000-000000000000')));

  // Intakes & Roadmaps & Invites tied by tenantId
  await db.delete(intakes).where(eq(intakes.tenantId, tenantId));
  await db.delete(roadmaps).where(eq(roadmaps.tenantId, tenantId));
  await db.delete(invites).where(eq(invites.tenantId, tenantId));
  await db.delete(trainingProgress).where(userIds.length ? inArray(trainingProgress.userId, userIds) : eq(trainingProgress.userId, '00000000-0000-0000-0000-000000000000'));

  // Clear owner_user_id first to break circular reference
  await db.update(tenants).set({ ownerUserId: null }).where(eq(tenants.id, tenantId));
  
  // Now delete users and tenant
  await db.delete(users).where(eq(users.tenantId, tenantId));
  await db.delete(tenants).where(eq(tenants.id, tenantId));

  console.log(`✓ Deleted tenant '${tenant.name}'`);
}

async function main() {
  const all = await db.select({ id: tenants.id, name: tenants.name }).from(tenants);
  const toDelete = all.filter(t => !KEEP_NAMES.includes(t.name));

  console.log(`Keeping: ${KEEP_NAMES.join(', ')}`);
  console.log(`Found ${toDelete.length} tenants to delete`);

  for (const t of toDelete) {
    try {
      await deleteTenantById(t.id);
    } catch (err) {
      console.error(`✗ Failed to delete tenant ${t.name} (${t.id})`, err);
    }
  }

  const remaining = await db.select({ id: tenants.id, name: tenants.name }).from(tenants);
  console.log('\nRemaining tenants:');
  remaining.forEach(t => console.log(`  - ${t.name}`));
}

main().catch((e) => {
  console.error('Cleanup failed:', e);
  process.exit(1);
});
