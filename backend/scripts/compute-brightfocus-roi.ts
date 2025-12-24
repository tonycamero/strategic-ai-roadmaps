import { db } from '../src/db/index.js';
import { tenants } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';
import { ImplementationMetricsService } from '../src/services/implementationMetrics.service.js';

async function main() {
  console.log('🔍 Computing ROI for BrightFocus Marketing...\n');

  // Find BrightFocus Marketing tenant
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.name, 'BrightFocus Marketing'),
  });

  if (!tenant) {
    console.log('❌ BrightFocus Marketing tenant not found');
    process.exit(1);
  }

  console.log('✅ Found tenant:', tenant.name);

  // Get roadmap ID directly
  const roadmaps = await db.query.roadmaps.findMany();
  const tenantRoadmap = roadmaps.find(r => r.ownerId === tenant.ownerId);

  if (!tenantRoadmap) {
    console.log('❌ No roadmap found for this tenant');
    process.exit(1);
  }

  console.log('✅ Found roadmap (ID:', tenantRoadmap.id, ')');

  // Use business data from tenant for assumptions
  const assumptions = {
    blendedHourlyRate: 75, // Default
    annualLeadVolume: (tenant.baselineMonthlyLeads || 40) * 12, // Monthly leads × 12
    avgDealValue: 5000, // Default
    implementationCost: 25000, // Default
  };

  console.log('\n💼 Business Assumptions:');
  console.log('   Blended Hourly Rate: $' + assumptions.blendedHourlyRate);
  console.log('   Annual Lead Volume:', assumptions.annualLeadVolume);
  console.log('   Average Deal Value: $' + assumptions.avgDealValue);
  console.log('   Implementation Cost: $' + assumptions.implementationCost);

  console.log('\n⚙️  Computing outcome...');

  try {
    const outcome = await ImplementationMetricsService.createOutcomeForRoadmap({
      tenantId: tenant.id,
      roadmapId: tenantRoadmap.id,
      assumptions,
    });

    console.log('\n✅ Outcome computed successfully!');
    console.log('\n💰 ROI Results:');
    console.log(JSON.stringify(outcome.realizedRoi, null, 2));
    console.log('\n📊 Deltas:');
    console.log(JSON.stringify(outcome.deltas, null, 2));
    console.log('\n🎯 Status:', outcome.status);
  } catch (error: any) {
    console.error('\n❌ Error computing outcome:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

main().catch(console.error);
