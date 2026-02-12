#!/usr/bin/env node
import * as dotenv from 'dotenv';
dotenv.config();

import * as fs from 'fs';
import * as path from 'path';
import { OutcomeAggregateService } from '../services/outcomeAggregate.service.ts';

async function main() {
  console.log('📊 Aggregating Outcomes Across All Tenants\n');

  try {
    const results = await OutcomeAggregateService.computeGlobalAnalytics();

    console.log('✅ Aggregation complete!\n');
    console.log('📈 Summary:');
    console.log(`  Total samples: ${results.roiStats.samples}`);
    console.log(`  Status distribution:`);
    Object.entries(results.statusDistribution).forEach(([status, count]) => {
      console.log(`    ${status}: ${count}`);
    });

    console.log('\n💰 ROI Statistics:');
    console.log(`  Median: ${results.roiStats.median.toFixed(1)}%`);
    console.log(`  P25: ${results.roiStats.p25.toFixed(1)}%`);
    console.log(`  P75: ${results.roiStats.p75.toFixed(1)}%`);

    console.log('\n📊 Metric Improvements (Median):');
    Object.entries(results.metrics).forEach(([metric, stats]) => {
      if (stats.samples > 0) {
        console.log(`  ${metric}: ${stats.median.toFixed(2)} (${stats.samples} samples)`);
      }
    });

    // Ensure analytics directory exists
    const analyticsDir = path.join(process.cwd(), 'analytics');
    if (!fs.existsSync(analyticsDir)) {
      fs.mkdirSync(analyticsDir, { recursive: true });
    }

    // Write results to JSON file
    const outputPath = path.join(analyticsDir, 'global_outcomes.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

    console.log(`\n✅ Results saved to ${outputPath}`);
  } catch (error) {
    console.error('❌ Error aggregating outcomes:', error instanceof Error ? error.message : error);
    process.exit(1);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
