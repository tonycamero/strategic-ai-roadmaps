import fs from 'fs';
import path from 'path';
import os from 'os';
import { db } from '../db';
import { tenants, tenantDocuments } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { getStorageProvider, s3PutText } from './storage';

type RoadmapSectionKey =
  | 'summary'
  | '01-executive-summary'
  | '02-diagnostic-analysis'
  | '03-system-architecture'
  | '04-high-leverage-systems'
  | '05-implementation-plan'
  | '06-sop-pack'
  | '07-metrics-dashboard'
  | '08-appendix';

const SECTION_TO_FILENAME: Record<RoadmapSectionKey, string> = {
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

function extractTitle(markdown: string, fallback: string): string {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : fallback;
}

export async function persistRoadmapSectionsForTenant(
  tenantId: string,
  sections: Record<RoadmapSectionKey, string>
): Promise<void> {
  // Verify tenant exists
  const [tenant] = await db
    .select({ id: tenants.id, ownerUserId: tenants.ownerUserId })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant) {
    throw new Error(`Tenant not found: ${tenantId}`);
  }

  // Ensure storage directory exists
  // Use /tmp in production/serverless environments, otherwise use local storage
  const baseStorageDir = process.env.NODE_ENV === 'production' || !fs.existsSync(path.join(process.cwd(), 'storage'))
    ? path.join(os.tmpdir(), 'strategic-ai-roadmaps', 'roadmaps')
    : path.join(process.cwd(), 'storage', 'roadmaps');
  
  const baseDir = path.join(baseStorageDir, tenantId);
  
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  // Process each section
  const keys = Object.keys(sections) as RoadmapSectionKey[];
  
  for (const sectionKey of keys) {
    const content = sections[sectionKey];
    const filename = SECTION_TO_FILENAME[sectionKey];
    const filePath = path.join(baseDir, filename);

    // Write file (best-effort in dev)
    try { fs.writeFileSync(filePath, content, 'utf-8'); } catch {}
    const fileSize = Buffer.byteLength(content, 'utf-8');
    const title = extractTitle(
      content,
      `Roadmap – ${sectionKey.replace(/-/g, ' ')}`
    );
    const provider = getStorageProvider();
    let s3Key: string | null = null;
    if (provider === 's3') {
      const r = await s3PutText({ tenantId, subdir: 'roadmaps', filename, content, contentType: 'text/markdown; charset=utf-8' });
      s3Key = r.key;
    }

    // Check for existing document
    const existing = await db.query.tenantDocuments.findFirst({
      where: and(
        eq(tenantDocuments.tenantId, tenantId),
        eq(tenantDocuments.category, 'roadmap'),
        eq(tenantDocuments.section, sectionKey)
      ),
    });

    if (existing) {
      // Update existing record
      await db
        .update(tenantDocuments)
        .set({
          title,
          description: `Strategic AI Roadmap section: ${sectionKey}`,
          filePath: s3Key || filePath,
          fileSize,
          content,
          storageProvider: s3Key ? 's3' : 'db',
          updatedAt: new Date(),
        })
        .where(eq(tenantDocuments.id, existing.id));
    } else {
      // Insert new record
      await db.insert(tenantDocuments).values({
        tenantId,
        ownerUserId: tenant.ownerUserId,
        filename,
        originalFilename: filename,
        title,
        description: `Strategic AI Roadmap section: ${sectionKey}`,
        category: 'roadmap',
        section: sectionKey,
        filePath: s3Key || filePath,
        fileSize,
        mimeType: 'text/markdown',
        uploadedBy: tenant.ownerUserId,
        content,
        storageProvider: s3Key ? 's3' : 'db',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }
}
