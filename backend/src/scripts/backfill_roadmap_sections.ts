#!/usr/bin/env tsx
/**
 * Backfill script: Migrate legacy file-based roadmaps to roadmap_sections table
 * 
 * This is a ONE-TIME migration script that:
 * 1. Finds all tenants with legacy roadmap files in storage/roadmaps/
 * 2. Reads the markdown files
 * 3. Writes them to roadmap_sections table via the OS service
 * 
 * Safe to run multiple times (upsert logic prevents duplicates)
 */

import fs from 'fs';
import path from 'path';
import { db } from '../db/index';
import { tenants } from '../db/schema';
import { getOrCreateRoadmapForTenant, upsertRoadmapSection, getSectionMetadata } from '../services/roadmapOs.service';

const STORAGE_DIR = path.join(__dirname, '../../storage/roadmaps');

type SectionKey =
  | 'summary'
  | '01-executive-summary'
  | '02-diagnostic-analysis'
  | '03-system-architecture'
  | '04-high-leverage-systems'
  | '05-implementation-plan'
  | '06-sop-pack'
  | '07-metrics-dashboard'
  | '08-appendix';

const SECTION_FILENAMES: Record<SectionKey, string> = {
  summary: 'summary.md',
  '01-executive-summary': '01-executive-summary.md',
  '02-diagnostic-analysis': '02-diagnostic-analysis.md',
  '03-system-architecture': '03-system-architecture.md',
  '04-high-leverage-systems': '04-high-leverage-systems.md',
  '05-implementation-plan': '05-implementation-plan.md',
  '06-sop-pack': '06-sop-pack.md',
  '07-metrics-dashboard': '07-metrics-dashboard.md',
  '08-appendix': '08-appendix.md',
};

async function backfillRoadmapSections() {
  console.log('🚀 Starting roadmap sections backfill...\n');

  // Check if storage directory exists
  if (!fs.existsSync(STORAGE_DIR)) {
    console.log('❌ No storage/roadmaps directory found. Nothing to migrate.');
    return;
  }

  // Get all tenant IDs with roadmap files
  const tenantDirs = fs.readdirSync(STORAGE_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  console.log(`Found ${tenantDirs.length} tenant directories with roadmap files\n`);

  let totalMigrated = 0;
  let totalSkipped = 0;

  for (const tenantId of tenantDirs) {
    // Skip non-UUID directories (like .gitkeep)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      console.log(`\n⏭️  Skipping non-UUID directory: ${tenantId}`);
      continue;
    }

    console.log(`\n📁 Processing tenant: ${tenantId}`);

    // Verify tenant exists in database
    const tenant = await db.query.tenants.findFirst({
      where: (t, { eq }) => eq(t.id, tenantId),
    });

    if (!tenant) {
      console.log(`  ⚠️  Tenant not found in database, skipping...`);
      totalSkipped++;
      continue;
    }

    console.log(`  ✅ Found tenant: ${tenant.name}`);

    // Get or create roadmap
    const roadmap = await getOrCreateRoadmapForTenant(tenantId);
    console.log(`  ✅ Roadmap ID: ${roadmap.id}`);

    const tenantDir = path.join(STORAGE_DIR, tenantId);
    let sectionsMigrated = 0;

    // Process each section file
    for (const [sectionKey, filename] of Object.entries(SECTION_FILENAMES)) {
      const filePath = path.join(tenantDir, filename);

      if (!fs.existsSync(filePath)) {
        console.log(`    ⏭️  ${filename} not found, skipping...`);
        continue;
      }

      // Read markdown content
      const contentMarkdown = fs.readFileSync(filePath, 'utf-8');
      const metadata = getSectionMetadata(sectionKey);

      if (!metadata) {
        console.log(`    ❌ Unknown section key: ${sectionKey}`);
        continue;
      }

      // Upsert to database
      const wordCount = contentMarkdown.split(/\s+/).filter(Boolean).length;
      await upsertRoadmapSection({
        roadmapId: roadmap.id,
        sectionNumber: metadata.number,
        sectionName: metadata.name,
        contentMarkdown,
        wordCount,
      });

      console.log(`    ✅ Migrated: ${metadata.name} (${wordCount} words)`);
      sectionsMigrated++;
    }

    console.log(`  📊 Migrated ${sectionsMigrated} sections for ${tenant.name}`);
    totalMigrated++;
  }

  console.log(`\n✨ Backfill complete!`);
  console.log(`   Tenants migrated: ${totalMigrated}`);
  console.log(`   Tenants skipped: ${totalSkipped}`);
}

// Run the migration
backfillRoadmapSections()
  .then(() => {
    console.log('\n✅ Migration successful');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
