#!/usr/bin/env node
import * as dotenv from 'dotenv';
dotenv.config();

import { RoadmapRefreshService } from '../services/roadmapRefresh.service';

async function main() {
  const tenantId = process.argv[2];
  const roadmapId = process.argv[3];

  if (!tenantId || !roadmapId) {
    console.error('❌ Usage: npm run roadmap:refresh -- <tenantId> <roadmapId>');
    process.exit(1);
  }

  console.log('🔄 Refreshing roadmap...');
  console.log(`  Tenant: ${tenantId}`);
  console.log(`  Roadmap: ${roadmapId}\n`);

  try {
    const result = await RoadmapRefreshService.refreshRoadmap({
      tenantId,
      roadmapId,
    });

    console.log('✅ Roadmap refreshed successfully!\n');
    console.log(`  New roadmap ID: ${result.newRoadmapId}`);
    console.log(`  Version: ${result.version}`);
  } catch (error) {
    console.error('❌ Error refreshing roadmap:', error instanceof Error ? error.message : error);
    process.exit(1);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
