import 'dotenv/config';
import { db } from '../src/db/index.js';
import { implementationSnapshots, roadmapOutcomes, roadmaps, tenants } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';

async function checkData() {
  const tenantName = 'BrightFocus Marketing';
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.name, tenantName),
  });

  if (!tenant) {
    console.log('Tenant not found');
    process.exit(0);
  }

  const tenantId = tenant.id;
  const snapshots = await db.select().from(implementationSnapshots).where(eq(implementationSnapshots.tenantId, tenantId));
  const outcomes = await db.select().from(roadmapOutcomes).where(eq(roadmapOutcomes.tenantId, tenantId));
  const rms = await db.select().from(roadmaps).where(eq(roadmaps.tenantId, tenantId));

  console.log(JSON.stringify({ tenant, snapshots, outcomes, roadmaps: rms }, null, 2));
  process.exit(0);
}

checkData();
