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
  console.log('📊 Metrics Snapshot Capture\n');

  // Parse command line args
  const args = process.argv.slice(2);
  let tenantIdArg: string | undefined;
  let roadmapIdArg: string | undefined;
  let labelArg: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--tenant' && args[i + 1]) {
      tenantIdArg = args[i + 1];
      i++;
    } else if (args[i] === '--roadmapId' && args[i + 1]) {
      roadmapIdArg = args[i + 1];
      i++;
    } else if (args[i] === '--label' && args[i + 1]) {
      labelArg = args[i + 1];
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

  // Get label
  let label: string;
  if (labelArg) {
    label = labelArg;
  } else {
    console.log('\nSnapshot labels: baseline, 30d, 60d, 90d, custom');
    label = await question('Enter label: ');
  }

  const validLabels = ['baseline', '30d', '60d', '90d', 'custom'];
  if (!validLabels.includes(label)) {
    console.error('❌ Invalid label. Must be one of: baseline, 30d, 60d, 90d, custom');
    process.exit(1);
  }

  console.log('\n📈 Enter metrics:');

  const leadResponseMinutes = parseFloat(await question('Lead response time (minutes): '));
  const leadToApptRate = parseFloat(await question('Lead-to-appointment rate (0-100%): '));
  const closeRate = parseFloat(await question('Close rate (0-100%): '));
  const crmAdoptionRate = parseFloat(await question('CRM adoption rate (0-100%): '));
  const weeklyOpsHours = parseFloat(await question('Weekly ops hours: '));
  const nps = parseFloat(await question('NPS score: '));

  const notes = await question('Notes (optional): ');

  console.log('\n📝 Snapshot Summary:');
  console.log(`  Tenant: ${tenant.name}`);
  console.log(`  Roadmap: ${roadmap.id}`);
  console.log(`  Label: ${label}`);
  console.log(`  Lead response: ${leadResponseMinutes} min`);
  console.log(`  Lead-to-appt rate: ${leadToApptRate}%`);
  console.log(`  Close rate: ${closeRate}%`);
  console.log(`  CRM adoption: ${crmAdoptionRate}%`);
  console.log(`  Weekly ops hours: ${weeklyOpsHours}`);
  console.log(`  NPS: ${nps}`);

  const confirm = await question('\nSave snapshot? (y/n): ');
  if (confirm.toLowerCase() !== 'y') {
    console.log('❌ Cancelled');
    process.exit(0);
  }

  // Create snapshot
  const snapshot = await ImplementationMetricsService.createSnapshot({
    tenantId: tenant.id,
    roadmapId: roadmap.id,
    snapshotDate: new Date(),
    label,
    source: 'manual',
    metrics: {
      lead_response_minutes: leadResponseMinutes,
      lead_to_appt_rate: leadToApptRate,
      close_rate: closeRate,
      crm_adoption_rate: crmAdoptionRate,
      weekly_ops_hours: weeklyOpsHours,
      nps,
    },
    notes: notes || undefined,
  });

  console.log('\n✅ Snapshot saved!');
  console.log(`   ID: ${snapshot.id}`);
  console.log(`   Date: ${snapshot.snapshotDate.toISOString()}`);

  rl.close();
  process.exit(0);
}

main().catch((error) => {
  console.error('Error:', error);
  rl.close();
  process.exit(1);
});
