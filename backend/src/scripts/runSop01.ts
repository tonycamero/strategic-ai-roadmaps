#!/usr/bin/env node
import * as dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { db } from '../db';
import { tenants, tenantDocuments } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { buildNormalizedIntakeContext } from '../services/intakeNormalizer';
import { generateSop01Outputs } from '../services/sop01Engine';

async function main() {
  const [, , tenantIdArg] = process.argv;

  if (!tenantIdArg) {
    console.error('❌ Usage: npm run sop01:run -- <tenantId>');
    console.error('   Example: npm run sop01:run -- 4e2c6eb1-0767-43d6-b6a4-3fca8efd3f64');
    process.exit(1);
  }

  const tenantId = tenantIdArg;

  console.log('🔬 SOP-01 Diagnostic Generator\n');
  console.log(`   Tenant ID: ${tenantId}\n`);

  // Verify tenant exists
  const [tenant] = await db
    .select({ id: tenants.id, name: tenants.name })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant) {
    console.error(`❌ Tenant not found: ${tenantId}`);
    process.exit(1);
  }

  console.log(`✓ Tenant: ${tenant.name}\n`);

  // Step 1: Build normalized intake context
  console.log('📊 Step 1: Normalizing intake data...');
  const context = await buildNormalizedIntakeContext(tenantId);
  console.log(`   ✓ Normalized ${Object.keys(context.roles).filter(r => Object.keys(context.roles[r as keyof typeof context.roles]).length > 0).length} roles`);
  console.log(`   ✓ Generated ${context.matrixView.length} theme views`);
  console.log(`   ✓ Detected ${context.contradictions.length} contradictions`);
  console.log(`   ✓ Detected ${context.chokePoints.length} choke points`);
  console.log(`   ✓ Found ${context.missingData.length} missing data points\n`);

  // Step 2: Generate SOP-01 outputs via AI
  console.log('🤖 Step 2: Generating diagnostic outputs via AI...');
  const outputs = await generateSop01Outputs(context);
  console.log('   ✓ Company Diagnostic Map generated');
  console.log('   ✓ AI Leverage Map generated');
  console.log('   ✓ Discovery Call Questions generated (15)');
  console.log('   ✓ Roadmap Skeleton generated\n');

  // Step 3: Write to filesystem
  console.log('💾 Step 3: Writing outputs to filesystem...');
  const storageDir = path.join(process.cwd(), 'storage', 'sop01', tenantId);
  
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
    console.log(`   ✓ Created directory: ${storageDir}`);
  }

  const files = [
    {
      filename: 'output1_company_diagnostic_map.md',
      content: outputs.companyDiagnosticMap,
      title: 'Company Diagnostic Map',
      outputNumber: 'Output-1',
    },
    {
      filename: 'output2_ai_leverage_map.md',
      content: outputs.aiLeverageMap,
      title: 'AI Leverage & Opportunity Map',
      outputNumber: 'Output-2',
    },
    {
      filename: 'output3_discovery_call_questions.md',
      content: `# Discovery Call Questions\n\n${outputs.discoveryCallQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`,
      title: 'Discovery Call Preparation Questions',
      outputNumber: 'Output-3',
    },
    {
      filename: 'output4_roadmap_skeleton.md',
      content: outputs.roadmapSkeleton,
      title: 'Strategic Roadmap Skeleton',
      outputNumber: 'Output-4',
    },
  ];

  for (const file of files) {
    const filePath = path.join(storageDir, file.filename);
    fs.writeFileSync(filePath, file.content, 'utf8');
    console.log(`   ✓ Wrote ${file.filename} (${file.content.length} chars)`);
  }

  // Step 4: Persist to tenant_documents
  console.log('\n📝 Step 4: Persisting to tenant_documents...');
  
  for (const file of files) {
    const filePath = path.join(storageDir, file.filename);
    const fileSize = Buffer.byteLength(file.content, 'utf8');

    // Check if document already exists
    const existing = await db
      .select()
      .from(tenantDocuments)
      .where(
        and(
          eq(tenantDocuments.tenantId, tenantId),
          eq(tenantDocuments.sopNumber, 'SOP-01'),
          eq(tenantDocuments.outputNumber, file.outputNumber)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing record
      await db
        .update(tenantDocuments)
        .set({
          filePath,
          fileSize,
          updatedAt: new Date(),
        })
        .where(eq(tenantDocuments.id, existing[0].id));
      
      console.log(`   ✓ Updated ${file.outputNumber}: ${file.title}`);
    } else {
      // Insert new record
      await db.insert(tenantDocuments).values({
        tenantId,
        filename: file.filename,
        originalFilename: file.filename,
        filePath,
        fileSize,
        mimeType: 'text/markdown',
        category: 'sop_output',
        title: file.title,
        description: `SOP-01 output: ${file.title}`,
        sopNumber: 'SOP-01',
        outputNumber: file.outputNumber,
        uploadedBy: null,
        isPublic: false,
      });

      console.log(`   ✓ Created ${file.outputNumber}: ${file.title}`);
    }
  }

  console.log('\n✅ SOP-01 generation complete!\n');
  console.log(`📂 Files saved to: ${storageDir}`);
  console.log(`📊 Database records: 4 documents in tenant_documents\n`);
  console.log('Next steps:');
  console.log('  1. Review diagnostic outputs');
  console.log('  2. Conduct discovery call using generated questions');
  console.log('  3. Save discovery notes: npm run discovery:save -- <tenantId> <notes.md>');
  console.log('  4. Generate roadmap via SuperAdmin UI or POST /api/superadmin/firms/:tenantId/generate-roadmap\n');
}

main().catch((err) => {
  console.error('\n❌ SOP-01 generation failed:', err);
  process.exit(1);
});
