#!/usr/bin/env node
import * as dotenv from 'dotenv';
dotenv.config();

import * as readline from 'readline';
import { db } from '../db/index.ts';
import { tenants, roadmaps } from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import { ImplementationMetricsService } from '../services/implementationMetrics.service.ts';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => rl.question(prompt, resolve));
}

async function main() {
  console.log('📊 Outcome Calculation Engine\n');

  // Parse command line args
  const args = process.argv.slice(2);
  let tenantIdArg: string | undefined;
  let roadmapIdArg: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--tenant' && args[i + 1]) {
      tenantIdArg = args[i + 1];
      i++;
    } else if (args[i] === '--roadmapId' && args[i + 1]) {
      roadmapIdArg = args[i + 1];
      i++;
    }
  }

  // Get tenant
  let tenantId: string;
  if (tenantIdArg) {
    tenantId = tenantIdArg;
  } else {
    const allTenants = await db.select().from(tenants);
    console.log('\nAvailable tenants:');
    allTenants.forEach((t) => {
      console.log(`  ${t.id} - ${t.name}`);
    });
    tenantId = await question('\nEnter tenant ID: ');
  }

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
  });

  if (!tenant) {
    console.error('❌ Tenant not found');
    process.exit(1);
  }

  console.log(`✓ Tenant: ${tenant.name}`);

  // Get roadmap
  let roadmapId: string;
  if (roadmapIdArg) {
    roadmapId = roadmapIdArg;
  } else {
    const tenantRoadmaps = await db.select().from(roadmaps).where(eq(roadmaps.tenantId, tenant.id));
    
    if (tenantRoadmaps.length === 0) {
      console.error('❌ No roadmaps found for this tenant');
      process.exit(1);
    }

    console.log('\nAvailable roadmaps:');
    tenantRoadmaps.forEach((r) => {
      console.log(`  ${r.id} - Status: ${r.status}`);
    });

    roadmapId = await question('\nEnter roadmap ID: ');
  }

  const roadmap = await db.query.roadmaps.findFirst({
    where: eq(roadmaps.id, roadmapId),
  });

  if (!roadmap) {
    console.error('❌ Roadmap not found');
    process.exit(1);
  }

  console.log(`✓ Roadmap: ${roadmap.id}`);

  // Check for snapshots
  const snapshots = await ImplementationMetricsService.getSnapshotsForRoadmap({
    tenantId: tenant.id,
    roadmapId: roadmap.id,
  });

  console.log(`\n📈 Found ${snapshots.length} snapshot(s):`);
  snapshots.forEach((s) => {
    console.log(`  - ${s.label} (${s.snapshotDate.toISOString().split('T')[0]})`);
  });

  if (snapshots.length < 2) {
    console.error('\n❌ Need at least 2 snapshots (baseline + one other) to compute outcomes');
    process.exit(1);
  }

  const baseline = snapshots.find((s) => s.label === 'baseline');
  if (!baseline) {
    console.error('\n❌ No baseline snapshot found');
    process.exit(1);
  }

  console.log('\n💡 Using default business assumptions:');
  console.log('  Blended hourly rate: $75');
  console.log('  Annual lead volume: 1,000');
  console.log('  Average deal value: $5,000');
  console.log('  Implementation cost: $25,000');
  
  const useCustom = await question('\nUse custom assumptions? (y/n): ');

  let assumptions = {};
  if (useCustom.toLowerCase() === 'y') {
    const blendedHourlyRate = parseFloat(await question('Blended hourly rate ($): '));
    const annualLeadVolume = parseFloat(await question('Annual lead volume: '));
    const avgDealValue = parseFloat(await question('Average deal value ($): '));
    const implementationCost = parseFloat(await question('Implementation cost ($): '));

    assumptions = {
      blendedHourlyRate,
      annualLeadVolume,
      avgDealValue,
      implementationCost,
    };
  }

  console.log('\n⚙️ Computing outcome...');

  try {
    const outcome = await ImplementationMetricsService.createOutcomeForRoadmap({
      tenantId: tenant.id,
      roadmapId: roadmap.id,
      assumptions,
    });

    console.log('\n✅ Outcome computed successfully!\n');
    console.log('📊 Deltas:');
    console.log(`  Lead response time: ${outcome.deltas.lead_response_minutes?.toFixed(1)} min faster`);
    console.log(`  Lead-to-appt rate: +${outcome.deltas.lead_to_appt_rate?.toFixed(1)}%`);
    console.log(`  CRM adoption: +${outcome.deltas.crm_adoption_rate?.toFixed(1)}%`);
    console.log(`  Weekly ops hours: ${outcome.deltas.weekly_ops_hours?.toFixed(1)} hours saved`);
    console.log(`  NPS: +${outcome.deltas.nps?.toFixed(0)}`);

    console.log('\n💰 Realized ROI:');
    console.log(`  Time savings: ${outcome.realizedRoi?.time_savings_hours_annual?.toFixed(0)} hrs/year ($${outcome.realizedRoi?.time_savings_value_annual?.toFixed(0)})`);
    console.log(`  Revenue impact: $${outcome.realizedRoi?.revenue_impact_annual?.toFixed(0)}/year`);
    console.log(`  Cost avoidance: $${outcome.realizedRoi?.cost_avoidance_annual?.toFixed(0)}/year`);
    console.log(`  Net ROI: ${outcome.realizedRoi?.net_roi_percent?.toFixed(1)}%`);

    console.log(`\n📍 Status: ${outcome.status.toUpperCase()}`);

  } catch (error) {
    console.error('\n❌ Error computing outcome:', error instanceof Error ? error.message : error);
    process.exit(1);
  }

  rl.close();
  process.exit(0);
}

main().catch((error) => {
  console.error('Error:', error);
  rl.close();
  process.exit(1);
});
