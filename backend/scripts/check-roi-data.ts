import { db } from '../src/db/index.js';
import { tenants, roadmaps, roadmapOutcomes, implementationSnapshots } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('🔍 Checking ROI data for BrightFocus Marketing...\n');

  // Find BrightFocus Marketing tenant
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.name, 'BrightFocus Marketing'),
  });

  if (!tenant) {
    console.log('❌ BrightFocus Marketing tenant not found');
    process.exit(1);
  }

  console.log('✅ Found tenant:', tenant.name, `(ID: ${tenant.id})`);
  console.log('   Owner ID:', tenant.ownerId);

  // Find roadmap
  const roadmap = await db.query.roadmaps.findFirst({
    where: eq(roadmaps.ownerId, tenant.ownerId),
  });

  if (!roadmap) {
    console.log('❌ No roadmap found for this tenant');
    process.exit(1);
  }

  console.log('✅ Found roadmap (ID:', roadmap.id, ')');

  // Find snapshots
  const snapshots = await db.query.implementationSnapshots.findMany({
    where: eq(implementationSnapshots.roadmapId, roadmap.id),
  });

  console.log(`\n📊 Snapshots: ${snapshots.length} found`);
  snapshots.forEach(s => {
    console.log(`   - ${s.label} (${s.snapshotDate})`);
    console.log(`     Metrics:`, JSON.stringify(s.metrics, null, 2));
  });

  // Find outcome
  const outcome = await db.query.roadmapOutcomes.findFirst({
    where: eq(roadmapOutcomes.roadmapId, roadmap.id),
  });

  if (!outcome) {
    console.log('\n❌ No roadmap outcome found');
    console.log('\n💡 To fix: You need to create a baseline snapshot and compute the outcome');
    console.log('   1. Create baseline snapshot via API: POST /api/dashboard/owner/roi/baseline');
    console.log('   2. Create time snapshots: POST /api/dashboard/owner/roi/snapshot');
    console.log('   3. Compute outcome: POST /api/dashboard/owner/roi/compute-outcome');
    process.exit(0);
  }

  console.log('\n✅ Found outcome (ID:', outcome.id, ')');
  console.log('   Baseline Snapshot ID:', outcome.baselineSnapshotId);
  console.log('   30d Snapshot ID:', outcome.at30dSnapshotId);
  console.log('   60d Snapshot ID:', outcome.at60dSnapshotId);
  console.log('   90d Snapshot ID:', outcome.at90dSnapshotId);
  console.log('\n💰 Realized ROI:');
  console.log(JSON.stringify(outcome.realizedRoi, null, 2));

  process.exit(0);
}

main().catch(console.error);
