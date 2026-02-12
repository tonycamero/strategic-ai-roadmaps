/**
 * Test Script: Run Hayes diagnostic through SOP Ticket Engine
 * 
 * Usage: pnpm test:diagnostic
 */

import * as dotenv from 'dotenv';
dotenv.config();

import * as fs from 'fs';
import * as path from 'path';
import { ingestDiagnostic } from '../services/diagnosticIngestion.service.ts';
import type { DiagnosticMap } from '../types/diagnostic.ts';

async function main() {
  console.log('\n🧪 TESTING HAYES DIAGNOSTIC → SOP TICKET ENGINE');
  console.log('='.repeat(60), '\n');

  // Load Hayes mock diagnostic
  const mockPath = path.join(__dirname, '../../storage/diagnostics/hayes_mock.json');
  const diagnosticMap: DiagnosticMap = JSON.parse(fs.readFileSync(mockPath, 'utf-8'));

  console.log(`📋 Loaded diagnostic for: ${diagnosticMap.firmName}`);
  console.log(`   Tenant ID: ${diagnosticMap.tenantId}`);
  console.log(`   Diagnostic Date: ${diagnosticMap.diagnosticDate}`);
  console.log(`   Readiness Score: ${diagnosticMap.readinessScore}/100`);
  console.log(`   Implementation Tier: ${diagnosticMap.implementationTier}\n`);

  console.log('🚀 Starting pipeline...\n');

  try {
    const result = await ingestDiagnostic(diagnosticMap);

    console.log('\n✅ PIPELINE COMPLETE!');
    console.log('='.repeat(60));
    console.log(`   Diagnostic ID: ${result.diagnosticId}`);
    console.log(`   Tickets Generated: ${result.ticketCount}`);
    console.log(`   Roadmap Sections: ${result.roadmapSectionCount}`);
    console.log(`   Assistant Provisioned: ${result.assistantProvisioned ? 'Yes' : 'No'}`);
    console.log('\n🎉 Hayes Realty Group roadmap is now ready!');
    console.log('   View at: http://localhost:5173/roadmap\n');
  } catch (error) {
    console.error('\n❌ PIPELINE FAILED:');
    console.error(error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
