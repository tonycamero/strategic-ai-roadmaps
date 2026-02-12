import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { db } from '../db/index.ts';
import { tenants, tenantDocuments } from '../db/schema.ts';
import { eq, and } from 'drizzle-orm';

const HAYES_TENANT_ID = '4e2c6eb1-0767-43d6-b6a4-3fca8efd3f64';
const ROADMAP_DIR = path.join(__dirname, '../../storage/roadmaps/hayes');

interface RoadmapSection {
  filename: string;
  section: string;
  order: number;
}

const ROADMAP_SECTIONS: RoadmapSection[] = [
  { filename: 'summary.md', section: 'summary', order: 0 },
  { filename: '01-executive-summary.md', section: '01-executive-summary', order: 1 },
  { filename: '02-diagnostic-analysis.md', section: '02-diagnostic-analysis', order: 2 },
  { filename: '03-system-architecture.md', section: '03-system-architecture', order: 3 },
  { filename: '04-high-leverage-systems.md', section: '04-high-leverage-systems', order: 4 },
  { filename: '05-implementation-plan.md', section: '05-implementation-plan', order: 5 },
  { filename: '06-sop-pack.md', section: '06-sop-pack', order: 6 },
  { filename: '07-metrics-dashboard.md', section: '07-metrics-dashboard', order: 7 },
  { filename: '08-appendix.md', section: '08-appendix', order: 8 },
];

/**
 * Extract title from markdown file (first # heading)
 */
function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : 'Untitled';
}

/**
 * Upload a single roadmap section to tenant_documents
 */
async function uploadSection(section: RoadmapSection, ownerId: string): Promise<void> {
  const filePath = path.join(ROADMAP_DIR, section.filename);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const title = extractTitle(content);
  const fileSize = Buffer.byteLength(content, 'utf-8');

  // Check if document already exists
  const existing = await db.query.tenantDocuments.findFirst({
    where: and(
      eq(tenantDocuments.tenantId, HAYES_TENANT_ID),
      eq(tenantDocuments.category, 'roadmap'),
      eq(tenantDocuments.filePath, filePath)
    ),
  });

  if (existing) {
    console.log(`⏭️  Skipping ${section.filename} - already exists (ID: ${existing.id})`);
    return;
  }

  // Insert document record
  const documentId = randomUUID();
  await db.insert(tenantDocuments).values({
    id: documentId,
    tenantId: HAYES_TENANT_ID,
    ownerUserId: ownerId,
    filename: section.filename,
    originalFilename: section.filename,
    title,
    description: `Roadmap section: ${title}`,
    category: 'roadmap',
    filePath,
    fileSize,
    mimeType: 'text/markdown',
    uploadedBy: ownerId,
  });

  console.log(`✅ Uploaded ${section.filename} → "${title}" (${fileSize} bytes, order ${section.order})`);
}

/**
 * Main upload function
 */
async function uploadHayesRoadmap(): Promise<void> {
  console.log(`\n🚀 Uploading Hayes Real Estate Group roadmap...`);
  console.log(`   Tenant ID: ${HAYES_TENANT_ID}`);
  console.log(`   Source: ${ROADMAP_DIR}`);
  console.log(`   Sections: ${ROADMAP_SECTIONS.length}\n`);

  // Verify Hayes tenant exists
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, HAYES_TENANT_ID),
  });
  if (!tenant) {
    console.error(`❌ Tenant not found: ${HAYES_TENANT_ID}`);
    process.exit(1);
  }

  console.log(`   Tenant: ${tenant.name}\n`);
  
  const ownerId = tenant.ownerUserId;

  // Upload each section
  for (const section of ROADMAP_SECTIONS) {
    await uploadSection(section, ownerId);
  }

  console.log(`\n✨ Upload complete!`);
  console.log(`\nVerify at:`);
  console.log(`   - Owner view: http://localhost:5173/roadmap`);
  console.log(`   - SuperAdmin view: http://localhost:5173/superadmin/tenant/${HAYES_TENANT_ID}/roadmap`);
}

// Execute if run directly
if (require.main === module) {
  uploadHayesRoadmap()
    .then(() => {
      console.log('\n✅ Script complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

export { uploadHayesRoadmap };
