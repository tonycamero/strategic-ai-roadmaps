import fs from 'fs';
import path from 'path';
import os from 'os';
import { db } from '../db';
import { tenants, tenantDocuments } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { getStorageProvider, s3PutText } from './storage';

interface SOP01Outputs {
  companyDiagnosticMap: string;
  aiLeverageMap: string;
  discoveryCallQuestions: string[];
  roadmapSkeleton: string;
}

export async function persistSop01OutputsForTenant(
  tenantId: string,
  outputs: SOP01Outputs
): Promise<void> {
  // Verify tenant exists
  const [tenant] = await db
    .select({ id: tenants.id, name: tenants.name, ownerUserId: tenants.ownerUserId })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant) {
    throw new Error(`Tenant not found: ${tenantId}`);
  }

  // Ensure storage directory exists
  // Use /tmp in production/serverless environments, otherwise use local storage
  const baseStorageDir = process.env.NODE_ENV === 'production' || !fs.existsSync(path.join(process.cwd(), 'storage'))
    ? path.join(os.tmpdir(), 'strategic-ai-roadmaps', 'sop01')
    : path.join(process.cwd(), 'storage', 'sop01');
  
  const storageDir = path.join(baseStorageDir, tenantId);
  
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
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

  // Write files to filesystem (best-effort for local/dev)
  for (const file of files) {
    try {
      const filePath = path.join(storageDir, file.filename);
      fs.writeFileSync(filePath, file.content, 'utf8');
    } catch {}
  }

  // Upsert to tenant_documents (store content in DB for durability)
  const provider = getStorageProvider();

  for (const file of files) {
    const filePath = path.join(storageDir, file.filename);
    const fileSize = Buffer.byteLength(file.content, 'utf8');
    let s3Key: string | null = null;
    if (provider === 's3') {
      const r = await s3PutText({ tenantId, subdir: 'sop01', filename: file.filename, content: file.content, contentType: 'text/markdown; charset=utf-8' });
      s3Key = r.key;
    }

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
          filePath: s3Key || filePath,
          fileSize,
          content: file.content,
          storageProvider: s3Key ? 's3' : 'db',
          updatedAt: new Date(),
        })
        .where(eq(tenantDocuments.id, existing[0].id));
    } else {
      // Insert new record
      await db.insert(tenantDocuments).values({
        tenantId,
        ownerUserId: tenant.ownerUserId,
        filename: file.filename,
        originalFilename: file.filename,
        filePath: s3Key || filePath,
        fileSize,
        mimeType: 'text/markdown',
        category: 'sop_output',
        title: file.title,
        content: file.content,
        storageProvider: s3Key ? 's3' : 'db',
        sopNumber: 'SOP-01',
        outputNumber: file.outputNumber,
        section: null,
        uploadedBy: null,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }
}
